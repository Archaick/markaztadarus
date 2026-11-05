import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Select,
  NumberInput,
  Switch,
  TagsInput,
  Text,
  TextInput,
  Tooltip,
  MultiSelect,
  Textarea,
} from "@mantine/core";
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconCheck,
  IconCopy,
  IconDeviceFloppy,
  IconLanguage,
  IconLayoutList,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { deleteField, doc, serverTimestamp } from "firebase/firestore";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { db } from "../../../firebaseConfig";
import { LANGUAGES } from "../Internal/language";
import { stableKey } from "../Internal/stableKey";
import styles from "./Forms.module.css";
import ReorderSections from "./ReorderSections";
import { RichTextarea } from "./richText";
import { plainText } from "./richText";
import { FILE, FILE_KINDS, MAX_FILES_CHOICES, MAX_MB_CHOICES, fileSettings, sizeText } from "./fileUpload";
import { AUTO_GRADED, MAX_TRACE_WORDS, TRACE, FIELD_TYPES, FIRST_SECTION, FORMS_COLLECTION, HAS_OPTIONS, KEY_DOC, PRIVATE, SECTION, isSection, newField, newId, newSection, questionsOf, quizOf, sectionsOf } from "./formSchema";

const editableOf = (form, key) => ({
  title: form.title || "",
  description: form.description || "",
  language: form.language || "id",
  fields: form.fields || [],
  firstNext: form.firstNext || "next",
  key: key || {}, // the quiz answer key: question id → accepted answers
});

// Where a section card's block of questions ends (the next section card, or the end).
const blockEnd = (fields, start) => {
  const next = fields.findIndex((f, i) => i > start && isSection(f));
  return next === -1 ? fields.length : next;
};

// Returns { key, n } for builder.problems.<key>, or null when the form is fine.
const problemIn = (draft) => {
  if (!draft.title.trim()) return { key: "noTitle" };
  const questions = draft.fields.filter((f) => !isSection(f));
  if (questions.length === 0) return { key: "noQuestions" };
  for (const [i, f] of questions.entries()) {
    const n = i + 1;
    if (!f.label.trim()) return { key: "noLabel", n };
    if (HAS_OPTIONS.has(f.type)) {
      const options = (f.options || []).map((o) => o.trim());
      if (options.length === 0 || options.some((o) => !o)) return { key: "emptyOption", n };
      if (new Set(options).size !== options.length) return { key: "duplicateOption", n };
    }
    if (f.type === FILE && !fileSettings(f).kinds.length) return { key: "noFileKinds", n };
    if (f.type === TRACE) {
      const words = cleanWords(f);
      if (!words.length) return { key: "noTraceWords", n };
      if (words.length > MAX_TRACE_WORDS) return { key: "tooManyTraceWords", n };
      if (new Set(words).size !== words.length) return { key: "duplicateTraceWord", n };
    }
  }
  return null;
};

const cleanWords = (f) => (f.words || []).map((w) => w.trim()).filter(Boolean);

