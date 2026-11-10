import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Alert, Button, Group, Loader, Modal, NumberInput, SegmentedControl, Select, Text, Textarea, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconArrowLeft, IconArrowUp, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useBelajar } from "./BelajarData";
import { deleteSection, saveSectionContent } from "./actions";
import { BASE, NS, QUESTION_TYPES, blankQuestion, fiveTOf, kindOf, newId, questionIssues, sectionTitle } from "./belajarSchema";
import TeacherCards from "./TeacherCards";
import QuestionEditor from "./QuestionEditor";
import styles from "./Belajar.module.css";

const blankOf = (kind) => ({ kind, reading: [], parts: kind === "quiz" ? [{ heading: "", instructions: "", questions: [] }] : [], tasks: [], instructions: "" });

const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

/** One section of a surah: its text to read, question parts and written tasks. */
export default function SectionPage() {
  const { lessonId, sectionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const { loading, lessonById, sectionsOf } = useBelajar();
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [mode, setMode] = useState("edit");

  if (loading) return <Loader />;
  const lesson = lessonById.get(lessonId);
  // the address names the section (older links named its standard key)
  const section = lesson ? sectionsOf(lesson.id).find((s) => s.id === sectionId) || sectionsOf(lesson.id).find((s) => s.key === sectionId) : null;
  if (!lesson || !section) return <Text c="dimmed">{t("lesson.missing")}</Text>;
  const kind = kindOf(section);
  const tag = fiveTOf(section);
  const name = sectionTitle(section, t);
  const stored = { ...blankOf(kind), ...section };
  // always at least one group, or a question section would have nowhere to add to
  if (kind === "quiz" && !stored.parts?.length) stored.parts = [{ heading: "", instructions: "", questions: [] }];
  const value = draft || stored;
  const set = (patch) => setDraft({ ...value, ...patch });
  const bad = (value.parts || []).flatMap((p) => p.questions).filter((q) => questionIssues(q).length).length;

  const save = async () => {
    setBusy(true);
    try {
      const { reading, parts, tasks, instructions } = value;
      await saveSectionContent(user, lesson, section, {
        instructions,
        reading: reading.filter((b) => b.text.trim()),
        parts,
        tasks: tasks.filter((x) => x.prompt.trim()),
      });
      setDraft(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to={`${BASE}/surat/${lesson.id}`} className={styles.crumb}>
        <IconArrowLeft size={16} /> {lesson.title}
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{name}</h1>
          <p className={styles.pageSub}>
            {t(`kind.${kind}`)}
            {tag && (
              <>
                {" "}
                · <span className={styles.tag}>{t(`fiveT.${tag}`)}</span>
              </>
            )}
          </p>
        </div>
        <Group>
          <SegmentedControl
            color="#003366"
            value={mode}
            onChange={setMode}
            data={[
              { value: "edit", label: t("sectionPage.modeEdit") },
              { value: "preview", label: t("sectionPage.modePreview") },
            ]}
          />
          {section && (
            <Tooltip label={t("sectionPage.delete")}>
              <ActionIcon variant="light" color="red" size="lg" onClick={() => setRemoving(true)}>
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </div>

      {mode === "preview" ? (
        <>
          <Alert color="blue" mb="lg">
            {t("sectionPage.previewNote")}
          </Alert>
          <TeacherCards key={JSON.stringify(value).length} section={value} title={`${lesson.title} · ${name}`} />
        </>
      ) : (
        <>
          {bad > 0 && (
            <Alert color="orange" icon={<IconAlertTriangle size={18} />} mb="md">
              {t("sectionPage.bad", { count: bad })}
            </Alert>
          )}

          <ReadingEditor value={value.reading} onChange={(reading) => set({ reading })} />

          {kind === "quiz" &&
            value.parts.map((part, p) => (
              <div key={p} className={styles.panel}>
                {part.questions.map((q, i) => (
                  <QuestionEditor
                    key={q.id}
                    n={i + 1}
                    q={q}
                    onChange={(nq) => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, questions: x.questions.map((y, k) => (k === i ? nq : y)) } : x)) })}
                    onMove={(d) => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, questions: move(x.questions, i, d) } : x)) })}
                    onRemove={() => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, questions: x.questions.filter((_, k) => k !== i) } : x)) })}
                  />
                ))}
                <Group mt="md" gap="xs">
                  {QUESTION_TYPES.map((qt) => (
                    <Button
                      key={qt}
                      size="xs"
                      variant="light"
                      color="#003366"
                      leftSection={<IconPlus size={14} />}
                      onClick={() => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, questions: [...x.questions, blankQuestion(qt)] } : x)) })}
                    >
                      {t(`qtype.${qt}`)}
                    </Button>
                  ))}
                </Group>
              </div>
            ))}
          {kind === "written" && (
            <div className={styles.panel}>
              <Textarea mb="md" label={t("sectionPage.instructions")} autosize minRows={1} value={value.instructions} onChange={(e) => set({ instructions: e.currentTarget.value })} />
              {value.tasks.map((task, i) => (
                <div key={task.id} className={styles.question}>
                  <Group justify="space-between" mb={6}>
                    <Text fw={700}>{t("sectionPage.task", { n: i + 1 })}</Text>
                    <ActionIcon variant="subtle" color="red" onClick={() => set({ tasks: value.tasks.filter((_, j) => j !== i) })}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                  <Textarea autosize minRows={2} value={task.prompt} onChange={(e) => set({ tasks: value.tasks.map((x, j) => (j === i ? { ...x, prompt: e.currentTarget.value } : x)) })} />
                  <NumberInput
                    mt="xs"
                    w={200}
                    label={t("sectionPage.lines")}
                    min={1}
                    max={20}
                    value={task.lines}
                    onChange={(v) => set({ tasks: value.tasks.map((x, j) => (j === i ? { ...x, lines: Number(v) || 3 } : x)) })}
                  />
                </div>
              ))}
              <Button mt="md" size="xs" variant="light" color="#003366" leftSection={<IconPlus size={14} />} onClick={() => set({ tasks: [...value.tasks, { id: newId(), prompt: "", lines: 3 }] })}>
                {t("sectionPage.addTask")}
              </Button>
            </div>
          )}
        </>
      )}

      {draft && (
        <div className={styles.sticky}>
          <Button variant="default" onClick={() => setDraft(null)}>
            {t("cancel")}
          </Button>
          <Button color="#003366" loading={busy} onClick={save}>
            {t("save")}
          </Button>
        </div>
      )}

      <Modal opened={removing} onClose={() => setRemoving(false)} title={t("sectionPage.delete")} centered>
        <Text mb="md">{t("sectionPage.deleteBody")}</Text>
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
                await deleteSection(user, lesson, section);
                navigate(`${BASE}/surat/${lesson.id}`);
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

