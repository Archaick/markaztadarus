import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Group, Loader, Modal, NumberInput, Select, Stack, Text, TextInput } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useBelajar } from "./BelajarData";
import { saveLesson } from "./actions";
import { BASE, NS, SECTION_TYPES, blankAyah, issuesOfSection, questionsOf } from "./belajarSchema";
import { SURAHS, surahByNo } from "./surahs";
import styles from "./Belajar.module.css";

/** Every surah of Buku Guru as a card, with how complete it is. */
export default function LessonsPage() {
  const { t } = useTranslation(NS);
  const { lessons, loading, sectionsOf } = useBelajar();
  const [creating, setCreating] = useState(false);

  if (loading) return <Loader />;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{t("lessons.title")}</h1>
          <p className={styles.pageSub}>{t("lessons.intro")}</p>
        </div>
        <Button color="#003366" leftSection={<IconPlus size={18} />} onClick={() => setCreating(true)}>
          {t("lessons.new")}
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className={styles.drop}>
          <p className={styles.pageSub}>{t("lessons.empty")}</p>
          <Button color="#003366" leftSection={<IconPlus size={18} />} onClick={() => setCreating(true)}>
            {t("lessons.new")}
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {lessons.map((lesson) => {
            const secs = sectionsOf(lesson.id);
            const questions = secs.reduce((n, s) => n + questionsOf(s).length, 0);
            const issues = secs.reduce((n, s) => n + issuesOfSection(s), 0);
            const filled = new Set(secs.filter((s) => questionsOf(s).length || (s.tasks || []).length || (s.reading || []).length).map((s) => s.key));
            return (
              <Link key={lesson.id} to={`${BASE}/surat/${lesson.id}`} className={styles.lessonCard}>
                <div className={styles.lessonTop}>
                  <span className={styles.lessonNo}>{lesson.surah || lesson.order || "–"}</span>
                  {lesson.published ? <Badge color="teal">{t("lessons.published")}</Badge> : <Badge color="gray">{t("lessons.draft")}</Badge>}
                </div>
                <div className={styles.lessonNames}>
                  <h2 className={styles.lessonTitle}>{lesson.title}</h2>
                  {lesson.titleAr && <span className={styles.arabic}>{lesson.titleAr}</span>}
                </div>
                <div className={styles.stats}>
                  <Badge variant="light" color="#003366">{t("lessons.ayat", { count: (lesson.ayat || []).length })}</Badge>
                  <Badge variant="light" color="#003366">{t("lessons.questions", { count: questions })}</Badge>
                  {issues > 0 && <Badge color="orange">{t("lessons.issues", { count: issues })}</Badge>}
                </div>
                <div className={styles.fiveT} title={t("lessons.progress")}>
                  {SECTION_TYPES.map((s) => (
                    <span key={s.key} className={filled.has(s.key) ? styles.on : ""} />
                  ))}
                </div>
                <Text size="xs" c="dimmed">
                  {t("lessons.sections", { n: filled.size, total: SECTION_TYPES.length })}
                </Text>
              </Link>
            );
          })}
        </div>
      )}

      <NewLesson opened={creating} onClose={() => setCreating(false)} taken={new Set(lessons.map((l) => Number(l.surah)))} nextOrder={(lessons.at(-1)?.order || 0) + 1} />
    </>
  );
}

/** A new surah card: pick the surah, its name, number and ayat come with it. */
function NewLesson({ opened, onClose, taken, nextOrder }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const navigate = useNavigate();
  const [pick, setPick] = useState(null);
  const [busy, setBusy] = useState(false);
  const surah = surahByNo(pick);

  const close = () => {
    setPick(null);
    onClose();
  };
  const create = async () => {
    setBusy(true);
    try {
      const id = await saveLesson(user, null, {
        title: surah.name,
        titleAr: surah.ar,
        surah: surah.no,
        order: nextOrder,
        book: "Jilid 1",
        // one empty card per ayah, for the 5T material
        ayat: Array.from({ length: surah.ayat }, (_, i) => blankAyah(i + 1)),
      });
      close();
      navigate(`${BASE}/surat/${id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title={t("lessons.new")} centered>
      <Stack>
        <Select
          label={t("lesson.pick")}
          placeholder={t("lesson.pickHint")}
          searchable
          data-autofocus
          nothingFoundMessage={t("lesson.none")}
          data={SURAHS.map((s) => ({ value: String(s.no), label: `${s.no}. ${s.name} · ${s.ar}`, disabled: taken.has(s.no) }))}
          value={pick}
          onChange={setPick}
        />
        {surah && (
          <div className={styles.reading}>
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text fw={800} size="lg">
                  {surah.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {t("lesson.surahNo", { n: surah.no })} · {t("lessons.ayat", { count: surah.ayat })}
                </Text>
              </div>
              <span className={styles.arabic} style={{ fontSize: "2rem" }}>
                {surah.ar}
              </span>
            </Group>
          </div>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            {t("cancel")}
          </Button>
          <Button color="#003366" onClick={create} loading={busy} disabled={!surah}>
            {t("lesson.create")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

/** The name and place of a surah card. */
export function LessonForm({ opened, onClose, lesson }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const value = form || { title: lesson?.title || "", titleAr: lesson?.titleAr || "", order: lesson?.order ?? 1, book: lesson?.book || "Jilid 1" };
  const set = (k) => (v) => setForm({ ...value, [k]: v });

  const close = () => {
    setForm(null);
    onClose();
  };
  const save = async () => {
    setBusy(true);
    try {
      await saveLesson(user, lesson, { ...value, title: value.title.trim().slice(0, 200), titleAr: value.titleAr.trim().slice(0, 200) });
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title={t("lesson.edit")} centered>
      <Stack>
        <TextInput label={t("lesson.name")} value={value.title} onChange={(e) => set("title")(e.currentTarget.value)} />
        <TextInput label={t("lesson.nameAr")} value={value.titleAr} onChange={(e) => set("titleAr")(e.currentTarget.value)} className={styles.arabicInput} />
        <Group grow>
          <NumberInput label={t("lesson.order")} min={1} max={500} value={value.order} onChange={set("order")} />
          <TextInput label={t("lesson.book")} value={value.book} onChange={(e) => set("book")(e.currentTarget.value)} />
        </Group>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            {t("cancel")}
          </Button>
          <Button color="#003366" onClick={save} loading={busy} disabled={!value.title.trim()}>
            {t("save")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
