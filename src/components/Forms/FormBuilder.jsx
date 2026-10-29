import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Select,
  Switch,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconCopy,
  IconDeviceFloppy,
  IconLanguage,
  IconLayoutList,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { doc, serverTimestamp } from "firebase/firestore";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { db } from "../../../firebaseConfig";
import { LANGUAGES } from "../Internal/language";
import { stableKey } from "../Internal/stableKey";
import styles from "./Forms.module.css";
import ReorderSections from "./ReorderSections";
import { FIELD_TYPES, FIRST_SECTION, FORMS_COLLECTION, HAS_OPTIONS, SECTION, isSection, newField, newId, newSection, sectionsOf } from "./formSchema";

const editableOf = (form) => ({
  title: form.title || "",
  description: form.description || "",
  language: form.language || "id",
  fields: form.fields || [],
  firstNext: form.firstNext || "next",
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
  }
  return null;
};

export default function FormBuilder({ form, editorEmail }) {
  const { user } = useAccess();
  const { t } = useTranslation("internal/Forms");
  const [draft, setDraft] = useState(() => editableOf(form));
  const [baseline, setBaseline] = useState(() => stableKey(editableOf(form)));
  const baselineRef = useRef(baseline);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [reordering, setReordering] = useState(false);
  const dirty = stableKey(draft) !== baseline;

  // Starter option names are content, so they follow the form's language.
  const optionLabel = (n) => t("builder.optionN", { n, lng: draft.language });

  // Take in changes saved elsewhere, unless there are local edits to keep.
  useEffect(() => {
    const incoming = stableKey(editableOf(form));
    const previous = baselineRef.current;
    if (incoming === previous) return;
    baselineRef.current = incoming;
    setBaseline(incoming);
    setDraft((current) => (stableKey(current) === previous ? editableOf(form) : current));
  }, [form]);

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

  const addField = () => setDraft((d) => ({ ...d, fields: [...d.fields, newField("short", optionLabel)] }));

  const addSection = () => setDraft((d) => ({ ...d, fields: [...d.fields, newSection(), newField("short", optionLabel)] }));

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
        if (f.placeholder?.trim()) out.placeholder = f.placeholder.trim();
        if (HAS_OPTIONS.has(f.type)) out.options = f.options.map((o) => o.trim());
        // leading on by the answer (one-choice or checkboxes) in a form with sections
        if (HAS_OPTIONS.has(f.type) && f.goTo && hasSections) {
          out.goTo = Object.fromEntries(
            f.options.map((o) => [o.trim(), targets.has(f.goTo[o]) ? f.goTo[o] : "next"])
          );
        }
        return out;
      }),
    };
    setSaving(true);
    try {
      const changed = ["title", "description", "language", "fields", "firstNext"].filter(
        (k) => JSON.stringify(form[k] ?? "") !== JSON.stringify(clean[k] ?? "")
      );
      await auditedWrite(
        user,
        { area: "forms", action: "form.update", target: form.id, label: clean.title, details: { changed, questions: clean.fields.filter((f) => !isSection(f)).length } },
        (batch, auditId) =>
          batch.update(doc(db, FORMS_COLLECTION, form.id), {
            ...clean,
            auditId,
            updatedBy: editorEmail,
            updatedAt: serverTimestamp(),
          })
      );
      setDraft(clean);
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
        <Textarea
          variant="unstyled"
          autosize
          minRows={1}
          dir={contentDir}
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
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
              <Textarea
                variant="unstyled"
                autosize
                minRows={1}
                dir={contentDir}
                value={f.description}
                onChange={(e) => setField(index, { description: e.target.value })}
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
            <span className={styles.questionNumber}>{number}</span>
            <Textarea
              className={styles.questionLabel}
              autosize
              minRows={1}
              dir={contentDir}
              value={f.label}
              onChange={(e) => setField(index, { label: e.target.value })}
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
                  <span className={f.type === "choice" ? styles.radioDot : styles.checkDot} />
                  <TextInput
                    className={styles.optionInput}
                    dir={contentDir}
                    value={option}
                    onChange={(e) => {
                      const text = e.target.value;
                      const patch = { options: f.options.map((o, i) => (i === oi ? text : o)) };
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
            <Button variant="default" onClick={() => setDraft(editableOf(form))}>
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
