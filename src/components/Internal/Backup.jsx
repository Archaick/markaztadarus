import { useEffect, useState } from "react";
import { Alert, Button, Loader } from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconDatabaseExport, IconShieldLock } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "./accessContext";
import AdminShell from "./AdminShell";
import { AUDIT_COLLECTION, auditedWrite } from "./audit";
import { buildBackup } from "./databaseBackup";
import { formatDateTime, timeAgo } from "./timeAgo";
import a from "./AdminApp.module.css";

const ACTION = "backup.download";
const MONTH = 30 * 24 * 60 * 60 * 1000;

const sizeText = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * The super admin's backup: one file with every record, photos and
 * signatures included. The free plan keeps none, so it says when the last
 * one was made and nudges after a month.
 */
export default function Backup() {
  const { t } = useTranslation("internal/Internal");
  const { user, email } = useAccess();
  const [last, setLast] = useState(undefined); // undefined while loading, null for never
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [failed, setFailed] = useState(false);

  // the last backup, from the history
  const loadLast = () =>
    getDocs(query(collection(db, AUDIT_COLLECTION), where("action", "==", ACTION)))
      .then((snap) => {
        const times = snap.docs.map((d) => d.data().at).filter(Boolean);
        setLast(times.sort((x, y) => y.toMillis() - x.toMillis())[0] || null);
      })
      .catch(() => setLast(null));
  useEffect(() => {
    loadLast();
  }, []);

  const run = async () => {
    setFailed(false);
    setResult(null);
    setProgress({ collection: "", count: 0 });
    try {
      const { blob, count } = await buildBackup(email, setProgress);
      const day = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `markaztadarus-backup-${day}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      await auditedWrite(user, { area: "access", action: ACTION, label: link.download, details: { documents: count, size: sizeText(blob.size) } }, () => {});
      setResult({ count, size: sizeText(blob.size) });
      loadLast();
    } catch (err) {
      console.error("Backup failed:", err);
      setFailed(true);
    } finally {
      setProgress(null);
    }
  };

  const overdue = last === null || (last && Date.now() - last.toMillis() > MONTH);

  return (
    <AdminShell>
      <div className={a.page}>
        <header className={a.head}>
          <div>
            <h1 className={a.title}>{t("backup.title")}</h1>
            <p className={a.sub}>{t("backup.intro")}</p>
          </div>
        </header>

        <div className={a.stats}>
          <div>
            <b>{last === undefined ? "…" : last ? timeAgo(last) : t("backup.never")}</b>
            <span>{last ? formatDateTime(last) : t("backup.last")}</span>
          </div>
        </div>

        {overdue && last !== undefined && !result && (
          <Alert color="orange" mb="md" icon={<IconAlertTriangle size={18} />}>
            {t(last ? "backup.overdue" : "backup.first")}
          </Alert>
        )}
        {result && (
          <Alert color="teal" mb="md" icon={<IconCheck size={18} />}>
            {t("backup.done", result)}
          </Alert>
        )}
        {failed && (
          <Alert color="red" mb="md">
            {t("backup.failed")}
          </Alert>
        )}

        <Button
          size="md"
          color="teal"
          leftSection={progress ? <Loader size={16} color="white" /> : <IconDatabaseExport size={18} />}
          onClick={run}
          disabled={!!progress}
        >
          {progress ? t("backup.working", { count: progress.count }) : t("backup.button")}
        </Button>

        <Alert color="gray" mt="lg" icon={<IconShieldLock size={18} />}>
          {t("backup.keepSafe")}
        </Alert>
      </div>
    </AdminShell>
  );
}
