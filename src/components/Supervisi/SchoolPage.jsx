import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Button, Group, Loader, Modal, Text, TextInput, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconClipboardCheck, IconPencil, IconPlayerPlay, IconTrash, IconUserPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useSupervisi } from "./SupervisiData";
import { BASE } from "./SupervisiShell";
import { deleteSchool, deleteTeacher, saveTeacher } from "./actions";
import { ProgressRing } from "./parts";
import { SessionRow } from "./OverviewPage";
import { SchoolCover, SchoolForm, schoolProgress } from "./SchoolsPage";
import PickInstrument, { useStartSession } from "./NewSession";
import { formatAverage } from "./supervisiSchema";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";

/** One school: its teachers (each with their last result) and its supervisions. */
export default function SchoolPage() {
  const { schoolId } = useParams();
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const navigate = useNavigate();
  const { loading, schoolById, teachersOf, sessions, teachers } = useSupervisi();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [removing, setRemoving] = useState(null); // teacher | "school"
  const [startFor, setStartFor] = useState(null); // the teacher, while an instrument is picked
  const { active, busy, start } = useStartSession();

  if (loading) return <Loader />;
  const school = schoolById.get(schoolId);
  if (!school) return <p className={styles.empty}>{t("schools.missing")}</p>;

  const list = teachersOf(school.id);
  const own = sessions.filter((s) => s.schoolId === school.id);
  const progress = schoolProgress(school, teachers, sessions);

  const addTeacher = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await saveTeacher(user, null, { name, schoolId: school.id });
    setNewName("");
  };

  // one active instrument (the usual case) starts straight away
  const supervise = (teacher) => {
    if (!active.length) return navigate(`${BASE}/instrumen`);
    if (active.length === 1) return start(school, teacher, active[0]);
    setStartFor(teacher);
  };

  const confirmRemove = async () => {
    if (removing === "school") {
      await deleteSchool(user, school, list);
      navigate(`${BASE}/sekolah`);
    } else if (removing) {
      await deleteTeacher(user, removing);
    }
    setRemoving(null);
  };

  return (
    <>
      <Link to={`${BASE}/sekolah`} className={styles.crumb}>
        <IconArrowLeft size={16} className={styles.flip} /> {t("schools.title")}
      </Link>
      <div className={styles.hero}>
        <SchoolCover school={school} />
        <div className={styles.cardTop} style={{ alignSelf: "flex-end" }}>
          <h1 className={styles.cardTitle} dir="auto">
            {school.name}
          </h1>
          <p className={styles.cardPlace} dir="auto">
            {[school.city, school.province].filter(Boolean).join(", ")}
          </p>
          <Group gap="xs" mt="md">
            <Button size="xs" variant="white" color="dark" leftSection={<IconPencil size={14} />} onClick={() => setEditing(true)}>
              {t("schools.edit")}
            </Button>
            <Button size="xs" variant="white" color="red" leftSection={<IconTrash size={14} />} onClick={() => setRemoving("school")}>
              {t("common.delete")}
            </Button>
          </Group>
        </div>
        <div className={styles.cardBottom}>
          <ProgressRing value={progress.percent} size={110} />
        </div>
      </div>

      <div className={styles.twoCols}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t("teachers.title", { count: list.length })}</h2>
          <form onSubmit={addTeacher} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <TextInput
              style={{ flex: 1 }}
              placeholder={t("teachers.addPlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
              dir="auto"
            />
            <Button type="submit" color="#003366" leftSection={<IconUserPlus size={16} />} disabled={!newName.trim()}>
              {t("teachers.add")}
            </Button>
          </form>
          {list.length === 0 ? (
            <p className={styles.empty}>{t("teachers.empty")}</p>
          ) : (
            <ul className={styles.rows}>
              {list.map((teacher) => {
                const done = own.filter((s) => s.teacherId === teacher.id && s.status === "done");
                const last = done[0];
                const open = own.find((s) => s.teacherId === teacher.id && s.status !== "done");
                return (
                  <li key={teacher.id} className={styles.row}>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle} dir="auto">
                        {teacher.name}
                      </div>
                      <div className={styles.rowSub}>{t("teachers.count", { count: done.length })}</div>
                    </div>
                    <div className={styles.rowEnd}>
                      {last && (
                        <span className={styles.score}>
                          {formatAverage(last.average)}
                          <small>{t("teachers.last")}</small>
                        </span>
                      )}
                      {open ? (
                        <Button component={Link} to={`${BASE}/sesi/${open.id}`} size="xs" color="#cc9933" leftSection={<IconPlayerPlay size={14} />}>
                          {t("teachers.continue")}
                        </Button>
                      ) : (
                        <Button size="xs" color="#003366" leftSection={<IconClipboardCheck size={14} />} loading={busy && startFor === null} onClick={() => supervise(teacher)}>
                          {t("teachers.supervise")}
                        </Button>
                      )}
                      <Tooltip label={t("teachers.rename")}>
                        <ActionIcon variant="subtle" color="gray" onClick={() => setRenaming({ ...teacher })}>
                          <IconPencil size={17} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t("common.delete")}>
                        <ActionIcon variant="subtle" color="red" onClick={() => setRemoving(teacher)}>
                          <IconTrash size={17} />
                        </ActionIcon>
                      </Tooltip>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t("sessions.title")}</h2>
          {own.length ? (
            <ul className={styles.rows}>
              {own.map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>{t("sessions.emptySchool")}</p>
          )}
        </section>
      </div>

      <SchoolForm opened={editing} school={school} onClose={() => setEditing(false)} />
      <PickInstrument opened={!!startFor} onClose={() => setStartFor(null)} busy={busy} onPick={(instrument) => start(school, startFor, instrument)} />

      <Modal opened={!!renaming} onClose={() => setRenaming(null)} title={t("teachers.rename")} centered>
        {renaming && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const original = list.find((x) => x.id === renaming.id);
              await saveTeacher(user, original, { name: renaming.name.trim(), schoolId: school.id });
              setRenaming(null);
            }}
          >
            <TextInput value={renaming.name} onChange={(e) => setRenaming({ ...renaming, name: e.currentTarget.value })} dir="auto" data-autofocus />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setRenaming(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" color="#003366" disabled={!renaming.name.trim()}>
                {t("common.save")}
              </Button>
            </Group>
          </form>
        )}
      </Modal>

      <Modal opened={!!removing} onClose={() => setRemoving(null)} title={t("common.delete")} centered>
        <Text size="sm">
          {removing === "school" ? t("schools.deleteText", { name: school.name }) : t("teachers.deleteText", { name: removing?.name || "" })}
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setRemoving(null)}>
            {t("common.cancel")}
          </Button>
          <Button color="red" onClick={confirmRemove}>
            {t("common.delete")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