/** The text a section opens with (doa, hadis, goals): one block per line, Arabic set right to left. */
function ReadingEditor({ value, onChange }) {
  const { t } = useTranslation(NS);
  const types = ["heading", "text", "arabic"].map((v) => ({ value: v, label: t(`block.${v}`) }));
  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{t("sectionPage.reading")}</h3>
      {value.length === 0 && (
        <Text size="sm" c="dimmed" mb="sm">
          {t("sectionPage.noReading")}
        </Text>
      )}
      {value.map((b, i) => (
        <Group key={i} align="flex-start" mb={8} wrap="nowrap">
          <Select w={120} data={types} value={b.type} allowDeselect={false} onChange={(v) => onChange(value.map((x, j) => (j === i ? { ...x, type: v } : x)))} />
          <Textarea
            style={{ flex: 1 }}
            className={b.type === "arabic" ? styles.arabicInput : undefined}
            autosize
            minRows={1}
            value={b.text}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, text: e.currentTarget.value } : x)))}
          />
          <ActionIcon variant="subtle" onClick={() => onChange(move(value, i, -1))}>
            <IconArrowUp size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
      <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} onClick={() => onChange([...value, { type: "text", text: "" }])}>
        {t("sectionPage.addBlock")}
      </Button>
    </div>
  );
}
