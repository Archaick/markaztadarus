import { useEffect, useMemo, useRef, useState } from "react";
import { ActionIcon, Alert, Badge, Button, Group, Loader, Modal, Text, Tooltip } from "@mantine/core";
import { IconEye, IconFileSearch, IconFileTypeDocx, IconPencil, IconReplace } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { CERTS, isRevoked, normCode } from "./certSchema";
import { fingerprintsOf, isDocx } from "./docStamp";
import { SNAPSHOT, SNAPSHOT_DOC } from "./useWordAttach";
import styles from "./Documents.module.css";

const NS = ["internal/Certificates", "internal/Internal"];

/**
 * Certificates that come with a Word file. Dropping a .docx here starts a new
 * certificate (the usual editor); on save the file gets that certificate's
 * QR and downloads back. A certificate made elsewhere can be given a Word
 * file with the Word button on its row. Nothing of the file is uploaded but
 * its text, fingerprints and a picture of page 1.
 */
export default function DocumentsPanel({ certs, attach, busy, onNewFromFile, onEdit, nameOf, describe }) {
  const { t, i18n } = useTranslation(NS);
  const [viewing, setViewing] = useState(null);
  const [check, setCheck] = useState(null); // { match, how } | { none }
  const [replaceFor, setReplaceFor] = useState(null);
  const pick = useRef(null);
  const checkPick = useRef(null);
  const replacePick = useRef(null);

  const withDocs = useMemo(
    () =>
      (certs || [])
        .filter((c) => c.doc?.fileHash)
        .sort((a, b) => (b.doc.attachedAt?.toMillis?.() || 0) - (a.doc.attachedAt?.toMillis?.() || 0)),
    [certs]
  );

  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-u-nu-latn" : i18n.language === "en" ? "en-GB" : "id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [i18n.language]
  );
  const when = (v) => (v?.toDate ? dateFormat.format(v.toDate()) : "");

  // Check a file: the same file, or the same text after edits in Word
  const runCheck = async (file) => {
    if (!file) return;
    if (!isDocx(file)) return setCheck({ none: true });
    try {
      const { fileHash, textHash } = await fingerprintsOf(file);
      const exact = withDocs.find((c) => c.doc.fileHash === fileHash);
      if (exact) return setCheck({ match: exact, how: "file" });
      const same = withDocs.find((c) => c.doc.textHash === textHash);
      setCheck(same ? { match: same, how: "text" } : { none: true });
    } catch {
      setCheck({ none: true });
    }
  };

  const onDrop = (handler) => (e) => {
    e.preventDefault();
    handler(e.dataTransfer.files?.[0]);
  };

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={styles.drop}
        onClick={() => pick.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop(onNewFromFile)}
      >
        <IconFileTypeDocx size={40} stroke={1.5} />
        <span className={styles.dropTitle}>{t("documents.dropTitle")}</span>
        <span className={styles.dropText}>{t("documents.dropText")}</span>
      </button>
      <input ref={pick} type="file" accept=".docx" hidden onChange={(e) => (onNewFromFile(e.target.files?.[0]), (e.target.value = ""))} />

      <div className={styles.listHead}>
        <Text fw={700}>{t("documents.listTitle", { count: withDocs.length })}</Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconFileSearch size={15} />}
          onClick={() => checkPick.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop(runCheck)}
        >
          {t("documents.check")}
        </Button>
        <input ref={checkPick} type="file" accept=".docx" hidden onChange={(e) => (runCheck(e.target.files?.[0]), (e.target.value = ""))} />
      </div>

      {check && (
        <Alert
          color={check.match ? (check.how === "file" ? "teal" : "yellow") : "red"}
          radius="md"
          withCloseButton
          onClose={() => setCheck(null)}
          title={check.match ? t(`documents.checkResult.${check.how}`) : t("documents.checkResult.none")}
        >
          {check.match && (
            <>
              <bdi dir="auto">{nameOf(check.match)}</bdi> · <bdi className={styles.code}>{check.match.code}</bdi> · {when(check.match.doc.attachedAt)}
            </>
          )}
        </Alert>
      )}

      {certs === null ? (
        <Group justify="center" py="lg">
          <Loader size="sm" />
        </Group>
      ) : withDocs.length === 0 ? (
        <Text c="dimmed" ta="center" py="lg">
          {t("documents.empty")}
        </Text>
      ) : (
        <ul className={styles.list}>
          {withDocs.map((c) => (
            <li key={c.id} className={`${styles.row} ${isRevoked(c) ? styles.revoked : ""}`}>
              <button type="button" className={styles.thumb} onClick={() => setViewing(c)} aria-label={t("documents.view")}>
                {c.doc.thumb ? <img src={c.doc.thumb} alt="" /> : <IconFileTypeDocx size={26} />}
              </button>
              <div className={styles.info}>
                <Text fw={700} dir="auto" className={styles.rowTitle}>
                  {nameOf(c)}
                </Text>
                <Text size="sm" c="dimmed" dir="auto" lineClamp={1}>
                  {describe(c)}
                </Text>
                <Text size="xs" c="dimmed">
                  <bdi className={styles.code}>{c.code}</bdi> · {when(c.doc.attachedAt)} · <bdi dir="auto">{c.doc.fileName}</bdi>
                </Text>
                {isRevoked(c) && (
                  <Badge color="red" variant="light" size="sm" mt={4}>
                    {t("status.revoked")}
                  </Badge>
                )}
              </div>
              <div className={styles.actions}>
                <Tooltip label={t("documents.view")}>
                  <ActionIcon variant="subtle" onClick={() => setViewing(c)}>
                    <IconEye size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t("row.edit")}>
                  <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(c)}>
                    <IconPencil size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t("documents.replace")}>
                  <ActionIcon
                    variant="subtle"
                    color="yellow"
                    loading={busy === c.id}
                    onClick={() => {
                      setReplaceFor(c);
                      replacePick.current?.click();
                    }}
                  >
                    <IconReplace size={18} />
                  </ActionIcon>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={replacePick}
        type="file"
        accept=".docx"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (replaceFor && file) attach(replaceFor, file);
        }}
      />

      <DocumentViewer cert={viewing} onClose={() => setViewing(null)} when={when} nameOf={nameOf} />
    </div>
  );
}

