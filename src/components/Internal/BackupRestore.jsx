import { useRef, useState } from "react";
import { Alert, Button, Checkbox, FileButton, Group, Loader, Modal, Progress, Switch, Text } from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconRestore, IconUpload } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "./accessContext";
import { comparePlan, readBackupFile, runRestore } from "./databaseRestore";
import { formatDateTime } from "./timeAgo";
import a from "./AdminApp.module.css";

const AREA_ORDER = ["certificates", "forms", "news", "supervision", "links", "site", "admins"];

/**
 * Putting a backup back: pick the file, see what differs from the database
 * now, choose what comes back, confirm. Only missing records unless asked;
 * nothing is ever deleted. `onRestored` runs after anything was written.
 */
export default function BackupRestore({ onRestored, disabled }) {
  const { t } = useTranslation("internal/Internal");
  const { user } = useAccess();
  const resetFile = useRef(null);
  const [backup, setBackup] = useState(null);
  const [plan, setPlan] = useState(null);
  const [off, setOff] = useState(() => new Set(["admins"])); // a removed admin must not come back unnoticed
  const [replace, setReplace] = useState(false);
  const [reading, setReading] = useState(null);
  const [progress, setProgress] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState(null);

  const reset = () => {
    setBackup(null);
    setPlan(null);
    setReplace(false);
    setOff(new Set(["admins"]));
    resetFile.current?.();
  };

  const pick = async (file) => {
    if (!file) return;
    setNotice(null);
    setPlan(null);
    setReading({ count: 0 });
    try {
      const loaded = await readBackupFile(file);
      if (!loaded) {
        setNotice({ color: "red", text: t("backup.restoreBadFile") });
        resetFile.current?.();
        return;
      }
      setPlan(await comparePlan(loaded, setReading));
      setBackup(loaded);
    } catch (err) {
      console.error("Reading the backup failed:", err);
      setNotice({ color: "red", text: t("backup.restoreFailed") });
      reset();
    } finally {
      setReading(null);
    }
  };

  const areas = plan ? AREA_ORDER.filter((k) => plan[k]).map((key) => ({ key, ...plan[key] })) : [];
  const chosen = areas.filter((area) => !off.has(area.key));
  const missing = chosen.flatMap((area) => area.missing);
  const changed = replace ? chosen.flatMap((area) => area.changed) : [];
  const total = missing.length + changed.length;
  const anyChanged = areas.some((area) => area.changed.length);
  const allSame = areas.every((area) => !area.missing.length && !area.changed.length);

  const toggle = (key) =>
    setOff((was) => {
      const next = new Set(was);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const run = async () => {
    setConfirming(false);
    setProgress({ done: 0, total });
    try {
      const { restored, failed } = await runRestore(user, backup, [...missing, ...changed], setProgress);
      setNotice(
        failed.length
          ? { color: "orange", text: t("backup.restorePartial", { count: restored, failed: failed.length }), failed }
          : { color: "teal", text: t("backup.restoreDone", { count: restored }) }
      );
      if (restored) onRestored?.();
      reset();
    } catch (err) {
      console.error("Restore failed:", err);
      setNotice({ color: "red", text: t("backup.restoreFailed") });
    } finally {
      setProgress(null);
    }
  };

  return (
    <section className={a.panel}>
      <h2 className={a.panelTitle}>{t("backup.restoreTitle")}</h2>
      <Text size="sm" c="dimmed" mt={4} mb="md">
        {t("backup.restoreIntro")}
      </Text>

      {notice && (
        <Alert color={notice.color} mb="md" icon={notice.color === "teal" ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}>
          {notice.text}
          {notice.failed && (
            <ul className={a.restoreFailed}>
              {notice.failed.slice(0, 20).map((path) => (
                <li key={path} dir="ltr">
                  {path}
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}

      {!plan && (
        <FileButton resetRef={resetFile} onChange={pick} accept="application/json,.json">
          {(props) => (
            <Button {...props} variant="default" disabled={disabled || !!reading} leftSection={reading ? <Loader size={16} /> : <IconUpload size={18} />}>
              {reading ? t("backup.restoreReading", { count: reading.count }) : t("backup.restorePick")}
            </Button>
          )}
        </FileButton>
      )}

      {plan && backup && (
        <>
          <Text fw={700} size="sm" mb="xs" dir="auto">
            {backup.name}
          </Text>
          <Text size="sm" c="dimmed" mb="sm">
            {t("backup.restoreFrom", {
              time: backup.createdAt ? formatDateTime(new Date(backup.createdAt)) : "—",
              count: Object.keys(backup.documents).length,
            })}
          </Text>

          {allSame ? (
            <Alert color="teal" mb="md" icon={<IconCheck size={18} />}>
              {t("backup.restoreNothing")}
            </Alert>
          ) : (
            <>
              {areas.map((area) => (
                <div className={a.restoreRow} key={area.key}>
                  <Checkbox
                    checked={!off.has(area.key)}
                    onChange={() => toggle(area.key)}
                    disabled={!!progress || (!area.missing.length && !area.changed.length)}
                    label={t(`backup.areas.${area.key}`)}
                    description={area.key === "admins" ? t("backup.restoreAdminsHint") : undefined}
                  />
                  <span className={a.restoreCounts}>
                    {t("backup.restoreMissing")}: <b>{area.missing.length}</b> · {t("backup.restoreChanged")}: <b>{area.changed.length}</b> · {t("backup.restoreSame")}: {area.same}
                  </span>
                </div>
              ))}

              {anyChanged && (
                <Switch
                  mt="md"
                  color="orange"
                  checked={replace}
                  onChange={(e) => setReplace(e.currentTarget.checked)}
                  disabled={!!progress}
                  label={t("backup.restoreReplace")}
                  description={t("backup.restoreReplaceHint")}
                />
              )}
              <Text size="xs" c="dimmed" mt="md">
                {t("backup.restoreNever")}
              </Text>
            </>
          )}

          {progress && <Progress mt="md" value={progress.total ? (progress.done / progress.total) * 100 : 0} animated />}

          <Group mt="md" gap="sm">
            {!allSame && (
              <Button color="teal" leftSection={<IconRestore size={18} />} disabled={!total || !!progress} onClick={() => setConfirming(true)}>
                {progress ? t("backup.restoreWorking", progress) : t("backup.restoreButton", { count: total })}
              </Button>
            )}
            <Button variant="default" disabled={!!progress} onClick={reset}>
              {t("backup.restoreBack")}
            </Button>
          </Group>
        </>
      )}

      <Modal opened={confirming} onClose={() => setConfirming(false)} title={t("backup.restoreConfirmTitle", { count: total })} centered>
        <Text size="sm">
          {changed.length
            ? t("backup.restoreConfirmReplace", { missing: missing.length, changed: changed.length })
            : t("backup.restoreConfirmAdd", { missing: missing.length })}
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setConfirming(false)}>
            {t("backup.restoreCancel")}
          </Button>
          <Button color={changed.length ? "orange" : "teal"} onClick={run}>
            {t("backup.restoreConfirm")}
          </Button>
        </Group>
      </Modal>
    </section>
  );
}
