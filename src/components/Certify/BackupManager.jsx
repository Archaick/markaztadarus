import { useState } from "react";
import { Button, FileButton, Progress, Text } from "@mantine/core";
import { IconDatabaseExport, IconDatabaseImport, IconShieldCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Timestamp, collection, doc } from "firebase/firestore";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { db } from "../../../firebaseConfig";
import { CERTS, certDate, cleanText, normCode } from "./certSchema";
import { SIGNERS_COLLECTION, SIGNER_TEXT, signerTextKey } from "./signerUtils";
import { DESIGNS, cleanDesign } from "./Template/studioData";
import styles from "./Admin.module.css";

const NS = ["internal/Certificates", "internal/Internal"];
const BATCH = 400;
const VERSION = 2;

const iso = (v) => certDate(v)?.toISOString() ?? null;
const fromIso = (v) => (v ? Timestamp.fromDate(new Date(v)) : null);
const text = (v) => (typeof v === "string" ? v : "");
const image = (v) => (typeof v === "string" && v.startsWith("data:image/") ? v : "");

// ── what goes in the file ──

const certOut = (c) => ({
  name: c.name || "",
  nameAr: c.nameAr || "",
  program: c.program || "",
  programAr: c.programAr || "",
  lang: c.lang || "id",
  code: c.code,
  signerIds: c.signerIds || [],
  eventDate: iso(c.eventDate),
  status: c.status || "valid",
  revokedReason: c.revokedReason || "",
  createdAt: iso(c.createdAt),
  // made in Certificate Studio
  ...(c.designId && { designId: c.designId, kind: c.kind || "studio", seq: c.seq || 0, number: c.number || "" }),
  // a Word file stamped with its QR code (how the verification page recognises it)
  ...(c.doc && { doc: { ...c.doc, attachedAt: iso(c.doc.attachedAt) } }),
});

// the English and Arabic versions of a signer's name, position and organization
const TRANSLATED = ["en", "ar"].flatMap((l) => SIGNER_TEXT.map((f) => signerTextKey(f, l)));

const signerOut = (s) => ({
  id: s.id,
  name: s.name || "",
  position: s.position || "",
  organization: s.organization || "",
  ...Object.fromEntries(TRANSLATED.map((k) => [k, s[k] || ""])),
  signatureImg: s.signatureImg || "",
  stampImg: s.stampImg || "",
  isDefault: !!s.isDefault,
  active: s.active !== false,
  order: s.order || 0,
});

const designOut = (d) => ({ id: d.id, ...cleanDesign(d), createdAt: iso(d.createdAt) });

// ── and back in ──

const certIn = (c, auditId) => ({
  auditId,
  name: cleanText(c.name),
  nameAr: cleanText(c.nameAr),
  program: cleanText(c.program),
  programAr: cleanText(c.programAr),
  lang: ["id", "en", "ar"].includes(c.lang) ? c.lang : "id",
  code: normCode(c.code),
  signerIds: Array.isArray(c.signerIds) ? c.signerIds.filter((id) => typeof id === "string") : [],
  eventDate: fromIso(c.eventDate),
  status: c.status === "revoked" ? "revoked" : "valid",
  revokedReason: c.status === "revoked" ? cleanText(c.revokedReason) : "",
  createdAt: fromIso(c.createdAt) || Timestamp.now(),
  ...(typeof c.designId === "string" &&
    c.designId && { designId: c.designId, kind: "studio", seq: Number(c.seq) || 0, number: cleanText(c.number) }),
  ...(c.doc &&
    typeof c.doc === "object" && {
      doc: {
        fileName: cleanText(c.doc.fileName),
        fileHash: text(c.doc.fileHash),
        textHash: text(c.doc.textHash),
        text: text(c.doc.text).slice(0, 3000),
        thumb: image(c.doc.thumb),
        attachedAt: fromIso(c.doc.attachedAt) || Timestamp.now(),
      },
    }),
});

const signerIn = (s, auditId) => ({
  auditId,
  name: cleanText(s.name),
  position: cleanText(s.position),
  organization: cleanText(s.organization),
  ...Object.fromEntries(TRANSLATED.map((k) => [k, cleanText(s[k])])),
  signatureImg: image(s.signatureImg),
  stampImg: image(s.stampImg),
  isDefault: !!s.isDefault,
  active: s.active !== false,
  order: Number(s.order) || 0,
});

/**
 * A JSON copy of the whole certificate dashboard to keep somewhere safe, and
 * the way back in: every certificate (with what Certificate Studio and the
 * Word stamping added), the Studio designs and the signers with their
 * signatures and stamps. Everything comes back under its own id and code, so
 * printed QR codes stay valid and certificates still find their design and
 * signers; whatever already exists is left alone, so restoring twice is
 * harmless. Older backups (a plain list of certificates) still restore.
 */
