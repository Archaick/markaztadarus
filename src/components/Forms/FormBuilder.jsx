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
  IconCopy,
  IconDeviceFloppy,
  IconLanguage,
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
import { FIELD_TYPES, FORMS_COLLECTION, HAS_OPTIONS, newField, newId } from "./formSchema";

const editableOf = (form) => ({
  title: form.title || "",
  description: form.description || "",
  language: form.language || "id",
  fields: form.fields || [],
});

// Returns { key, n } for builder.problems.<key>, or null when the form is fine.
const problemIn = (draft) => {
  if (!draft.title.trim()) return { key: "noTitle" };
  if (draft.fields.length === 0) return { key: "noQuestions" };
  for (const [i, f] of draft.fields.entries()) {
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

  const save = async () => {
    setMessage(null);
    const problem = problemIn(draft);
    if (problem) {
      setMessage({ color: "red", text: t(`builder.problems.${problem.key}`, { n: problem.n }) });
      return;
    }
    const clean = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      language: draft.language,
      fields: draft.fields.map((f) => {
        const out = { id: f.id, type: f.type, label: f.label.trim(), required: !!f.required };
        if (f.placeholder?.trim()) out.placeholder = f.placeholder.trim();
        if (HAS_OPTIONS.has(f.type)) out.options = f.options.map((o) => o.trim());
        return out;
      }),
    };
    setSaving(true);
    try {
      const changed = ["title", "description", "language", "fields"].filter(
        (k) => JSON.stringify(form[k] ?? "") !== JSON.stringify(clean[k] ?? "")
      );
      await auditedWrite(
        user,
        { area: "forms", action: "form.update", target: form.id, label: clean.title, details: { changed, questions: clean.fields.length } },
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

      {draft.fields.map((f, index) => (
        <div className={styles.questionCard} key={f.id}>
          <div className={styles.questionTop}>
            <span className={styles.questionNumber}>{index + 1}</span>
            <Textarea
              className={styles.questionLabel}
              autosize
              minRows={1}
              dir={contentDir}
              value={f.label}
              onChange={(e) => setField(index, { label: e.target.value })}
              placeholder={t("builder.question")}
              aria-label={t("builder.questionN", { n: index + 1 })}
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
                    onChange={(e) =>
                      setField(index, {
                        options: f.options.map((o, i) => (i === oi ? e.target.value : o)),
                      })
                    }
                    aria-label={t("builder.optionN", { n: oi + 1 })}
                  />
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
            <Switch
              size="sm"
              color="teal"
              label={t("builder.required")}
              checked={!!f.required}
              onChange={(e) => setField(index, { required: e.currentTarget.checked })}
            />
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
      ))}

      <button type="button" className={styles.addQuestion} onClick={addField}>
        <IconPlus size={18} /> {t("builder.addQuestion")}
      </button>

      <Text size="xs" c="dimmed" ta="center" mt="xs">
        {t("builder.deletedNote")}
      </Text>

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
