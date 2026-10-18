import { useEffect, useMemo, useRef, useState } from "react";
import { ActionIcon, Alert, Badge, Button, Group, Loader, Modal, Text, TextInput, Tooltip } from "@mantine/core";
import {
  IconArrowBackUp,
  IconBan,
  IconCheck,
  IconCopy,
  IconDownload,
  IconEye,
  IconFileSearch,
  IconFileTypeDocx,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { PUBLIC, cleanText, newCode, normCode, safeFileName, verifyLink } from "./certSchema";
import { fingerprintsOf, isDocx, snapshotDocx, stampDocx } from "./docStamp";
import styles from "./Documents.module.css";

export const DOCUMENTS = "documents";
const SNAPSHOT = "snapshot";
const NS = ["internal/Certificates", "internal/Internal"];

const titleFromFile = (name) => cleanText(name.replace(/\.docx$/i, "").replace(/[_-]+/g, " "));

const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const publicCopy = (d) => ({
  type: "document",
  title: d.title,
  code: d.code,
  issuedAt: d.createdAt || null,
  status: d.status === "revoked" ? "revoked" : "valid",
  revokedReason: d.status === "revoked" ? d.revokedReason || "" : "",
});

/**
 * Word documents with a verification QR: drop a .docx, get it back with the
 * QR on it. The file itself is never uploaded or kept — only a picture of
 * page 1, its text and two fingerprints, so the dashboard can show (and check)
 * which document a code belongs to.
 */
export default function DocumentsPanel({ notify, takenCodes }) {
  const { t, i18n } = useTranslation(NS);
  const { user, email } = useAccess();
  const [docs, setDocs] = useState(null);
  const [draft, setDraft] = useState(null); // { file, title, result, snapshot, thumb, code, busy, error }
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [check, setCheck] = useState(null); // { busy } | { match, how } | { none }
  const pick = useRef(null);
  const checkPick = useRef(null);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, DOCUMENTS), orderBy("createdAt", "desc")),
        (snap) => setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error("Could not load documents:", err);
          setDocs([]);
        }
      ),
    []
  );

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-u-nu-latn" : i18n.language === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric" }),
    [i18n.language]
  );
  const when = (v) => (v?.toDate ? dateFormat.format(v.toDate()) : "");

  // 1. a file is dropped: stamp it straight away and show the result
  const prepare = async (file) => {
    if (!file) return;
    if (!isDocx(file)) {
      setDraft({ file, error: "notDocx" });
      return;
    }
    const taken = new Set([...takenCodes(), ...(docs || []).map((d) => normCode(d.code))]);
    const code = newCode(taken);
    setDraft({ file, title: titleFromFile(file.name), code, busy: "stamping" });
    try {
      const result = await stampDocx(file, verifyLink(code));
      setDraft((d) => ({ ...d, result, busy: "snapshot" }));
      const pics = await snapshotDocx(result.blob).catch((err) => {
        console.error("Snapshot failed:", err);
        return { snapshot: "", thumb: "" };
      });
      setDraft((d) => ({ ...d, ...pics, busy: "" }));
    } catch (err) {
      console.error("Could not stamp the document:", err);
      setDraft({ file, error: err.message === "already-stamped" ? "alreadyStamped" : "unreadable" });
    }
  };

  // 2. one button: save the record and download the stamped file
  const save = async () => {
    const { result, code, snapshot, thumb, file } = draft;
    const title = cleanText(draft.title) || titleFromFile(file.name);
    setDraft((d) => ({ ...d, busy: "saving" }));
    try {
      // never write over a code that already exists
      if ((await getDoc(doc(db, PUBLIC, code))).exists()) throw new Error("taken");
      const ref = doc(collection(db, DOCUMENTS));
      const record = {
        title,
        code,
        fileName: cleanText(file.name),
        fileHash: result.fileHash,
        textHash: result.textHash,
        text: result.text.slice(0, 3000),
        thumb: thumb || "",
        status: "valid",
        createdAt: serverTimestamp(),
        createdBy: email || "unknown",
      };
      await auditedWrite(
        user,
        { area: "certificates", action: "doc.stamp", target: code, label: title, details: { file: file.name } },
        (batch, auditId) => {
          batch.set(ref, { ...record, auditId });
          if (snapshot) batch.set(doc(db, DOCUMENTS, ref.id, SNAPSHOT, "page1"), { dataUrl: snapshot, auditId });
          batch.set(doc(db, PUBLIC, code), { ...publicCopy({ ...record, createdAt: serverTimestamp() }), auditId });
        }
      );
      download(result.blob, `${safeFileName(title) || "document"} (QR).docx`);
      notify("success", t("documents.savedTitle"), t("documents.savedText", { code }));
      setDraft(null);
    } catch (err) {
      console.error("Could not save the document:", err);
      notify("error", t("errors.failedTitle"), t("errors.failed"));
      setDraft((d) => ({ ...d, busy: "" }));
    }
  };

  const setRevoked = async (d, revoked) => {
    const changes = revoked ? { status: "revoked", revokedAt: serverTimestamp() } : { status: "valid" };
    try {
      await auditedWrite(
        user,
        { area: "certificates", action: revoked ? "doc.revoke" : "doc.restore", target: d.code, label: d.title },
        (batch, auditId) => {
          batch.update(doc(db, DOCUMENTS, d.id), { ...changes, auditId });
          batch.set(doc(db, PUBLIC, d.code), { ...publicCopy({ ...d, ...changes }), auditId }, { merge: true });
        }
      );
    } catch (err) {
      console.error(err);
      notify("error", t("errors.failedTitle"), t("errors.failed"));
    }
  };

  const remove = async (d) => {
    try {
      const pub = await getDoc(doc(db, PUBLIC, d.code));
      const shot = await getDoc(doc(db, DOCUMENTS, d.id, SNAPSHOT, "page1"));
      await auditedWrite(user, { area: "certificates", action: "doc.delete", target: d.code, label: d.title }, (batch, _a, markDelete) => {
        if (shot.exists()) {
          batch.delete(shot.ref);
          markDelete(`documents~${d.id}~snapshot~page1`, shot.data().auditId);
        }
        batch.delete(doc(db, DOCUMENTS, d.id));
        markDelete(`documents~${d.id}`, d.auditId);
        if (pub.exists()) {
          batch.delete(pub.ref);
          markDelete(`certificate_public~${d.code}`, pub.data().auditId);
        }
      });
      setDeleting(null);
    } catch (err) {
      console.error(err);
      notify("error", t("errors.failedTitle"), t("errors.failed"));
    }
  };

  // Check a file: same file, or the same text after edits in Word
  const runCheck = async (file) => {
    if (!file) return;
    if (!isDocx(file)) return setCheck({ none: true, notDocx: true });
    setCheck({ busy: true });
    try {
      const { fileHash, textHash } = await fingerprintsOf(file);
      const byFile = await getDocs(query(collection(db, DOCUMENTS), where("fileHash", "==", fileHash), limit(1)));
      if (!byFile.empty) return setCheck({ match: { id: byFile.docs[0].id, ...byFile.docs[0].data() }, how: "file" });
      const byText = await getDocs(query(collection(db, DOCUMENTS), where("textHash", "==", textHash), limit(1)));
      if (!byText.empty) return setCheck({ match: { id: byText.docs[0].id, ...byText.docs[0].data() }, how: "text" });
      setCheck({ none: true });
    } catch (err) {
      console.error(err);
      setCheck({ none: true });
    }
  };

  const onDrop = (handler) => (e) => {
    e.preventDefault();
    handler(e.dataTransfer.files?.[0]);
  };

  return (
    <div className={styles.panel}>
      {/* ── stamp a document ── */}
      {!draft ? (
        <button
          type="button"
          className={styles.drop}
          onClick={() => pick.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop(prepare)}
        >
          <IconFileTypeDocx size={40} stroke={1.5} />
          <span className={styles.dropTitle}>{t("documents.dropTitle")}</span>
          <span className={styles.dropText}>{t("documents.dropText")}</span>
        </button>
      ) : (
        <div className={styles.draft}>
          {draft.error ? (
            <Alert color="red" radius="md" withCloseButton onClose={() => setDraft(null)} title={t(`documents.errors.${draft.error}`)}>
              {draft.file?.name}
            </Alert>
          ) : (
            <>
              <div className={styles.preview}>
                {draft.snapshot ? (
                  <img src={draft.snapshot} alt="" />
                ) : (
                  <div className={styles.previewBusy}>
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                      {t(`documents.busy.${draft.busy || "snapshot"}`)}
                    </Text>
                  </div>
                )}
              </div>
              <div className={styles.draftSide}>
                <Text size="xs" c="dimmed" className={styles.fileName}>
                  <IconFileTypeDocx size={14} /> {draft.file.name}
                </Text>
                <TextInput
                  label={t("documents.title")}
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.currentTarget.value }))}
                  description={t("documents.titleHint")}
                  dir="auto"
                />
                <Text size="sm" c="dimmed">
                  {t("documents.qrHint")}
                </Text>
                <Text size="xs" c="dimmed">
                  {t("documents.code")}: <bdi className={styles.code}>{draft.code}</bdi>
                </Text>
                <Group gap="sm" mt="xs">
                  <Button
                    className={styles.primary}
                    leftSection={<IconDownload size={17} />}
                    loading={draft.busy === "saving"}
                    disabled={!draft.result || draft.busy === "stamping"}
                    onClick={save}
                  >
                    {t("documents.save")}
                  </Button>
                  <Button variant="default" leftSection={<IconX size={16} />} onClick={() => setDraft(null)} disabled={draft.busy === "saving"}>
                    {t("common.cancel")}
                  </Button>
                </Group>
              </div>
            </>
          )}
        </div>
      )}
      <input ref={pick} type="file" accept=".docx" hidden onChange={(e) => (prepare(e.target.files?.[0]), (e.target.value = ""))} />

      {/* ── the documents ── */}
      <div className={styles.listHead}>
        <Text fw={700}>{t("documents.listTitle", { count: docs?.length || 0 })}</Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconFileSearch size={15} />}
          onClick={() => checkPick.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop(runCheck)}
          loading={!!check?.busy}
        >
          {t("documents.check")}
        </Button>
        <input ref={checkPick} type="file" accept=".docx" hidden onChange={(e) => (runCheck(e.target.files?.[0]), (e.target.value = ""))} />
      </div>

      {check && !check.busy && (
        <Alert
          color={check.match ? (check.how === "file" ? "teal" : "yellow") : "red"}
          radius="md"
          withCloseButton
          onClose={() => setCheck(null)}
          title={check.match ? t(`documents.checkResult.${check.how}`) : t("documents.checkResult.none")}
        >
          {check.match && (
            <>
              <bdi dir="auto">{check.match.title}</bdi> · <bdi className={styles.code}>{check.match.code}</bdi> · {when(check.match.createdAt)}
            </>
          )}
        </Alert>
      )}

      {docs === null ? (
        <Group justify="center" py="lg">
          <Loader size="sm" />
        </Group>
      ) : docs.length === 0 ? (
        <Text c="dimmed" ta="center" py="lg">
          {t("documents.empty")}
        </Text>
      ) : (
        <ul className={styles.list}>
          {docs.map((d) => {
            const revoked = d.status === "revoked";
            return (
              <li key={d.id} className={`${styles.row} ${revoked ? styles.revoked : ""}`}>
                <button type="button" className={styles.thumb} onClick={() => setViewing(d)} aria-label={t("documents.view")}>
                  {d.thumb ? <img src={d.thumb} alt="" /> : <IconFileTypeDocx size={26} />}
                </button>
                <div className={styles.info}>
                  <Text fw={700} dir="auto" className={styles.rowTitle}>
                    {d.title}
                  </Text>
                  <Text size="xs" c="dimmed">
                    <bdi className={styles.code}>{d.code}</bdi> · {when(d.createdAt)} · {d.createdBy}
                  </Text>
                  {revoked && (
                    <Badge color="red" variant="light" size="sm" mt={4}>
                      {t("status.revoked")}
                    </Badge>
                  )}
                </div>
                <div className={styles.actions}>
                  <Tooltip label={t("documents.view")}>
                    <ActionIcon variant="subtle" onClick={() => setViewing(d)}>
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("documents.copyLink")}>
                    <ActionIcon variant="subtle" onClick={() => navigator.clipboard?.writeText(verifyLink(d.code))}>
                      <IconCopy size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={revoked ? t("documents.restore") : t("documents.revoke")}>
                    <ActionIcon variant="subtle" color={revoked ? "teal" : "orange"} onClick={() => setRevoked(d, !revoked)}>
                      {revoked ? <IconArrowBackUp size={18} /> : <IconBan size={18} />}
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("documents.delete")}>
                    <ActionIcon variant="subtle" color="red" onClick={() => setDeleting(d)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DocumentViewer doc={viewing} onClose={() => setViewing(null)} when={when} />

      <Modal opened={!!deleting} onClose={() => setDeleting(null)} title={t("documents.deleteTitle")} centered>
        <Text size="sm">{t("documents.deleteText", { title: deleting?.title || "" })}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setDeleting(null)}>
            {t("common.cancel")}
          </Button>
          <Button color="red" onClick={() => remove(deleting)}>
            {t("documents.delete")}
          </Button>
        </Group>
      </Modal>
    </div>
  );
}

// The record of one document: its page-1 picture, text and fingerprints.
function DocumentViewer({ doc: d, onClose, when }) {
  const { t } = useTranslation(NS);
  const [shot, setShot] = useState({ id: null, url: "" });

  useEffect(() => {
    if (!d) return;
    let alive = true;
    getDoc(doc(db, DOCUMENTS, d.id, SNAPSHOT, "page1"))
      .then((s) => alive && setShot({ id: d.id, url: s.exists() ? s.data().dataUrl : "" }))
      .catch(() => alive && setShot({ id: d.id, url: "" }));
    return () => {
      alive = false;
    };
  }, [d]);

  return (
    <Modal opened={!!d} onClose={onClose} title={d?.title} size="xl" centered>
      {d && (
        <div className={styles.viewer}>
          <div className={styles.viewerShot}>
            {shot.id !== d.id ? <Loader size="sm" /> : shot.url ? <img src={shot.url} alt="" /> : <Text c="dimmed">{t("documents.noSnapshot")}</Text>}
          </div>
          <dl className={styles.facts}>
            <dt>{t("documents.code")}</dt>
            <dd>
              <bdi className={styles.code}>{d.code}</bdi>
            </dd>
            <dt>{t("documents.issued")}</dt>
            <dd>
              {when(d.createdAt)} · {d.createdBy}
            </dd>
            <dt>{t("documents.file")}</dt>
            <dd dir="auto">{d.fileName}</dd>
            <dt>{t("documents.fingerprint")}</dt>
            <dd>
              <code className={styles.hash}>{d.fileHash}</code>
            </dd>
          </dl>
          {d.text && (
            <details className={styles.text}>
              <summary>
                <IconCheck size={14} /> {t("documents.textTitle")}
              </summary>
              <p dir="auto">{d.text}</p>
            </details>
          )}
        </div>
      )}
    </Modal>
  );
}
