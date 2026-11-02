import { useEffect, useState } from "react";
import { Alert, Button, Loader, Progress, Text } from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconDatabaseExport, IconRefresh, IconShieldLock } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "./accessContext";
import AdminShell from "./AdminShell";
import { AUDIT_COLLECTION, auditedWrite } from "./audit";
import BackupRestore from "./BackupRestore";
import { STORAGE_LIMIT, buildBackup, countStorage, loadStorage, storageIsStale } from "./databaseBackup";
import { formatDateTime, timeAgo } from "./timeAgo";
import a from "./AdminApp.module.css";

const ACTION = "backup.download";
const MONTH = 30 * 24 * 60 * 60 * 1000;

const sizeText = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const AREA_ORDER = ["news", "forms", "certificates", "supervision", "links", "site", "admins", "history"];
const STORAGE_WARN = 80;

/**
 * The super admin's backup: one file with every record, photos and
 * signatures included. The free plan keeps none, so it says when the last
 * one was made and nudges after a month. Also how much of the free storage
 * is used, and putting a backup back (BackupRestore).
 */
export default function Backup() {
  const { t } = useTranslation("internal/Internal");
  const { user, email } = useAccess();
  const [last, setLast] = useState(undefined); // undefined while loading, null for never
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [failed, setFailed] = useState(false);
  const [usage, setUsage] = useState(undefined); // undefined while loading, null if never counted
  const [counting, setCounting] = useState(null);
  const [countFailed, setCountFailed] = useState(false);

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

  const recount = async () => {
    setCountFailed(false);
    setCounting({ count: 0 });
    try {
      setUsage(await countStorage(setCounting));
    } catch (err) {
      console.error("Counting the storage failed:", err);
      setCountFailed(true);
    } finally {
      setCounting(null);
    }
  };

  // the saved figure, counted again on its own once it is old enough
  useEffect(() => {
    let stale = false;
    loadStorage()
      .catch(() => null)
      .then((saved) => {
        if (stale) return;
        setUsage(saved);
        if (storageIsStale(saved)) recount();
      });
    return () => {
      stale = true;
    };
  }, []);

  const run = async () => {
    setFailed(false);
    setResult(null);
    setProgress({ collection: "", count: 0 });
    try {
      const { blob, count, usage: counted } = await buildBackup(email, setProgress);
      setUsage(counted);
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

  const percent = usage ? (usage.bytes / STORAGE_LIMIT) * 100 : 0;
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
          <div>
            <b>{usage ? sizeText(usage.bytes) : "…"}</b>
            <span>{t("backup.storageOf", { limit: "1 GB" })}</span>
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

        <section className={a.panel}>
          <div className={a.panelHead}>
            <h2 className={a.panelTitle}>{t("backup.storageTitle")}</h2>
            <Button
              size="xs"
              variant="default"
              leftSection={counting ? <Loader size={14} /> : <IconRefresh size={14} />}
              onClick={recount}
              disabled={!!counting || !!progress}
            >
              {counting ? t("backup.storageCounting", { count: counting.count }) : t("backup.storageCount")}
            </Button>
          </div>

          {countFailed && (
            <Alert color="red" mb="md">
              {t("backup.storageFailed")}
            </Alert>
          )}
          {percent >= STORAGE_WARN && (
            <Alert color="orange" mb="md" icon={<IconAlertTriangle size={18} />}>
              {t("backup.storageFull", { percent: Math.round(percent) })}
            </Alert>
          )}

          {usage && (
            <>
              <div className={a.usedFigure}>
                <b>{percent < 10 ? percent.toFixed(1) : Math.round(percent)}%</b> · {sizeText(usage.bytes)} {t("backup.storageOf", { limit: "1 GB" })} ·{" "}
                {t("backup.storageRecords", { count: usage.count })}
              </div>
              <Progress value={Math.max(percent, 0.5)} color={percent >= STORAGE_WARN ? "orange" : "teal"} radius="xl" size="md" />
              <div className={a.areaList}>
                {AREA_ORDER.filter((key) => usage.areas?.[key]).map((key) => (
                  <div className={a.areaRow} key={key}>
                    <span>{t(`backup.areas.${key}`)}</span>
                    <span>{sizeText(usage.areas[key].bytes)}</span>
                  </div>
                ))}
              </div>
              <Text size="xs" c="dimmed" mt="md">
                {usage.at ? `${t("backup.storageCounted", { time: timeAgo(usage.at) })}. ` : ""}
                {t("backup.storageNote")}
              </Text>
            </>
          )}
        </section>

        <BackupRestore disabled={!!progress} onRestored={recount} />
      </div>
    </AdminShell>
  );
}
