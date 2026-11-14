import { ActionIcon, Badge, Button, Checkbox, Group, Radio, Select, Text, TextInput, Textarea } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconCheck, IconChevronDown, IconChevronUp, IconCircleDot, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { NS, QUESTION_TYPES, STEM_OPTIONAL, blankQuestion, questionIssues } from "./belajarSchema";
import { CircleEditor, FillBlankEditor, OrderEditor } from "./WordEditors";
import { ICON } from "./questionTypeList";
import styles from "./Belajar.module.css";

/** One question with its answer: the correct options are ticked (green). */
// Enter in an option goes to the next one, so a question is typed without the mouse
const nextOnEnter = (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const all = [...(e.currentTarget.closest("[data-qeditor]")?.querySelectorAll("input[data-opt]:not([readonly])") || [])];
  all[all.indexOf(e.currentTarget) + 1]?.focus();
};

// the first words of a question, for its folded one-line view
const firstWords = (q) => {
  const text = q.stem || (q.type === "fillblank" ? q.sentence : q.type === "order" ? (q.words || []).join(" ") : q.type === "circle" ? q.rows?.[0]?.sentence : "") || "";
  const words = text.replace(/\*/g, "").trim().split(/\s+/);
  return words.length > 12 ? `${words.slice(0, 12).join(" ")}…` : words.join(" ");
};
// the issues that mean the answer key is not set yet
const NO_KEY = ["noAnswer", "fewWords", "noBlanks", "noRows"];

export default function QuestionEditor({ n, q, onChange, onMove, onRemove, autoFocus, bare, collapsed, onToggle }) {
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
    const own = (x) => x === "match" || STEM_OPTIONAL.includes(x);
    if (own(type) || own(q.type) || type === "truefalse") return onChange({ ...blankQuestion(type), id: q.id, stem: q.stem, explanation: q.explanation });
    set({ type, correct: type === "single" ? (q.correct || []).slice(0, 1) : q.correct });
  };

  const TypeIcon = ICON[q.type] || IconCircleDot;

  if (collapsed) {
    const keySet = !issues.some((x) => NO_KEY.includes(x));
    return (
      <div data-qeditor data-qid={q.id} className={`${styles.question} ${styles.questionFolded} ${issues.length ? styles.questionBad : ""}`}>
        <button type="button" className={styles.foldRow} onClick={onToggle} aria-expanded="false" title={t("question.expand")}>
          <Badge variant="filled" color="#003366">
            {n}
          </Badge>
          <span className={styles.foldType}>
            <TypeIcon size={14} /> {t(`qtype.${q.type}`)}
          </span>
          <span className={styles.foldText} dir="auto">
            {firstWords(q) || <i>{t("issue.noStem")}</i>}
          </span>
          {keySet ? <IconCheck size={16} className={styles.foldKey} aria-label={t("question.keySet")} /> : <span className={styles.foldNoKey}>{t("issue.noAnswer")}</span>}
          <IconChevronDown size={16} />
        </button>
      </div>
    );
  }

  return (
    <div data-qeditor data-qid={q.id} className={bare ? undefined : `${styles.question} ${issues.length ? styles.questionBad : ""}`}>
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Group gap="xs">
          {n && (
            <Badge variant="filled" color="#003366">
              {n}
            </Badge>
          )}
          <Select size="xs" w={190} allowDeselect={false} data={QUESTION_TYPES.map((v) => ({ value: v, label: t(`qtype.${v}`) }))} value={q.type} onChange={changeType} />
          {!bare && issues.map((x) => (
            <Badge key={x} color="orange" variant="light">
              {t(`issue.${x}`)}
            </Badge>
          ))}
        </Group>
        {onMove && <Group gap={2} wrap="nowrap">
          {onToggle && (
            <ActionIcon variant="subtle" color="gray" onClick={onToggle} aria-expanded="true" aria-label={t("question.collapse")} title={t("question.collapse")}>
              <IconChevronUp size={16} />
            </ActionIcon>
          )}
          <ActionIcon variant="subtle" onClick={() => onMove(-1)}>
            <IconArrowUp size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" onClick={() => onMove(1)}>
            <IconArrowDown size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={onRemove}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>}
      </Group>
      {!STEM_OPTIONAL.includes(q.type) && (
        <Textarea autosize minRows={bare ? 2 : 1} data-autofocus={autoFocus || undefined} size={bare ? "md" : "sm"} placeholder={t("question.stem")} value={q.stem} onChange={(e) => set({ stem: e.currentTarget.value })} mb="sm" />
      )}

      {q.type === "fillblank" ? (
        <FillBlankEditor q={q} set={set} autoFocus={autoFocus} />
      ) : q.type === "order" ? (
        <OrderEditor q={q} set={set} autoFocus={autoFocus} />
      ) : q.type === "circle" ? (
        <CircleEditor q={q} set={set} autoFocus={autoFocus} />
      ) : q.type === "match" ? (
        <>
          <Text size="xs" c="dimmed" mb={6}>
            {t("question.matchHint")}
          </Text>
          {q.left.map((left, k) => (
            <Group key={k} mb={8} wrap="nowrap" align="flex-start">
              <TextInput style={{ flex: 1 }} value={left} data-opt onKeyDown={nextOnEnter} placeholder={t("question.left")} onChange={(e) => set({ left: q.left.map((x, j) => (j === k ? e.currentTarget.value : x)) })} />
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
              <TextInput style={{ flex: 1 }} value={r} data-opt onKeyDown={nextOnEnter} onChange={(e) => set({ right: q.right.map((x, i) => (i === j ? e.currentTarget.value : x)) })} />
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
                  data-opt
                  placeholder={t("question.option", { l: String.fromCharCode(65 + k) })}
                  onKeyDown={nextOnEnter}
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
