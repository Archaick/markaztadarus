import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Button, Group, Loader, Modal, Switch, Tabs, Text, TextInput, Textarea, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useBelajar } from "./BelajarData";
import { deleteLesson, saveLesson } from "./actions";
import { BASE, NS, blankAyah, kindOf, questionsOf } from "./belajarSchema";
import SectionsList from "./SectionsList";
import QuestionsBoard from "./QuestionsBoard";
import { LessonForm } from "./LessonsPage";
import styles from "./Belajar.module.css";

const lines = (arr) => (arr || []).join("\n");
const unlines = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);

/** One surah: its 5T material and the sections of the book. */
export default function LessonPage() {
  const { lessonId } = useParams();
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const navigate = useNavigate();
  const { loading, lessonById, sectionsOf } = useBelajar();
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);

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
          <Tooltip label={t("lesson.delete")}>
            <ActionIcon variant="light" color="red" size="lg" onClick={() => setRemoving(true)}>
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>

      <Tabs defaultValue="questions" keepMounted={false}>
        <Tabs.List mb="lg">
          <Tabs.Tab value="questions">{t("lesson.tabQuestions", { count: sections.reduce((n, s) => n + (kindOf(s) === "written" ? (s.tasks || []).length : questionsOf(s).length), 0) })}</Tabs.Tab>
          <Tabs.Tab value="sections">{t("lesson.tabSections")}</Tabs.Tab>
          <Tabs.Tab value="materi">{t("lesson.tabMateri", { count: (lesson.ayat || []).length })}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="questions">
          <QuestionsBoard lesson={lesson} sections={sections} />
        </Tabs.Panel>
        <Tabs.Panel value="sections">
          <SectionsList lesson={lesson} sections={sections} />
        </Tabs.Panel>
        <Tabs.Panel value="materi">
          <MateriEditor lesson={lesson} />
        </Tabs.Panel>
      </Tabs>

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

/** Tamhid and every ayah with its theme, tafsir, tadabbur and tazkiyah (one point per line). */
function MateriEditor({ lesson }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const value = draft || { tamhid: lesson.tamhid || { text: [], themes: [] }, ayat: lesson.ayat || [] };
  const setAyah = (i, k, v) => setDraft({ ...value, ayat: value.ayat.map((a, j) => (j === i ? { ...a, [k]: v } : a)) });
  const setTheme = (i, k, v) => setDraft({ ...value, tamhid: { ...value.tamhid, themes: value.tamhid.themes.map((r, j) => (j === i ? { ...r, [k]: v } : r)) } });

  const save = async (data) => {
    setBusy(true);
    try {
      await saveLesson(user, lesson, data);
      setDraft(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>{t("fiveT.tamhid")}</h3>
        <Textarea
          label={t("materi.tamhidText")}
          description={t("materi.onePerLine")}
          autosize
          minRows={3}
          value={lines(value.tamhid.text)}
          onChange={(e) => setDraft({ ...value, tamhid: { ...value.tamhid, text: e.currentTarget.value.split("\n") } })}
        />
        <Text fw={700} size="sm" mt="md" mb={6}>
          {t("materi.themes")}
        </Text>
        {value.tamhid.themes.map((row, i) => (
          <Group key={i} mb={8} wrap="nowrap">
            <TextInput w={110} placeholder={t("materi.ayatRange")} value={row.ayat} onChange={(e) => setTheme(i, "ayat", e.currentTarget.value)} />
            <TextInput style={{ flex: 1 }} placeholder={t("materi.tema")} value={row.tema} onChange={(e) => setTheme(i, "tema", e.currentTarget.value)} />
            <ActionIcon variant="subtle" color="red" onClick={() => setDraft({ ...value, tamhid: { ...value.tamhid, themes: value.tamhid.themes.filter((_, j) => j !== i) } })}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ))}
        <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} onClick={() => setDraft({ ...value, tamhid: { ...value.tamhid, themes: [...value.tamhid.themes, { ayat: "", tema: "" }] } })}>
          {t("materi.addTheme")}
        </Button>
      </div>

      {value.ayat.map((a, i) => (
        <div key={i} className={styles.panel}>
          <Group justify="space-between" mb="sm">
            <h3 className={styles.panelTitle} style={{ margin: 0 }}>
              {t("materi.ayah", { n: a.no })}
            </h3>
            <ActionIcon variant="subtle" color="red" onClick={() => setDraft({ ...value, ayat: value.ayat.filter((_, j) => j !== i) })}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
          <Textarea className={styles.arabicInput} label={t("fiveT.tilawah")} autosize minRows={1} value={a.arabic} onChange={(e) => setAyah(i, "arabic", e.currentTarget.value)} />
          <TextInput mt="sm" label={t("materi.tema")} value={a.tema} onChange={(e) => setAyah(i, "tema", e.currentTarget.value)} />
          {["tafsir", "tadabbur", "tazkiyah"].map((k) => (
            <Textarea
              key={k}
              mt="sm"
              label={t(`fiveT.${k}`)}
              description={k === "tafsir" ? undefined : t("materi.onePerLine")}
              autosize
              minRows={2}
              value={lines(a[k])}
              onChange={(e) => setAyah(i, k, e.currentTarget.value.split("\n"))}
            />
          ))}
        </div>
      ))}

      <Button mt="md" variant="light" color="#003366" leftSection={<IconPlus size={16} />} onClick={() => setDraft({ ...value, ayat: [...value.ayat, blankAyah((value.ayat.at(-1)?.no || 0) + 1)] })}>
        {t("materi.addAyah")}
      </Button>

      {draft && (
        <div className={styles.sticky}>
          <Button variant="default" onClick={() => setDraft(null)}>
            {t("cancel")}
          </Button>
          <Button
            color="#003366"
            loading={busy}
            onClick={() => {
              // empty lines typed while editing are dropped on save
              const tidy = {
                tamhid: { text: unlines(lines(value.tamhid.text)), themes: value.tamhid.themes.filter((r) => r.ayat || r.tema) },
                ayat: value.ayat.map((a) => ({ ...a, tafsir: unlines(lines(a.tafsir)), tadabbur: unlines(lines(a.tadabbur)), tazkiyah: unlines(lines(a.tazkiyah)) })),
              };
              save(tidy);
            }}
          >
            {t("save")}
          </Button>
        </div>
      )}
    </>
  );
}
