import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ActionIcon, Avatar, Badge, Button, Group, Loader, Modal, Text, TextInput, Tooltip } from "@mantine/core";
import { IconSearch, IconTrash, IconUsers } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { timeAgo } from "../Internal/timeAgo";
import { useBelajar } from "./BelajarData";
import { deleteLearner, progressOf } from "./actions";
import { BASE, NS } from "./belajarSchema";
import styles from "./Belajar.module.css";

/** Every teacher who joined, in any class: find them, see their classes, delete them. */
export default function TeachersPage() {
  const { isSuperAdmin } = useAccess();
  const { t } = useTranslation(NS);
  const { learners, classById, loading } = useBelajar();
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState(null);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (learners || []).filter((l) => !term || [l.name, l.email].some((v) => (v || "").toLowerCase().includes(term)));
  }, [learners, search]);

  if (loading || !learners) return <Loader />;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{t("teachers.title")}</h1>
          <p className={styles.pageSub}>{t("teachers.intro")}</p>
        </div>
      </div>

      {learners.length === 0 ? (
        <div className={styles.drop}>
          <IconUsers size={36} color="#1a4970" />
          <p className={styles.pageSub}>{t("teachers.empty")}</p>
        </div>
      ) : (
        <>
          <TextInput mb="md" leftSection={<IconSearch size={16} />} placeholder={t("teachers.search")} value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
          <div className={styles.rows}>
            {shown.map((l) => (
              <div key={l.id} className={styles.row}>
                <Avatar src={l.photoURL} radius="xl" color="#003366">
                  {(l.name || l.email).charAt(0).toUpperCase()}
                </Avatar>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>{l.name || l.email}</div>
                  <div className={styles.rowSub}>
                    {l.email}
                    {l.lastSeenAt ? ` · ${t("classes.seen", { time: timeAgo(l.lastSeenAt) })}` : ""}
                  </div>
                  <Group gap={6} mt={4}>
                    {(l.classIds || []).map((id) =>
                      classById.get(id) ? (
                        <Badge key={id} component={Link} to={`${BASE}/kelas/${id}`} variant="light" color="#003366" style={{ cursor: "pointer" }}>
                          {classById.get(id).name}
                        </Badge>
                      ) : null
                    )}
                    {!(l.classIds || []).some((id) => classById.get(id)) && (
                      <Badge variant="light" color="gray">
                        {t("teachers.noClass")}
                      </Badge>
                    )}
                  </Group>
                </div>
                {isSuperAdmin && (
                  <Tooltip label={t("teachers.delete")}>
                    <ActionIcon variant="subtle" color="red" onClick={() => setRemoving(l)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <DeleteTeacher learner={removing} onClose={() => setRemoving(null)} />
    </>
  );
}

/** Deleting a teacher entirely (record, progress, invite), kept in the bin for 30 days. */
export function DeleteTeacher({ learner, onClose, onDone }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const { inviteByEmail } = useBelajar();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <Modal opened={!!learner} onClose={onClose} title={t("teachers.delete")} centered>
      {learner && (
        <>
          <Text mb="xs">{t("teachers.deleteBody", { name: learner.name || learner.email })}</Text>
          <Text size="sm" c="dimmed" mb="md">
            {t("teachers.deleteNote")}
          </Text>
          {failed && (
            <Text size="sm" c="red" mb="sm">
              {t("access.failed")}
            </Text>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              color="red"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                setFailed(false);
                try {
                  await deleteLearner(user, learner, await progressOf(learner.id), inviteByEmail.get(learner.email));
                  onClose();
                  onDone?.();
                } catch (err) {
                  console.error("Could not delete the teacher:", err);
                  setFailed(true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("delete")}
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
