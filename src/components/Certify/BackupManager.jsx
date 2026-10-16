import { useState } from "react";
import { Button, FileButton, Progress, Text } from "@mantine/core";
import { IconDatabaseExport, IconDatabaseImport, IconShieldCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Timestamp, collection, doc } from "firebase/firestore";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { db } from "../../../firebaseConfig";
import { CERTS, certDate, cleanText, normCode } from "./certSchema";
import styles from "./Admin.module.css";

const NS = ["internal/Certificates", "internal/Internal"];
const BATCH = 450;

const iso = (v) => certDate(v)?.toISOString() ?? null;
const fromIso = (v) => (v ? Timestamp.fromDate(new Date(v)) : null);

/**
 * A JSON copy of every certificate to keep somewhere safe, and the way back
 * in. Restored certificates keep their codes, so printed QR codes stay valid;
 * the dashboard then publishes them to the verification page by itself.
 */
export default function BackupManager({ certs, notify }) {
  const { user } = useAccess();
  const { t } = useTranslation(NS);
  const [progress, setProgress] = useState(null);

  const exportBackup = () => {
    const data = certs.map((c) => ({
      name: c.name,
      nameAr: c.nameAr || "",
      program: c.program,
      programAr: c.programAr || "",
      lang: c.lang || "id",
      code: c.code,
      signerIds: c.signerIds || [],
      eventDate: iso(c.eventDate),
      status: c.status || "valid",
      revokedReason: c.revokedReason || "",
      createdAt: iso(c.createdAt),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `certificates-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    notify("success", t("backup.exportedTitle"), t("backup.exportedText", { count: data.length }));
  };

  const importBackup = async (file) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data) || data.some((c) => !c || !(c.name || c.nameAr) || !(c.program || c.programAr) || !c.code)) throw new Error("format");

      const have = new Set(certs.map((c) => normCode(c.code)));
      const fresh = data.filter((c) => {
        const code = normCode(c.code);
        if (have.has(code)) return false;
        have.add(code);
        return true;
      });

      setProgress(0);
      for (let i = 0; i < fresh.length; i += BATCH) {
        const part = fresh.slice(i, i + BATCH);
        await auditedWrite(user, { area: "certificates", action: "cert.import", label: file.name, details: { count: part.length } }, (batch, auditId) =>
          part.forEach((c) =>
          batch.set(doc(collection(db, CERTS)), {
            auditId,
            name: cleanText(c.name),
            nameAr: cleanText(c.nameAr),
            program: cleanText(c.program),
            programAr: cleanText(c.programAr),
            lang: ["id", "en", "ar"].includes(c.lang) ? c.lang : "id",
            code: normCode(c.code),
            signerIds: Array.isArray(c.signerIds) ? c.signerIds : [],
            eventDate: fromIso(c.eventDate),
            status: c.status === "revoked" ? "revoked" : "valid",
            revokedReason: c.status === "revoked" ? cleanText(c.revokedReason) : "",
            createdAt: fromIso(c.createdAt) || Timestamp.now(),
          })
          )
        );
        setProgress(Math.min(1, (i + BATCH) / fresh.length));
      }
      notify(
        "success",
        t("backup.importedTitle"),
        t("backup.importedText", { count: fresh.length, skipped: data.length - fresh.length })
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
            {t("backup.exportText", { count: certs.length })}
          </Text>
        </div>
        <Button variant="light" onClick={exportBackup} disabled={!certs.length}>
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