// A certificate's Word file: its page-1 picture, text and fingerprint.
export function DocumentViewer({ cert, onClose, when, nameOf }) {
  const { t } = useTranslation(NS);
  const [shot, setShot] = useState({ id: null, url: "" });

  useEffect(() => {
    if (!cert) return undefined;
    let alive = true;
    getDoc(doc(db, CERTS, cert.id, SNAPSHOT, SNAPSHOT_DOC))
      .then((s) => alive && setShot({ id: cert.id, url: s.exists() ? s.data().dataUrl : "" }))
      .catch(() => alive && setShot({ id: cert.id, url: "" }));
    return () => {
      alive = false;
    };
  }, [cert]);

  return (
    <Modal opened={!!cert} onClose={onClose} title={cert ? nameOf(cert) : ""} size="xl" centered>
      {cert?.doc && (
        <div className={styles.viewer}>
          <div className={styles.viewerShot}>
            {shot.id !== cert.id ? <Loader size="sm" /> : shot.url ? <img src={shot.url} alt="" /> : <Text c="dimmed">{t("documents.noSnapshot")}</Text>}
          </div>
          <dl className={styles.facts}>
            <dt>{t("documents.code")}</dt>
            <dd>
              <bdi className={styles.code}>{normCode(cert.code)}</bdi>
            </dd>
            <dt>{t("documents.issued")}</dt>
            <dd>{when(cert.doc.attachedAt)}</dd>
            <dt>{t("documents.file")}</dt>
            <dd dir="auto">{cert.doc.fileName}</dd>
            <dt>{t("documents.fingerprint")}</dt>
            <dd>
              <code className={styles.hash}>{cert.doc.fileHash}</code>
            </dd>
          </dl>
          {cert.doc.text && (
            <details className={styles.text}>
              <summary>{t("documents.textTitle")}</summary>
              <p dir="auto">{cert.doc.text}</p>
            </details>
          )}
        </div>
      )}
    </Modal>
  );
}
