import { useState } from "react";
import { Link } from "react-router-dom";
import { ActionIcon, Button, Group, Modal, Text, Tooltip } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { BASE } from "./SupervisiShell";
import { deleteSession } from "./actions";
import { StatusChip, useDateFormat } from "./parts";
import { formatAverage } from "./supervisiSchema";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";

/** One supervision in a list: opens the report (or the form while unfinished), with a delete button. */
export default function SessionRow({ session }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const dates = useDateFormat();
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const to = session.status === "done" ? `${BASE}/laporan/${session.id}` : `${BASE}/sesi/${session.id}`;

  const remove = async () => {
    setBusy(true);
    try {
      await deleteSession(user, session);
    } catch (err) {
      console.error("Could not delete the supervision:", err);
      setBusy(false);
    }
  };

  return (
    <li className={styles.row}>
      <Link to={to} className={styles.rowLink}>
        <div className={styles.rowMain}>
          <div className={styles.rowTitle} dir="auto">
            {session.teacherName}
          </div>
          <div className={styles.rowSub} dir="auto">
            {[session.schoolName, session.className && `${t("fields.className")} ${session.className}`, session.surah, dates.short(session.date)]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <div className={styles.rowEnd}>
          {session.status === "done" && (
            <span className={styles.score}>
              {formatAverage(session.average)}
              <small>/ {session.max || 5}</small>
            </span>
          )}
          <StatusChip status={session.status} />
        </div>
      </Link>
      <Tooltip label={t("common.delete")}>
        <ActionIcon variant="subtle" color="red" onClick={() => setRemoving(true)} aria-label={t("common.delete")}>
          <IconTrash size={17} />
        </ActionIcon>
      </Tooltip>

      <Modal opened={removing} onClose={() => setRemoving(false)} title={t("common.delete")} centered>
        <Text size="sm">{t("sessions.deleteText", { name: session.teacherName })}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setRemoving(false)}>
            {t("common.cancel")}
          </Button>
          <Button color="red" loading={busy} onClick={remove}>
            {t("common.delete")}
          </Button>
        </Group>
      </Modal>
    </li>
  );
}
