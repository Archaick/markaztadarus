import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Alert,
  Autocomplete,
  Badge,
  Button,
  Card,
  CopyButton,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Pagination,
  Progress,
  SegmentedControl,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowLeft,
  IconBan,
  IconCertificate,
  IconCheck,
  IconCopy,
  IconDatabase,
  IconDownload,
  IconEye,
  IconPencil,
  IconPlus,
  IconQrcode,
  IconSearch,
  IconShieldCheck,
  IconSignature,
  IconTable,
  IconTrash,
  IconUsersPlus,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";
import { auth, db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { AccountBar, InternalLayout } from "../Internal/InternalUI";
import { intlLocale } from "../Internal/language";
import { timeAgo } from "../Internal/timeAgo";
import layout from "../Internal/AccessControl.module.css";
import portal from "../Internal/InternalPortal.module.css";
import SignerManager from "./SignerManager";
import BackupManager from "./BackupManager";
import BulkIssue from "./BulkIssue";
import { fetchAllSigners, resolveCertificateSigners } from "./signerUtils";
import {
  CERTS,
  META,
  MIGRATION_DOC,
  PUBLIC,
  certDate,
  cleanText,
  fromDateInput,
  isRevoked,
  newCode,
  normCode,
  publicFields,
  publicUpToDate,
  toDateInput,
  verifyLink,
} from "./certSchema";
import { certQr, downloadCsv, downloadDataUrl, downloadQrZip, qrFileName } from "./certExports";
import styles from "./Admin.module.css";

const NS = ["internal/Certificates", "internal/Internal"];
const PAGE = 25;
const CERTS_PER_BATCH = 200; // two writes each, under Firestore's 500

const millis = (v) => certDate(v)?.getTime() ?? 0;

export default function Admin() {
  const { t, i18n } = useTranslation(NS);
  const { email } = useAccess();
  const [certs, setCerts] = useState(null);
  const [pubs, setPubs] = useState(null);
  const [migrated, setMigrated] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sync, setSync] = useState(null);
  const syncing = useRef(false);
  const [signers, setSigners] = useState([]);
  const [tab, setTab] = useState("certificates");
  const [notice, setNotice] = useState(null);

  const [search, setSearch] = useState("");
  const [program, setProgram] = useState(null);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null); // null | "new" | cert
  const [bulkOpen, setBulkOpen] = useState(false);
  const [qrFor, setQrFor] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [zipProgress, setZipProgress] = useState(null);

  // Messages are written in the language of the moment; drop them on a switch.
  useEffect(() => setNotice(null), [i18n.language]);

  const notify = (type, title, message) =>
    setNotice({ color: { success: "teal", error: "red", warning: "yellow", info: "blue" }[type] || "blue", title, message });

  // ---------- live data ----------
  useEffect(() => {
    const fail = (err) => {
      console.error("Could not load certificates:", err);
      setLoadFailed(true);
    };
    const offCerts = onSnapshot(collection(db, CERTS), (s) => setCerts(s.docs.map((d) => ({ id: d.id, ...d.data() }))), fail);
    const offPubs = onSnapshot(collection(db, PUBLIC), (s) => setPubs(new Map(s.docs.map((d) => [d.id, d.data()]))), fail);
    const offMeta = onSnapshot(doc(db, META, MIGRATION_DOC), (s) => setMigrated(s.exists() && s.data().done === true), fail);
    return () => {
      offCerts();
      offPubs();
      offMeta();
    };
  }, []);

  // Signers for the pickers; the Signers tab keeps them current after edits.
  useEffect(() => {
    fetchAllSigners()
      .then(setSigners)
      .catch((err) => console.error("Could not load signers:", err));
  }, []);

  // ---------- keep the verification copies in step ----------
  // Copies every certificate (including older ones and backups) into the
  // locked-down lookup, then marks the move done so the rules stop letting
  // anyone list the participant records.
  useEffect(() => {
    if (!certs || !pubs || migrated === null || syncing.current) return;
    const byCode = new Map();
    [...certs]
      .sort((a, b) => millis(a.createdAt) - millis(b.createdAt))
      .forEach((c) => {
        const code = normCode(c.code);
        if (code && !byCode.has(code)) byCode.set(code, c);
      });
    const stale = [...byCode.entries()].filter(([code, c]) => !publicUpToDate(c, pubs.get(code)));

    syncing.current = true;
    (async () => {
      try {
        if (stale.length) setSync({ done: 0, total: stale.length });
        for (let i = 0; i < stale.length; i += 400) {
          const batch = writeBatch(db);
          stale.slice(i, i + 400).forEach(([code, c]) => batch.set(doc(db, PUBLIC, code), publicFields(c), { merge: true }));
          await batch.commit();
          setSync({ done: Math.min(i + 400, stale.length), total: stale.length });
        }
        if (!migrated) {
          await setDoc(doc(db, META, MIGRATION_DOC), {
            done: true,
            count: byCode.size,
            at: serverTimestamp(),
            by: email || "unknown",
          });
          notify("success", t("secure.doneTitle"), t("secure.doneText", { count: byCode.size }));
        }
      } catch (err) {
        console.error("Could not update verification copies:", err);
        notify("error", t("secure.failedTitle"), t("secure.failedText"));
      } finally {
        setSync(null);
        // let the snapshots catch up before looking again
        setTimeout(() => {
          syncing.current = false;
        }, 1500);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certs, pubs, migrated]);

  // ---------- derived ----------
  const programs = useMemo(() => {
    const counts = new Map();
    (certs || []).forEach((c) => c.program && counts.set(c.program, (counts.get(c.program) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [certs]);
  const programNames = useMemo(() => programs.map(([p]) => p), [programs]);

  const totalScans = useMemo(() => {
    let sum = 0;
    pubs?.forEach((p) => {
      sum += p.scans || 0;
    });
    return sum;
  }, [pubs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (certs || [])
      .filter((c) => !program || c.program === program)
      .filter((c) => status === "all" || (status === "revoked") === isRevoked(c))
      .filter((c) => !term || [c.name, c.program, c.code].some((v) => (v || "").toLowerCase().includes(term)))
      .sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
  }, [certs, search, program, status]);

  useEffect(() => setPage(1), [search, program, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const visible = filtered.slice((page - 1) * PAGE, page * PAGE);

  const signerOptions = signers
    .filter((s) => s.active !== false)
    .map((s) => ({ value: s.id, label: `${s.name} — ${s.position}` }));
  const defaultSignerNames = signers
    .filter((s) => s.active !== false && s.isDefault)
    .map((s) => s.name)
    .join(", ");
  const signerPlaceholder = defaultSignerNames ? t("fields.signersDefault", { names: defaultSignerNames }) : t("fields.signersNone");

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(intlLocale(i18n.language), { day: "numeric", month: "short", year: "numeric" }),
    [i18n.language]
  );

  // ---------- writes ----------
  const takenCodes = () => new Set((certs || []).map((c) => normCode(c.code)));

  const createMany = async ({ names, program: prog, eventDate, signerIds }, onProgress) => {
    const taken = takenCodes();
    const date = fromDateInput(eventDate);
    const created = [];
    for (let i = 0; i < names.length; i += CERTS_PER_BATCH) {
      const batch = writeBatch(db);
      names.slice(i, i + CERTS_PER_BATCH).forEach((name) => {
        const data = {
          name,
          program: prog,
          code: newCode(taken),
          signerIds: signerIds || [],
          eventDate: date,
          status: "valid",
          createdAt: Timestamp.now(),
          createdBy: email || "unknown",
        };
        const ref = doc(collection(db, CERTS));
        batch.set(ref, data);
        batch.set(doc(db, PUBLIC, data.code), publicFields(data));
        created.push({ id: ref.id, ...data });
      });
      await batch.commit();
      onProgress?.(Math.min(1, (i + CERTS_PER_BATCH) / names.length));
    }
    return created;
  };

  const saveCert = async (values) => {
    if (editing === "new") {
      const [cert] = await createMany({ ...values, names: [values.name] });
      notify("success", t("notices.createdTitle"), t("notices.createdText", { name: cert.name, code: cert.code }));
      setQrFor(cert);
      return;
    }
    const cert = editing;
    const changes = {
      name: values.name,
      program: values.program,
      eventDate: fromDateInput(values.eventDate),
      signerIds: values.signerIds,
      updatedAt: Timestamp.now(),
      updatedBy: email || "unknown",
    };
    const batch = writeBatch(db);
    batch.update(doc(db, CERTS, cert.id), changes);
    batch.set(doc(db, PUBLIC, normCode(cert.code)), publicFields({ ...cert, ...changes }), { merge: true });
    await batch.commit();
    notify("success", t("notices.savedTitle"), t("notices.savedText", { name: values.name }));
  };

  const setRevoked = async (cert, revoked, reason = "") => {
    const changes = revoked
      ? { status: "revoked", revokedReason: cleanText(reason), revokedAt: Timestamp.now(), revokedBy: email || "unknown" }
      : { status: "valid", revokedReason: "" };
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, CERTS, cert.id), changes);
      batch.set(doc(db, PUBLIC, normCode(cert.code)), publicFields({ ...cert, ...changes }), { merge: true });
      await batch.commit();
      notify("success", t(revoked ? "notices.revokedTitle" : "notices.restoredTitle"), cert.name);
      setRevoking(null);
    } catch (err) {
      console.error("Could not change status:", err);
      notify("error", t("errors.failedTitle"), t("errors.failed"));
    }
  };

  const removeCert = async (cert) => {
    try {
      // Confirm it is really the signed-in admin before a permanent delete.
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: auth.currentUser?.email || "" });
      await reauthenticateWithPopup(auth.currentUser, provider);
      const batch = writeBatch(db);
      batch.delete(doc(db, CERTS, cert.id));
      batch.delete(doc(db, PUBLIC, normCode(cert.code)));
      await batch.commit();
      setDeleting(null);
      notify("success", t("notices.deletedTitle"), cert.name);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") return;
      console.error("Delete error:", err);
      notify("error", t("errors.failedTitle"), err.code === "auth/user-mismatch" ? t("errors.sameAccount") : t("errors.failed"));
    }
  };

  const zip = async (list, name) => {
    if (!list.length) return;
    setZipProgress(0);
    try {
      await downloadQrZip(list, `QR_${name || "sertifikat"}`, setZipProgress);
    } catch (err) {
      console.error("ZIP failed:", err);
      notify("error", t("errors.failedTitle"), t("errors.failed"));
    } finally {
      setZipProgress(null);
    }
  };

  const csv = (list, name) =>
    downloadCsv(list, `Sertifikat_${name || "semua"}`, [
      t("csv.name"),
      t("csv.program"),
      t("csv.eventDate"),
      t("csv.code"),
      t("csv.link"),
      t("csv.status"),
    ]);

  const loading = certs === null && !loadFailed;

  return (
    <InternalLayout align="top">
      <div className={`${layout.page} ${styles.page}`}>
        <a href="/internal" className={layout.back}>
          <IconArrowLeft size={16} className={portal.flipRtl} /> {t("internal/Internal:backToHub")}
        </a>

        <Card className={layout.panel}>
          <AccountBar />

          <div className={styles.headerRow}>
            <div className={layout.heading}>
              <span className={layout.headingIcon} style={{ background: "linear-gradient(135deg, #d4a912 0%, #a67d00 100%)" }}>
                <IconCertificate size={22} />
              </span>
              <div>
                <Title order={2} className={layout.headingTitle}>
                  {t("title")}
                </Title>
                <Text className={layout.headingText}>{t("intro")}</Text>
              </div>
            </div>
            <Group gap="xs">
              <Button variant="light" color="yellow" leftSection={<IconPlus size={17} />} onClick={() => setEditing("new")}>
                {t("actions.one")}
              </Button>
              <Button className={styles.primaryButton} leftSection={<IconUsersPlus size={17} />} onClick={() => setBulkOpen(true)}>
                {t("actions.bulk")}
              </Button>
            </Group>
          </div>

          <div className={styles.stats}>
            <Stat value={certs?.length ?? 0} label={t("stats.certificates")} />
            <Stat value={programs.length} label={t("stats.programs")} />
            <Stat value={totalScans} label={t("stats.scans")} />
          </div>

          {sync && (
            <Alert color="blue" variant="light" mt="md" icon={<IconShieldCheck size={18} />} title={t("secure.title")}>
              <Text size="sm">{t("secure.text", { done: sync.done, total: sync.total })}</Text>
              <Progress mt={8} value={(sync.done / Math.max(1, sync.total)) * 100} striped animated />
            </Alert>
          )}
          {notice && (
            <Alert color={notice.color} variant="light" mt="md" title={notice.title} withCloseButton onClose={() => setNotice(null)}>
              {notice.message}
            </Alert>
          )}
          {loadFailed && (
            <Alert color="red" mt="md">
              {t("loadFailed")}
            </Alert>
          )}

          <Tabs value={tab} onChange={setTab} mt="lg" keepMounted={false}>
            <Tabs.List>
              <Tabs.Tab value="certificates" leftSection={<IconCertificate size={17} />}>
                {t("tabs.certificates")}
              </Tabs.Tab>
              <Tabs.Tab value="signers" leftSection={<IconSignature size={17} />}>
                {t("tabs.signers")}
                {signers.length > 0 && (
                  <Badge size="xs" ml={6} variant="light" color="violet">
                    {signers.length}
                  </Badge>
                )}
              </Tabs.Tab>
              <Tabs.Tab value="backup" leftSection={<IconDatabase size={17} />}>
                {t("tabs.backup")}
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="certificates" pt="md">
              {programs.length > 0 && (
                <div className={styles.programs}>
                  <button type="button" className={`${styles.programChip} ${!program ? styles.programOn : ""}`} onClick={() => setProgram(null)}>
                    {t("filters.allPrograms")} <span>{certs?.length ?? 0}</span>
                  </button>
                  {programs.map(([name, count]) => (
                    <button
                      type="button"
                      key={name}
                      className={`${styles.programChip} ${program === name ? styles.programOn : ""}`}
                      onClick={() => setProgram(program === name ? null : name)}
                      dir="auto"
                    >
                      {name} <span>{count}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.toolbar}>
                <TextInput
                  leftSection={<IconSearch size={16} />}
                  placeholder={t("filters.search")}
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  className={styles.search}
                />
                <SegmentedControl
                  value={status}
                  onChange={setStatus}
                  data={[
                    { value: "all", label: t("filters.all") },
                    { value: "valid", label: t("filters.valid") },
                    { value: "revoked", label: t("filters.revoked") },
                  ]}
                />
              </div>

              <div className={styles.listHead}>
                <Text size="sm" c="dimmed">
                  {t("filters.count", { count: filtered.length })}
                </Text>
                <Group gap={6}>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconDownload size={15} />}
                    onClick={() => zip(filtered, program)}
                    disabled={!filtered.length || zipProgress !== null}
                  >
                    {t("actions.zip")}
                  </Button>
                  <Button size="xs" variant="subtle" leftSection={<IconTable size={15} />} onClick={() => csv(filtered, program)} disabled={!filtered.length}>
                    {t("actions.csv")}
                  </Button>
                </Group>
              </div>
              {zipProgress !== null && (
                <div className={styles.zipProgress}>
                  <Text size="xs" c="dimmed">
                    {t("actions.zipping", { percent: Math.round(zipProgress * 100) })}
                  </Text>
                  <Progress value={zipProgress * 100} size="sm" />
                </div>
              )}

              {loading && (
                <Group justify="center" py="xl">
                  <Loader size="sm" />
                </Group>
              )}
              {certs?.length === 0 && (
                <div className={styles.empty}>
                  <IconCertificate size={34} />
                  <Text fw={600}>{t("empty.title")}</Text>
                  <Text size="sm" c="dimmed">
                    {t("empty.text")}
                  </Text>
                </div>
              )}
              {certs?.length > 0 && filtered.length === 0 && (
                <Text c="dimmed" ta="center" py="xl">
                  {t("filters.noMatch")}
                </Text>
              )}

              <ul className={styles.list}>
                {visible.map((cert) => (
                  <CertRow
                    key={cert.id}
                    cert={cert}
                    pub={pubs?.get(normCode(cert.code))}
                    signers={signers}
                    dateFormat={dateFormat}
                    onQr={() => setQrFor(cert)}
                    onEdit={() => setEditing(cert)}
                    onRevoke={() => (isRevoked(cert) ? setRevoked(cert, false) : setRevoking(cert))}
                    onDelete={() => setDeleting(cert)}
                  />
                ))}
              </ul>

              {pages > 1 && (
                <Group justify="center" mt="lg">
                  <Pagination value={page} onChange={setPage} total={pages} size="sm" />
                </Group>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="signers" pt="md">
              <SignerManager notify={notify} onSignersChange={setSigners} />
            </Tabs.Panel>

            <Tabs.Panel value="backup" pt="md">
              <BackupManager certs={certs || []} notify={notify} />
            </Tabs.Panel>
          </Tabs>
        </Card>
      </div>

      <CertEditor
        opened={editing !== null}
        cert={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        programs={programNames}
        signerOptions={signerOptions}
        signerPlaceholder={signerPlaceholder}
        onSave={saveCert}
      />
      <BulkIssue
        opened={bulkOpen}
        onClose={() => setBulkOpen(false)}
        programs={programNames}
        signerOptions={signerOptions}
        signerPlaceholder={signerPlaceholder}
        existing={certs || []}
        onIssue={createMany}
        onDownloadZip={zip}
        onDownloadCsv={csv}
      />
      <QrModal cert={qrFor} onClose={() => setQrFor(null)} />
      <RevokeModal cert={revoking} onClose={() => setRevoking(null)} onConfirm={(reason) => setRevoked(revoking, true, reason)} />
      <Modal opened={!!deleting} onClose={() => setDeleting(null)} title={t("delete.title")} centered size="sm">
        <Text size="sm" mb="sm">
          {t("delete.text", { name: deleting?.name })}
        </Text>
        <Text size="sm" c="dimmed">
          {t("delete.revokeHint")}
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDeleting(null)}>
            {t("common.cancel")}
          </Button>
          <Button color="red" onClick={() => removeCert(deleting)}>
            {t("delete.confirm")}
          </Button>
        </Group>
      </Modal>
    </InternalLayout>
  );
}

function Stat({ value, label }) {
  return (
    <div className={styles.stat}>
      <strong>{value.toLocaleString("en-US")}</strong>
      <span>{label}</span>
    </div>
  );
}

function CertRow({ cert, pub, signers, dateFormat, onQr, onEdit, onRevoke, onDelete }) {
  const { t } = useTranslation(NS);
  const revoked = isRevoked(cert);
  const event = certDate(cert.eventDate);
  const resolved = resolveCertificateSigners(cert, signers);
  const usesDefault = !(Array.isArray(cert.signerIds) && cert.signerIds.length);

  return (
    <li className={`${styles.row} ${revoked ? styles.rowOff : ""}`}>
      <div className={styles.main}>
        <div className={styles.titleLine}>
          <span className={styles.name} dir="auto">
            {cert.name}
          </span>
          {revoked && (
            <Badge size="sm" color="red" variant="light">
              {t("status.revoked")}
            </Badge>
          )}
        </div>
        <span className={styles.meta} dir="auto">
          {cert.program}
          {event ? ` · ${dateFormat.format(event)}` : ""}
        </span>
        <div className={styles.codeLine}>
          <bdi className={styles.code}>{cert.code}</bdi>
          <CopyButton value={verifyLink(cert.code)} timeout={1600}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? t("row.copied") : t("row.copyLink")}>
                <ActionIcon size="sm" variant="subtle" color={copied ? "teal" : "gray"} onClick={copy} aria-label={t("row.copyLink")}>
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
          {resolved.length > 0 && (
            <span className={styles.signers} title={resolved.map((s) => s.name).join(", ")}>
              <IconSignature size={13} /> {resolved.length === 1 ? resolved[0].name : `${resolved[0].name} +${resolved.length - 1}`}
              {usesDefault ? ` (${t("row.default")})` : ""}
            </span>
          )}
        </div>
      </div>

      <div className={styles.scans}>
        <span className={styles.scanCount}>
          <IconEye size={15} /> {(pub?.scans || 0).toLocaleString("en-US")}
        </span>
        <span className={styles.scanWhen}>{pub?.lastScannedAt ? t("row.lastScan", { time: timeAgo(pub.lastScannedAt) }) : t("row.neverScanned")}</span>
      </div>

      <div className={styles.actions}>
        <Tooltip label={t("row.qr")}>
          <ActionIcon variant="subtle" color="gray" onClick={onQr} aria-label={t("row.qr")}>
            <IconQrcode size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("row.edit")}>
          <ActionIcon variant="subtle" color="blue" onClick={onEdit} aria-label={t("row.edit")}>
            <IconPencil size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={revoked ? t("row.restore") : t("row.revoke")}>
          <ActionIcon variant="subtle" color={revoked ? "teal" : "orange"} onClick={onRevoke} aria-label={revoked ? t("row.restore") : t("row.revoke")}>
            {revoked ? <IconArrowBackUp size={18} /> : <IconBan size={18} />}
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("row.delete")}>
          <ActionIcon variant="subtle" color="red" onClick={onDelete} aria-label={t("row.delete")}>
            <IconTrash size={18} />
          </ActionIcon>
        </Tooltip>
      </div>
    </li>
  );
}

function CertEditor({ opened, cert, onClose, programs, signerOptions, signerPlaceholder, onSave }) {
  const { t } = useTranslation(NS);
  const [values, setValues] = useState({ name: "", program: "", eventDate: "", signerIds: [] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setError("");
    setValues(
      cert
        ? { name: cert.name || "", program: cert.program || "", eventDate: toDateInput(cert.eventDate), signerIds: cert.signerIds || [] }
        : { name: "", program: "", eventDate: "", signerIds: [] }
    );
  }, [opened, cert]);

  const save = async () => {
    const name = cleanText(values.name);
    const program = cleanText(values.program);
    if (!name) return setError(t("errors.noName"));
    if (!program) return setError(t("errors.noProgram"));
    setSaving(true);
    try {
      await onSave({ ...values, name, program });
      onClose();
    } catch (err) {
      console.error("Could not save certificate:", err);
      setError(t("errors.failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t(cert ? "editor.editTitle" : "editor.newTitle")} centered size="lg">
      <div className={styles.editor}>
        {cert && (
          <Alert color="blue" variant="light">
            {t("editor.sameCode", { code: cert.code })}
          </Alert>
        )}
        <TextInput
          label={t("fields.name")}
          placeholder={t("fields.namePlaceholder")}
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.currentTarget.value }))}
          required
          dir="auto"
        />
        <Autocomplete
          label={t("fields.program")}
          placeholder={t("fields.programPlaceholder")}
          data={programs}
          value={values.program}
          onChange={(program) => setValues((v) => ({ ...v, program }))}
          required
          limit={12}
        />
        <div className={styles.editorRow}>
          <TextInput
            type="date"
            label={t("fields.eventDate")}
            description={t("fields.eventDateHint")}
            value={values.eventDate}
            onChange={(e) => setValues((v) => ({ ...v, eventDate: e.currentTarget.value }))}
            className={styles.dateInput}
          />
          <MultiSelect
            label={t("fields.signers")}
            placeholder={values.signerIds.length ? "" : signerPlaceholder}
            data={signerOptions}
            value={values.signerIds}
            onChange={(signerIds) => setValues((v) => ({ ...v, signerIds }))}
            clearable
            searchable
          />
        </div>
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}
      </div>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button className={styles.primaryButton} loading={saving} onClick={save}>
          {t(cert ? "common.save" : "editor.create")}
        </Button>
      </Group>
    </Modal>
  );
}

function RevokeModal({ cert, onClose, onConfirm }) {
  const { t } = useTranslation(NS);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setReason(""), [cert]);

  return (
    <Modal opened={!!cert} onClose={onClose} title={t("revoke.title")} centered size="md">
      <Text size="sm" mb="sm">
        {t("revoke.text", { name: cert?.name })}
      </Text>
      <Textarea
        label={t("revoke.reason")}
        placeholder={t("revoke.reasonPlaceholder")}
        description={t("revoke.reasonHint")}
        value={reason}
        onChange={(e) => setReason(e.currentTarget.value)}
        autosize
        minRows={2}
        dir="auto"
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          color="orange"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            await onConfirm(reason);
            setBusy(false);
          }}
        >
          {t("revoke.confirm")}
        </Button>
      </Group>
    </Modal>
  );
}

function QrModal({ cert, onClose }) {
  const { t } = useTranslation(NS);
  const [image, setImage] = useState("");

  useEffect(() => {
    setImage("");
    if (!cert) return undefined;
    let alive = true;
    certQr(cert)
      .then((url) => alive && setImage(url))
      .catch((err) => console.error("QR failed:", err));
    return () => {
      alive = false;
    };
  }, [cert]);

  return (
    <Modal opened={!!cert} onClose={onClose} title={cert?.name} centered size="sm">
      <div className={styles.qrBox}>
        {image ? <img src={image} alt={t("row.qr")} className={styles.qrImage} /> : <Loader size="sm" />}
        <Text size="sm" c="dimmed" ta="center">
          {t("qr.hint")}
        </Text>
        <Group grow w="100%">
          <Button
            leftSection={<IconDownload size={17} />}
            className={styles.primaryButton}
            disabled={!image}
            onClick={() => downloadDataUrl(image, qrFileName(cert))}
          >
            {t("qr.download")}
          </Button>
          <Button variant="light" component="a" href={cert ? verifyLink(cert.code) : undefined} target="_blank" rel="noreferrer">
            {t("qr.open")}
          </Button>
        </Group>
      </div>
    </Modal>
  );
}