export default function BackupManager({ certs, designs = [], signers = [], notify, onSignersChange }) {
  const { user } = useAccess();
  const { t } = useTranslation(NS);
  const [progress, setProgress] = useState(null);

  const exportBackup = () => {
    const data = {
      version: VERSION,
      exportedAt: new Date().toISOString(),
      certificates: certs.map(certOut),
      designs: designs.map(designOut),
      signers: signers.map(signerOut),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `certificates-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    notify(
      "success",
      t("backup.exportedTitle"),
      t("backup.exportedAll", { count: data.certificates.length, designs: data.designs.length, signers: data.signers.length })
    );
  };

  const importBackup = async (file) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      // version 1 was the plain list of certificates
      const backup = Array.isArray(parsed) ? { certificates: parsed, designs: [], signers: [] } : parsed;
      const list = backup?.certificates;
      if (!Array.isArray(list) || list.some((c) => !c || !(c.name || c.nameAr) || !(c.program || c.programAr) || !c.code)) throw new Error("format");
      const designList = (Array.isArray(backup.designs) ? backup.designs : []).filter((d) => d && typeof d.id === "string" && /^[\w-]{1,128}$/.test(d.id));
      const signerList = (Array.isArray(backup.signers) ? backup.signers : []).filter(
        (s) => s && typeof s.id === "string" && /^[\w-]{1,128}$/.test(s.id) && s.name
      );

      const haveDesigns = new Set(designs.map((d) => d.id));
      const haveSigners = new Set(signers.map((s) => s.id));
      const newDesigns = designList.filter((d) => !haveDesigns.has(d.id));
      const newSigners = signerList.filter((s) => !haveSigners.has(s.id));
      const have = new Set(certs.map((c) => normCode(c.code)));
      const fresh = list.filter((c) => {
        const code = normCode(c.code);
        if (have.has(code)) return false;
        have.add(code);
        return true;
      });

      const steps = newSigners.length + newDesigns.length + fresh.length || 1;
      let done = 0;
      setProgress(0);

      // signers first, then designs (a design's logos can be large: one at a time), then certificates
      for (let i = 0; i < newSigners.length; i += 10) {
        const part = newSigners.slice(i, i + 10);
        await auditedWrite(user, { area: "certificates", action: "cert.import", label: file.name, details: { signers: part.length } }, (batch, auditId) =>
          part.forEach((s) => batch.set(doc(db, SIGNERS_COLLECTION, s.id), signerIn(s, auditId)))
        );
        done += part.length;
        setProgress(done / steps);
      }
      for (const d of newDesigns) {
        await auditedWrite(user, { area: "certificates", action: "cert.import", label: file.name, details: { design: d.name || d.id } }, (batch, auditId) =>
          batch.set(doc(db, DESIGNS, d.id), {
            ...cleanDesign(d),
            createdAt: fromIso(d.createdAt) || Timestamp.now(),
            updatedAt: Timestamp.now(),
            auditId,
          })
        );
        done += 1;
        setProgress(done / steps);
      }
      for (let i = 0; i < fresh.length; i += BATCH) {
        const part = fresh.slice(i, i + BATCH);
        await auditedWrite(user, { area: "certificates", action: "cert.import", label: file.name, details: { count: part.length } }, (batch, auditId) =>
          part.forEach((c) => batch.set(doc(collection(db, CERTS)), certIn(c, auditId)))
        );
        done += part.length;
        setProgress(done / steps);
      }
      if (newSigners.length) onSignersChange?.();

      notify(
        "success",
        t("backup.importedTitle"),
        t("backup.importedAll", {
          count: fresh.length,
          skipped: list.length - fresh.length,
          designs: newDesigns.length,
          signers: newSigners.length,
        })
      );
    } catch (err) {
      console.error("Import error:", err);
      notify("error", t("backup.failedTitle"), err.message === "format" ? t("backup.badFile") : t("errors.failed"));
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className={styles.backup}>
      <div className={styles.backupCard}>
        <IconDatabaseExport size={26} />
        <div>
          <Text fw={700}>{t("backup.exportTitle")}</Text>
          <Text size="sm" c="dimmed">
            {t("backup.exportAll", { count: certs.length, designs: designs.length, signers: signers.length })}
          </Text>
        </div>
        <Button variant="light" onClick={exportBackup} disabled={!certs.length && !designs.length && !signers.length}>
          {t("backup.exportButton")}
        </Button>
      </div>

      <div className={styles.backupCard}>
        <IconDatabaseImport size={26} />
        <div>
          <Text fw={700}>{t("backup.importTitle")}</Text>
          <Text size="sm" c="dimmed">
            {t("backup.importText")}
          </Text>
        </div>
        <FileButton onChange={importBackup} accept=".json,application/json">
          {(props) => (
            <Button {...props} variant="light" color="teal" loading={progress !== null}>
              {t("backup.importButton")}
            </Button>
          )}
        </FileButton>
      </div>
      {progress !== null && <Progress value={progress * 100} striped animated />}

      <Text size="xs" c="dimmed" className={styles.backupNote}>
        <IconShieldCheck size={14} /> {t("backup.note")}
      </Text>
    </div>
  );
}
