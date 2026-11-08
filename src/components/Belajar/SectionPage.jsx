import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ActionIcon, Alert, Badge, Button, Checkbox, Group, Loader, Modal, NumberInput, Radio, SegmentedControl, Select, Text, TextInput, Textarea, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconArrowLeft, IconArrowDown, IconArrowUp, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useBelajar } from "./BelajarData";
import { deleteSection, saveSection } from "./actions";
import { BASE, NS, QUESTION_TYPES, blankQuestion, newId, questionIssues, sectionType } from "./belajarSchema";
import TeacherCards from "./TeacherCards";
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
  const { lessonId, sectionKey } = useParams();
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const { loading, lessonById, sectionsOf } = useBelajar();
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [mode, setMode] = useState("edit");

  if (loading) return <Loader />;
  const lesson = lessonById.get(lessonId);
  const type = sectionType(sectionKey);
  if (!lesson || !type) return <Text c="dimmed">{t("lesson.missing")}</Text>;
  const section = sectionsOf(lesson.id).find((s) => s.key === sectionKey) || null;
  const value = draft || (section ? { ...blankOf(section.kind), ...section } : blankOf(type.kind));
  const set = (patch) => setDraft({ ...value, ...patch });
  const bad = (value.parts || []).flatMap((p) => p.questions).filter((q) => questionIssues(q).length).length;

  const save = async () => {
    setBusy(true);
    try {
      const { reading, parts, tasks, instructions, kind } = value;
      await saveSection(user, lesson, section, sectionKey, {
        kind,
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
          <h1 className={styles.pageTitle}>{t(`section.${sectionKey}`)}</h1>
          <p className={styles.pageSub}>
            {t(`kind.${type.kind}`)}
            {type.t && (
              <>
                {" "}
                · <span className={styles.tag}>{t(`fiveT.${type.t}`)}</span>
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
          <TeacherCards key={JSON.stringify(value).length} section={value} title={`${lesson.title} · ${t(`section.${sectionKey}`)}`} />
        </>
      ) : (
        <>
          {!section && !draft && (
            <Alert color="blue" mb="md">
              {t("sectionPage.new")}
            </Alert>
          )}
          {bad > 0 && (
            <Alert color="orange" icon={<IconAlertTriangle size={18} />} mb="md">
              {t("sectionPage.bad", { count: bad })}
            </Alert>
          )}

          <ReadingEditor value={value.reading} onChange={(reading) => set({ reading })} />

          {type.kind === "quiz" &&
            value.parts.map((part, p) => (
              <div key={p} className={styles.panel}>
                <Group align="flex-end" mb="sm" wrap="nowrap">
                  <TextInput
                    style={{ flex: 1 }}
                    label={t("sectionPage.partHeading")}
                    value={part.heading}
                    onChange={(e) => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, heading: e.currentTarget.value } : x)) })}
                  />
                  <ActionIcon variant="subtle" color="red" size="lg" onClick={() => set({ parts: value.parts.filter((_, j) => j !== p) })}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
                <Textarea
                  mb="md"
                  label={t("sectionPage.instructions")}
                  autosize
                  minRows={1}
                  value={part.instructions}
                  onChange={(e) => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, instructions: e.currentTarget.value } : x)) })}
                />
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
          {type.kind === "quiz" && (
            <Button mt="md" variant="subtle" color="#003366" leftSection={<IconPlus size={16} />} onClick={() => set({ parts: [...value.parts, { heading: "", instructions: "", questions: [] }] })}>
              {t("sectionPage.addPart")}
            </Button>
          )}

          {type.kind === "written" && (
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
                setRemoving(false);
                setDraft(null);
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

/** One question with its answer: the correct options are ticked (green). */
function QuestionEditor({ n, q, onChange, onMove, onRemove }) {
  const { t } = useTranslation(NS);
  const issues = questionIssues(q);
  const set = (patch) => onChange({ ...q, ...patch });
  const toggle = (k) => {
    const on = (q.correct || []).includes(k);
    if (q.type === "multi") set({ correct: on ? q.correct.filter((x) => x !== k) : [...q.correct, k].sort() });
    else set({ correct: [k] });
  };
  const changeType = (type) => {
    if (type === q.type) return;
    if (type === "match" || q.type === "match" || type === "truefalse") return onChange({ ...blankQuestion(type), id: q.id, stem: q.stem, explanation: q.explanation });
    set({ type, correct: type === "single" ? (q.correct || []).slice(0, 1) : q.correct });
  };

  return (
    <div className={`${styles.question} ${issues.length ? styles.questionBad : ""}`}>
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Group gap="xs">
          <Badge variant="filled" color="#003366">
            {n}
          </Badge>
          <Select size="xs" w={170} allowDeselect={false} data={QUESTION_TYPES.map((v) => ({ value: v, label: t(`qtype.${v}`) }))} value={q.type} onChange={changeType} />
          {issues.map((x) => (
            <Badge key={x} color="orange" variant="light">
              {t(`issue.${x}`)}
            </Badge>
          ))}
        </Group>
        <Group gap={2} wrap="nowrap">
          <ActionIcon variant="subtle" onClick={() => onMove(-1)}>
            <IconArrowUp size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" onClick={() => onMove(1)}>
            <IconArrowDown size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={onRemove}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
      <Textarea autosize minRows={1} placeholder={t("question.stem")} value={q.stem} onChange={(e) => set({ stem: e.currentTarget.value })} mb="sm" />

      {q.type === "match" ? (
        <>
          <Text size="xs" c="dimmed" mb={6}>
            {t("question.matchHint")}
          </Text>
          {q.left.map((left, k) => (
            <Group key={k} mb={8} wrap="nowrap" align="flex-start">
              <TextInput style={{ flex: 1 }} value={left} placeholder={t("question.left")} onChange={(e) => set({ left: q.left.map((x, j) => (j === k ? e.currentTarget.value : x)) })} />
              <Select
                style={{ flex: 1.4 }}
                placeholder={t("question.pick")}
                data={q.right.map((r, j) => ({ value: String(j), label: `${String.fromCharCode(65 + j)}. ${r || "…"}` }))}
                value={q.answer[k] === null || q.answer[k] === undefined ? null : String(q.answer[k])}
                onChange={(v) => set({ answer: q.answer.map((x, j) => (j === k ? (v === null ? null : Number(v)) : x)) })}
              />
            </Group>
          ))}
          <Text size="xs" fw={700} mt="sm" mb={6}>
            {t("question.right")}
          </Text>
          {q.right.map((r, j) => (
            <Group key={j} mb={6} wrap="nowrap">
              <Text w={20} fw={700}>
                {String.fromCharCode(65 + j)}
              </Text>
              <TextInput style={{ flex: 1 }} value={r} onChange={(e) => set({ right: q.right.map((x, i) => (i === j ? e.currentTarget.value : x)) })} />
            </Group>
          ))}
          <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} onClick={() => set({ left: [...q.left, ""], right: [...q.right, ""], answer: [...q.answer, null] })}>
            {t("question.addPair")}
          </Button>
        </>
      ) : (
        <>
          {q.options.map((opt, k) => {
            const right = (q.correct || []).includes(k);
            return (
              <div key={k} className={`${styles.option} ${right ? styles.optionRight : ""}`}>
                {q.type === "multi" ? <Checkbox color="teal" checked={right} onChange={() => toggle(k)} /> : <Radio color="teal" checked={right} onChange={() => toggle(k)} />}
                <TextInput
                  style={{ flex: 1 }}
                  value={opt}
                  readOnly={q.type === "truefalse"}
                  dir="auto"
                  onChange={(e) => set({ options: q.options.map((x, j) => (j === k ? e.currentTarget.value : x)) })}
                />
                {q.type !== "truefalse" && q.options.length > 2 && (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => set({ options: q.options.filter((_, j) => j !== k), correct: (q.correct || []).filter((x) => x !== k).map((x) => (x > k ? x - 1 : x)) })}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                )}
              </div>
            );
          })}
          {q.type !== "truefalse" && q.options.length < 6 && (
            <Button mt={6} size="xs" variant="subtle" leftSection={<IconPlus size={14} />} onClick={() => set({ options: [...q.options, ""] })}>
              {t("question.addOption")}
            </Button>
          )}
        </>
      )}
      <Textarea
        mt="sm"
        size="xs"
        autosize
        minRows={1}
        label={t("question.explanation")}
        description={t("question.explanationHint")}
        value={q.explanation || ""}
        onChange={(e) => set({ explanation: e.currentTarget.value })}
      />
    </div>
  );
}