export default function FormBuilder({ form, editorEmail, quizKey }) {
  const { user } = useAccess();
  const { t } = useTranslation("internal/Forms");
  const [draft, setDraft] = useState(() => editableOf(form, quizKey));
  const [baseline, setBaseline] = useState(() => stableKey(editableOf(form, quizKey)));
  const baselineRef = useRef(baseline);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [reordering, setReordering] = useState(false);
  const dirty = stableKey(draft) !== baseline;

  // Starter option names are content, so they follow the form's language.
  const optionLabel = (n) => t("builder.optionN", { n, lng: draft.language });

  // a quiz: points on every question and an answer key
  const quiz = quizOf(form);
  const withPoints = (f) => (quiz.enabled ? { ...f, points: quiz.defaultPoints } : f);
  const setKey = (id, answers) => setDraft((d) => ({ ...d, key: { ...d.key, [id]: answers } }));
  const toggleCorrect = (f, option) => {
    const current = draft.key[f.id] || [];
    if (f.type === "choice") setKey(f.id, current[0] === option ? [] : [option]);
    else setKey(f.id, current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
  };

  // Take in changes saved elsewhere, unless there are local edits to keep.
  useEffect(() => {
    const incoming = stableKey(editableOf(form, quizKey));
    const previous = baselineRef.current;
    if (incoming === previous) return;
    baselineRef.current = incoming;
    setBaseline(incoming);
    setDraft((current) => (stableKey(current) === previous ? editableOf(form, quizKey) : current));
  }, [form, quizKey]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setField = (index, patch) =>
    setDraft((d) => ({ ...d, fields: d.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)) }));

  const changeType = (index, type) =>
    setDraft((d) => ({
      ...d,
      fields: d.fields.map((f, i) => {
        if (i !== index) return f;
        const { options, ...rest } = f;
        return HAS_OPTIONS.has(type)
          ? { ...rest, type, options: options?.length ? options : [optionLabel(1), optionLabel(2)] }
          : { ...rest, type };
      }),
    }));

  const move = (index, delta) =>
    setDraft((d) => {
      const fields = [...d.fields];
      const target = index + delta;
      if (target < 0 || target >= fields.length) return d;
      [fields[index], fields[target]] = [fields[target], fields[index]];
      return { ...d, fields };
    });

  const duplicate = (index) =>
    setDraft((d) => {
      const fields = [...d.fields];
      fields.splice(index + 1, 0, { ...d.fields[index], id: newId() });
      return { ...d, fields };
    });

  const remove = (index) => setDraft((d) => ({ ...d, fields: d.fields.filter((_, i) => i !== index) }));

  const addField = () => setDraft((d) => ({ ...d, fields: [...d.fields, withPoints(newField("short", optionLabel))] }));

  const addSection = () => setDraft((d) => ({ ...d, fields: [...d.fields, newSection(), withPoints(newField("short", optionLabel))] }));

  // a whole section (its card and its questions) swaps with the one above or below
  const moveSection = (start, delta) =>
    setDraft((d) => {
      const fields = d.fields;
      const end = blockEnd(fields, start);
      if (delta < 0) {
        const prev = fields.slice(0, start).map((f, i) => (isSection(f) ? i : -1)).filter((i) => i >= 0).pop();
        if (prev === undefined) return d;
        return { ...d, fields: [...fields.slice(0, prev), ...fields.slice(start, end), ...fields.slice(prev, start), ...fields.slice(end)] };
      }
      if (end >= fields.length) return d;
      const end2 = blockEnd(fields, end);
      return { ...d, fields: [...fields.slice(0, start), ...fields.slice(end, end2), ...fields.slice(start, end), ...fields.slice(end2)] };
    });

  // deleting a section card keeps its questions (they join the section above);
  // whatever led to it continues to the next section instead
  const deleteSection = (index) =>
    setDraft((d) => {
      const gone = d.fields[index].id;
      const fix = (target) => (target === gone ? "next" : target);
      return {
        ...d,
        firstNext: fix(d.firstNext),
        fields: d.fields
          .filter((_, i) => i !== index)
          .map((f) => {
            if (isSection(f)) return { ...f, next: fix(f.next) };
            if (!f.goTo) return f;
            return { ...f, goTo: Object.fromEntries(Object.entries(f.goTo).map(([o, target]) => [o, fix(target)])) };
          }),
      };
    });

  // where the section `sectionId` leads ("first" is section 1, kept on the form)
  const setSectionNext = (sectionId, next) =>
    setDraft((d) =>
      sectionId === FIRST_SECTION ? { ...d, firstNext: next } : { ...d, fields: d.fields.map((f) => (f.id === sectionId ? { ...f, next } : f)) }
    );

  const save = async () => {
    setMessage(null);
    const problem = problemIn(draft);
    if (problem) {
      setMessage({ color: "red", text: t(`builder.problems.${problem.key}`, { n: problem.n }) });
      return;
    }
    const targets = new Set(["next", "submit", ...draft.fields.filter(isSection).map((f) => f.id)]);
    const clean = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      language: draft.language,
      firstNext: targets.has(draft.firstNext) ? draft.firstNext : "next",
      fields: draft.fields.map((f) => {
        if (isSection(f)) {
          return { id: f.id, type: SECTION, title: (f.title || "").trim(), description: (f.description || "").trim(), next: targets.has(f.next) ? f.next : "next" };
        }
        const out = { id: f.id, type: f.type, label: f.label.trim(), required: !!f.required };
        // questions that were there before the quiz start at 0 points (a name is not graded);
        // new ones get the default
        if (quiz.enabled) out.points = Math.max(0, Math.min(1000, Number(f.points ?? 0) || 0));
        if (f.placeholder?.trim()) out.placeholder = f.placeholder.trim();
        if (HAS_OPTIONS.has(f.type)) out.options = f.options.map((o) => o.trim());
        if (f.type === TRACE) out.words = cleanWords(f);
        if (f.type === FILE) {
          const { kinds, maxFiles, maxMB, nameFrom } = fileSettings(f);
          Object.assign(out, { kinds, maxFiles, maxMB, nameFrom: questionsOf(draft.fields).some((q) => q.id === nameFrom) ? nameFrom : "" });
        }
        // leading on by the answer (one-choice or checkboxes) in a form with sections
        if (HAS_OPTIONS.has(f.type) && f.goTo && hasSections) {
          out.goTo = Object.fromEntries(
            f.options.map((o) => [o.trim(), targets.has(f.goTo[o]) ? f.goTo[o] : "next"])
          );
        }
        return out;
      }),
    };
    // the answer key, only for questions that still exist and options that still exist
    const key = {};
    clean.fields.forEach((f) => {
      const answers = (draft.key[f.id] || []).map((a) => String(a).trim()).filter(Boolean);
      if (!answers.length || isSection(f)) return;
      if (f.type === "choice") {
        if (f.options.includes(answers[0])) key[f.id] = [answers[0]];
      } else if (f.type === "checkbox") {
        const ok = answers.filter((a) => f.options.includes(a));
        if (ok.length) key[f.id] = ok;
      } else if (AUTO_GRADED.has(f.type)) {
        key[f.id] = answers.slice(0, 20).map((a) => a.slice(0, 300));
      }
    });
    const keyChanged = JSON.stringify(key) !== JSON.stringify(quizKey || {});
    setSaving(true);
    try {
      const changed = ["title", "description", "language", "fields", "firstNext"].filter(
        (k) => JSON.stringify(form[k] ?? "") !== JSON.stringify(clean[k] ?? "")
      );
      await auditedWrite(
        user,
        { area: "forms", action: "form.update", target: form.id, label: clean.title, details: { changed: keyChanged ? [...changed, "answerKey"] : changed, questions: clean.fields.filter((f) => !isSection(f)).length } },
        (batch, auditId) =>
        {
          batch.update(doc(db, FORMS_COLLECTION, form.id), {
            ...clean,
            // the browser grades only when results show right after sending
            quizKey: quiz.enabled && quiz.release === "immediate" ? key : deleteField(),
            auditId,
            updatedBy: editorEmail,
            updatedAt: serverTimestamp(),
          });
          if (keyChanged || quiz.enabled) batch.set(doc(db, FORMS_COLLECTION, form.id, PRIVATE, KEY_DOC), { key, auditId, updatedAt: serverTimestamp() });
        }
      );
      setDraft({ ...clean, key });
      setMessage({ color: "teal", text: t("builder.saved") });
    } catch (err) {
      console.error("Could not save form:", err);
      setMessage({ color: "red", text: t("builder.saveFailed") });
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = FIELD_TYPES.map((value) => ({ value, label: t(`types.${value}`) }));

  // sections: their numbers, which section each item belongs to, and where each can lead
  const hasSections = draft.fields.some(isSection);
  const sections = sectionsOf(draft.fields, draft.firstNext);
  const sectionNumber = new Map(sections.map((sec, i) => [sec.id, i + 1]));
  const sectionAt = []; // index → id of the section the item belongs to
  let current = FIRST_SECTION;
  draft.fields.forEach((f, i) => {
    if (isSection(f)) current = f.id;
    sectionAt[i] = current;
  });
  const targetOptions = (fromId) => [
    { value: "next", label: t("builder.toNext") },
    ...sections
      .filter((sec) => sec.id !== fromId)
      .map((sec) => ({
        value: sec.id,
        label: sec.title || (sec.id === FIRST_SECTION && draft.title)
          ? t("builder.toSectionTitled", { n: sectionNumber.get(sec.id), title: sec.title || draft.title })
          : t("builder.toSection", { n: sectionNumber.get(sec.id) }),
      })),
    { value: "submit", label: t("builder.toSubmit") },
  ];
  const nextOf = (sectionId) =>
    sectionId === FIRST_SECTION ? draft.firstNext : draft.fields.find((f) => f.id === sectionId)?.next || "next";
  // "After section n: ..." under the last question of a section
  const afterRow = (sectionId) =>
    sectionNumber.has(sectionId) && (
      <div className={styles.afterSection} key={`after-${sectionId}`}>
        <Text size="sm" fw={600}>
          {t("builder.afterSection", { n: sectionNumber.get(sectionId) })}
        </Text>
        <Select
          size="sm"
          data={targetOptions(sectionId)}
          value={nextOf(sectionId)}
          onChange={(v) => v && setSectionNext(sectionId, v)}
          allowDeselect={false}
          className={styles.afterSelect}
          comboboxProps={{ withinPortal: true }}
          aria-label={t("builder.afterSection", { n: sectionNumber.get(sectionId) })}
        />
      </div>
    );
  let questionNo = 0;
  // Questions are typed in the form's language, so they flow in its direction.
  const contentDir = draft.language === "ar" ? "rtl" : "ltr";

  return (
    <div className={styles.builder}>
      <div className={styles.titleCard}>
        <TextInput
          variant="unstyled"
          className={styles.titleInput}
          dir={contentDir}
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder={t("builder.formTitle")}
          aria-label={t("builder.formTitle")}
        />
        <RichTextarea
          variant="unstyled"
          autosize
          minRows={1}
          dir={contentDir}
          value={draft.description}
          onValue={(description) => setDraft((d) => ({ ...d, description }))}
          placeholder={t("builder.description")}
          aria-label={t("builder.description")}
        />
        <div className={styles.languageRow}>
          <Select
            size="xs"
            leftSection={<IconLanguage size={14} />}
            label={t("builder.formLanguage")}
            data={LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
            value={draft.language}
            onChange={(value) => value && setDraft((d) => ({ ...d, language: value }))}
            allowDeselect={false}
            className={styles.languageSelect}
            comboboxProps={{ withinPortal: true }}
          />
          <Text size="xs" c="dimmed" className={styles.languageHint}>
            {t("builder.formLanguageHint")}
          </Text>
        </div>
      </div>

      {draft.fields.map((f, index) => {
        // closing the section above, when a new one starts here
        const closing = hasSections && isSection(f) && index > 0 ? afterRow(sectionAt[index - 1]) : null;

        if (isSection(f)) {
          const end = blockEnd(draft.fields, index);
          const firstCard = draft.fields.findIndex(isSection) === index;
          return [
            closing,
            <div className={styles.sectionCard} key={f.id}>
              <span className={styles.sectionBadge}>
                <IconLayoutList size={14} /> {t("builder.sectionOf", { n: sectionNumber.get(f.id), total: sections.length })}
              </span>
              <TextInput
                variant="unstyled"
                className={styles.sectionTitle}
                dir={contentDir}
                value={f.title}
                onChange={(e) => setField(index, { title: e.target.value })}
                placeholder={t("builder.sectionTitle")}
                aria-label={t("builder.sectionTitle")}
              />
              <RichTextarea
                variant="unstyled"
                autosize
                minRows={1}
                dir={contentDir}
                value={f.description}
                onValue={(description) => setField(index, { description })}
                placeholder={t("builder.sectionDescription")}
                aria-label={t("builder.sectionDescription")}
              />
              <div className={styles.sectionTools}>
                <Button size="compact-sm" variant="subtle" color="violet" leftSection={<IconArrowsSort size={15} />} onClick={() => setReordering(true)} me="auto">
                  {t("builder.reorder")}
                </Button>
                <Tooltip label={t("builder.moveSectionUp")}>
                  <ActionIcon variant="subtle" color="gray" disabled={firstCard} onClick={() => moveSection(index, -1)} aria-label={t("builder.moveSectionUp")}>
                    <IconArrowUp size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t("builder.moveSectionDown")}>
                  <ActionIcon variant="subtle" color="gray" disabled={end >= draft.fields.length} onClick={() => moveSection(index, 1)} aria-label={t("builder.moveSectionDown")}>
                    <IconArrowDown size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t("builder.deleteSection")}>
                  <ActionIcon variant="subtle" color="red" onClick={() => deleteSection(index)} aria-label={t("builder.deleteSection")}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </div>
            </div>,
          ];
        }

        questionNo += 1;
        const number = questionNo;
        return (
        <div className={styles.questionCard} key={f.id}>
          <div className={styles.questionTop}>
            <RichTextarea
              wrapperClassName={styles.questionLabel}
              autosize
              minRows={1}
              dir={contentDir}
              value={f.label}
              onValue={(label) => setField(index, { label })}
              placeholder={t("builder.question")}
              aria-label={t("builder.questionN", { n: number })}
            />
            <Select
              className={styles.typeSelect}
              data={typeOptions}
              value={f.type}
              onChange={(type) => type && changeType(index, type)}
              allowDeselect={false}
              aria-label={t("builder.answerType")}
              comboboxProps={{ withinPortal: true }}
            />
          </div>

          {HAS_OPTIONS.has(f.type) ? (
            <div className={styles.options}>
              {(f.options || []).map((option, oi) => (
                <div className={styles.optionRow} key={oi}>
                  {quiz.enabled ? (
                    <button
                      type="button"
                      className={`${f.type === "choice" ? styles.radioDot : styles.checkDot} ${styles.keyDot} ${(draft.key[f.id] || []).includes(option) ? styles.keyOn : ""}`}
                      onClick={() => toggleCorrect(f, option)}
                      aria-pressed={(draft.key[f.id] || []).includes(option)}
                      title={t("quiz.markCorrect")}
                    >
                      {(draft.key[f.id] || []).includes(option) && <IconCheck size={11} stroke={3} />}
                    </button>
                  ) : (
                    <span className={f.type === "choice" ? styles.radioDot : styles.checkDot} />
                  )}
                  <TextInput
                    className={styles.optionInput}
                    dir={contentDir}
                    value={option}
                    onChange={(e) => {
                      const text = e.target.value;
                      const patch = { options: f.options.map((o, i) => (i === oi ? text : o)) };
                      // a correct option stays correct when renamed
                      if ((draft.key[f.id] || []).includes(option)) setKey(f.id, draft.key[f.id].map((o) => (o === option ? text : o)));
                      // the option keeps where it leads when renamed
                      if (f.goTo) {
                        const { [option]: target, ...rest } = f.goTo;
                        patch.goTo = { ...rest, [text]: target || "next" };
                      }
                      setField(index, patch);
                    }}
                    aria-label={t("builder.optionN", { n: oi + 1 })}
                  />
                  {f.goTo && hasSections && (
                    <Select
                      size="xs"
                      className={styles.goToSelect}
                      // a ticked box opens a section; only a one-choice answer can end the form
                      data={
                        f.type === "checkbox"
                          ? targetOptions(sectionAt[index])
                              .filter((o) => o.value !== "submit")
                              .map((o) => (o.value === "next" ? { ...o, label: t("builder.noExtraSection") } : o))
                          : targetOptions(sectionAt[index])
                      }
                      value={f.goTo[option] || "next"}
                      onChange={(v) => v && setField(index, { goTo: { ...f.goTo, [option]: v } })}
                      allowDeselect={false}
                      comboboxProps={{ withinPortal: true }}
                      aria-label={t("builder.branchFor", { option })}
                    />
                  )}
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    disabled={f.options.length <= 1}
                    onClick={() => setField(index, { options: f.options.filter((_, i) => i !== oi) })}
                    aria-label={t("builder.removeOption")}
                  >
                    <IconX size={15} />
                  </ActionIcon>
                </div>
              ))}
              <Button
                variant="subtle"
                size="compact-sm"
                color="teal"
                leftSection={<IconPlus size={14} />}
                onClick={() =>
                  setField(index, { options: [...(f.options || []), optionLabel((f.options || []).length + 1)] })
                }
              >
                {t("builder.addOption")}
              </Button>
            </div>
          ) : f.type === TRACE ? (
            <Textarea
              mt="xs"
              size="sm"
              label={t("builder.traceWords")}
              description={t("builder.traceWordsHint", { max: MAX_TRACE_WORDS })}
              value={(f.words || []).join("\n")}
              onChange={(e) => setField(index, { words: e.target.value.split("\n") })}
              autosize
              minRows={3}
              maxRows={12}
              dir="rtl"
              className={styles.traceWords}
            />
          ) : f.type === FILE ? (
            <div className={styles.fileSettings}>
              <MultiSelect
                size="xs"
                label={t("builder.fileAllowed")}
                data={FILE_KINDS.map((value) => ({ value, label: t(`builder.fileKinds.${value}`) }))}
                value={fileSettings(f).kinds}
                onChange={(kinds) => setField(index, { kinds })}
                comboboxProps={{ withinPortal: true }}
              />
              <Select
                size="xs"
                label={t("builder.fileCount")}
                data={MAX_FILES_CHOICES.map(String)}
                value={String(fileSettings(f).maxFiles)}
                onChange={(v) => v && setField(index, { maxFiles: Number(v) })}
                allowDeselect={false}
                comboboxProps={{ withinPortal: true }}
              />
              <Select
                size="xs"
                label={t("builder.fileSize")}
                data={MAX_MB_CHOICES.map((mb) => ({ value: String(mb), label: sizeText(mb) }))}
                value={String(fileSettings(f).maxMB)}
                onChange={(v) => v && setField(index, { maxMB: Number(v) })}
                allowDeselect={false}
                comboboxProps={{ withinPortal: true }}
              />
              <Select
                size="xs"
                label={t("builder.fileNameFrom")}
                placeholder={t("builder.fileNameNone")}
                data={questionsOf(draft.fields)
                  .filter((q) => q.id !== f.id && ["short", "phone", "number"].includes(q.type) && q.label.trim())
                  .map((q) => ({ value: q.id, label: plainText(q.label).slice(0, 60) }))}
                value={fileSettings(f).nameFrom || null}
                onChange={(v) => setField(index, { nameFrom: v || "" })}
                clearable
                comboboxProps={{ withinPortal: true }}
              />
              <Text size="xs" c="dimmed" className={styles.fileNote}>
                {t("builder.fileNote")}
              </Text>
            </div>
          ) : (
            f.type !== "date" && (
              <TextInput
                mt="xs"
                size="xs"
                className={styles.hintInput}
                dir={contentDir}
                value={f.placeholder || ""}
                onChange={(e) => setField(index, { placeholder: e.target.value })}
                placeholder={t("builder.placeholder")}
                aria-label={t("builder.placeholder")}
              />
            )
          )}

          {quiz.enabled && (
            <div className={styles.quizRow}>
              {f.type === "short" || f.type === "number" ? (
                <TagsInput
                  className={styles.quizAnswers}
                  size="xs"
                  label={t("quiz.accepted")}
                  placeholder={t("quiz.acceptedHint")}
                  value={draft.key[f.id] || []}
                  onChange={(answers) => setKey(f.id, answers)}
                  dir={contentDir}
                />
              ) : HAS_OPTIONS.has(f.type) ? (
                <Text size="xs" c={(draft.key[f.id] || []).length ? "teal.8" : "orange.8"} fw={600}>
                  {(draft.key[f.id] || []).length ? t("quiz.keySet", { count: draft.key[f.id].length }) : t("quiz.tapCorrect")}
                </Text>
              ) : (
                <Text size="xs" c="dimmed">
                  {t("quiz.byHand")}
                </Text>
              )}
              <NumberInput
                size="xs"
                w={110}
                min={0}
                max={1000}
                label={t("quiz.points")}
                value={f.points ?? 0}
                onChange={(v) => setField(index, { points: Number(v) || 0 })}
              />
            </div>
          )}

          <div className={styles.questionFooter}>
            <Group gap="md">
              <Switch
                size="sm"
                color="teal"
                label={t("builder.required")}
                checked={!!f.required}
                onChange={(e) => setField(index, { required: e.currentTarget.checked })}
              />
              {HAS_OPTIONS.has(f.type) && hasSections && (
                <Switch
                  size="sm"
                  color="violet"
                  label={t(f.type === "checkbox" ? "builder.branchMany" : "builder.branch")}
                  checked={!!f.goTo}
                  onChange={(e) => setField(index, { goTo: e.currentTarget.checked ? Object.fromEntries((f.options || []).map((o) => [o, "next"])) : undefined })}
                />
              )}
            </Group>
            <Group gap={2}>
              <Tooltip label={t("builder.moveUp")}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={t("builder.moveUp")}
                >
                  <IconArrowUp size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("builder.moveDown")}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  disabled={index === draft.fields.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={t("builder.moveDown")}
                >
                  <IconArrowDown size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("builder.duplicate")}>
                <ActionIcon variant="subtle" color="gray" onClick={() => duplicate(index)} aria-label={t("builder.duplicate")}>
                  <IconCopy size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("builder.deleteQuestion")}>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => remove(index)}
                  aria-label={t("builder.deleteQuestion")}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </div>
        </div>
        );
      })}
      {hasSections && afterRow(sectionAt[draft.fields.length - 1] || FIRST_SECTION)}

      <div className={styles.addRow}>
        <button type="button" className={styles.addQuestion} onClick={addField}>
          <IconPlus size={18} /> {t("builder.addQuestion")}
        </button>
        <button type="button" className={`${styles.addQuestion} ${styles.addSection}`} onClick={addSection}>
          <IconLayoutList size={18} /> {t("builder.addSection")}
        </button>
      </div>

      <Text size="xs" c="dimmed" ta="center" mt="xs">
        {t("builder.deletedNote")}
      </Text>

      <ReorderSections
        opened={reordering}
        onClose={() => setReordering(false)}
        fields={draft.fields}
        formTitle={draft.title}
        onApply={(fields) => setDraft((d) => ({ ...d, fields }))}
      />

      <div className={`${styles.saveBar} ${dirty ? styles.saveBarDirty : ""}`}>
        {message ? (
          <Alert color={message.color} p={6} className={styles.saveMessage} withCloseButton onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        ) : (
          <Text size="sm" c={dirty ? "orange.8" : "dimmed"} fw={dirty ? 600 : 400}>
            {dirty ? t("builder.unsaved") : t("builder.allSaved")}
          </Text>
        )}
        <Group gap="xs">
          {dirty && (
            <Button variant="default" onClick={() => setDraft(editableOf(form, quizKey))}>
              {t("builder.discard")}
            </Button>
          )}
          <Button
            className={styles.primaryButton}
            leftSection={<IconDeviceFloppy size={17} />}
            loading={saving}
            disabled={!dirty}
            onClick={save}
          >
            {t("builder.save")}
          </Button>
        </Group>
      </div>
    </div>
  );
}
