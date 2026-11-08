import { ActionIcon, Badge, Button, Checkbox, Group, Radio, Select, Text, TextInput, Textarea } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { NS, QUESTION_TYPES, blankQuestion, questionIssues } from "./belajarSchema";
import styles from "./Belajar.module.css";

/** One question with its answer: the correct options are ticked (green). */
// Enter in an option goes to the next one, so a question is typed without the mouse
const nextOnEnter = (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const all = [...(e.currentTarget.closest("[data-qeditor]")?.querySelectorAll("input[data-opt]:not([readonly])") || [])];
  all[all.indexOf(e.currentTarget) + 1]?.focus();
};

export default function QuestionEditor({ n, q, onChange, onMove, onRemove, autoFocus, bare }) {
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
    <div data-qeditor className={bare ? undefined : `${styles.question} ${issues.length ? styles.questionBad : ""}`}>
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Group gap="xs">
          {n && (
            <Badge variant="filled" color="#003366">
              {n}
            </Badge>
          )}
          <Select size="xs" w={170} allowDeselect={false} data={QUESTION_TYPES.map((v) => ({ value: v, label: t(`qtype.${v}`) }))} value={q.type} onChange={changeType} />
          {!bare && issues.map((x) => (
            <Badge key={x} color="orange" variant="light">
              {t(`issue.${x}`)}
            </Badge>
          ))}
        </Group>
        {onMove && <Group gap={2} wrap="nowrap">
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
      <Textarea autosize minRows={bare ? 2 : 1} data-autofocus={autoFocus || undefined} size={bare ? "md" : "sm"} placeholder={t("question.stem")} value={q.stem} onChange={(e) => set({ stem: e.currentTarget.value })} mb="sm" />

      {q.type === "match" ? (
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
