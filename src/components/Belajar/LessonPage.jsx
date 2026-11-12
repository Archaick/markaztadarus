import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Button, Group, Loader, Modal, Switch, Text, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconEye, IconPencil, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useBelajar } from "./BelajarData";
import { deleteLesson, saveLesson } from "./actions";
import { BASE, NS, kindOf, learnerSections, questionsOf } from "./belajarSchema";
import SectionsList from "./SectionsList";
import TeacherWalk from "../Guru/TeacherWalk";
import { LessonForm } from "./LessonsPage";
import styles from "./Belajar.module.css";

/** One surah: its 5T material and the sections of the book. */
export default function LessonPage() {
  const { lessonId } = useParams();
  const { t } = useTranslation(NS);
  const { user, isSuperAdmin } = useAccess();
  const navigate = useNavigate();
  const { loading, lessonById, sectionsOf } = useBelajar();
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [walking, setWalking] = useState(false); // the whole surah, on the teachers' own screens

  if (loading) return <Loader />;
  const lesson = lessonById.get(lessonId);
  if (!lesson) return <Text c="dimmed">{t("lesson.missing")}</Text>;
  const sections = sectionsOf(lesson.id);

  const publish = async (published) => {
    setBusy(true);
    try {
      await saveLesson(user, lesson, { published });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to={BASE} className={styles.crumb}>
        <IconArrowLeft size={16} /> {t("nav.lessons")}
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>
            {lesson.title} {lesson.titleAr && <span className={styles.arabic}>{lesson.titleAr}</span>}
          </h1>
          <p className={styles.pageSub}>
            {[lesson.book, lesson.surah && t("lesson.surahNo", { n: lesson.surah })].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Group>
          <Switch checked={!!lesson.published} disabled={busy} onChange={(e) => publish(e.currentTarget.checked)} label={t("lesson.publish")} />
          <Tooltip label={t("lesson.edit")}>
            <ActionIcon variant="light" color="#003366" size="lg" onClick={() => setEditing(true)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          {isSuperAdmin && (
            <Tooltip label={t("lesson.delete")}>
              <ActionIcon variant="light" color="red" size="lg" onClick={() => setRemoving(true)}>
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </div>

      {/* owner: one list, Daftar Pembelajaran; each item holds its PDF and then its questions */}
      <div className={styles.listHead}>
        <h2 className={styles.listTitle}>{t("lesson.tabSections")}</h2>
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            {t("lesson.questionCount", { count: sections.reduce((n, s) => n + (kindOf(s) === "written" ? (s.tasks || []).length : questionsOf(s).length), 0) })}
          </Text>
          <Button variant="light" color="violet" radius="xl" leftSection={<IconEye size={16} />} disabled={!learnerSections(sections, lesson.id).length} onClick={() => setWalking(true)}>
            {t("board.tryAll")}
          </Button>
        </Group>
      </div>
      <SectionsList lesson={lesson} sections={sections} />
      {walking && <TeacherWalk lesson={lesson} sections={sections} onClose={() => setWalking(false)} />}

      <LessonForm opened={editing} onClose={() => setEditing(false)} lesson={lesson} />
      <Modal opened={removing} onClose={() => setRemoving(false)} title={t("lesson.delete")} centered>
        <Text mb="md">{t("lesson.deleteBody", { title: lesson.title, count: sections.length })}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setRemoving(false)}>
            {t("cancel")}
          </Button>
          <Button
            color="red"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await deleteLesson(user, lesson, sections);
                navigate(BASE);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("delete")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
