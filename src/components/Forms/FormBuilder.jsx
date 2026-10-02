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
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import styles from "./Forms.module.css";
import { FIELD_TYPES, FORMS_COLLECTION, HAS_OPTIONS, newField } from "./formSchema";

const editableOf = (form) => ({
  title: form.title || "",
  description: form.description || "",
  fields: form.fields || [],
});

// JSON with sorted keys: Firestore does not keep map key order.
const stableKey = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]))
      : v
  );

const problemsIn = (draft) => {
  if (!draft.title.trim()) return "The form needs a title.";
  if (draft.fields.length === 0) return "Add at least one question.";
  for (const [i, f] of draft.fields.entries()) {
    if (!f.label.trim()) return `Question ${i + 1} has no text.`;
    if (HAS_OPTIONS.has(f.type)) {
      const options = (f.options || []).map((o) => o.trim());
      if (options.length === 0 || options.some((o) => !o)) return `Question ${i + 1} has an empty option.`;
      if (new Set(options).size !== options.length) return `Question ${i + 1} has the same option twice.`;
    }
  }
  return "";
};

export default function FormBuilder({ form, editorEmail }) {
  const [draft, setDraft] = useState(() => editableOf(form));
  const [baseline, setBaseline] = useState(() => stableKey(editableOf(form)));
  const baselineRef = useRef(baseline);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const dirty = stableKey(draft) !== baseline;

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
          ? { ...rest, type, options: options?.length ? options : ["Option 1", "Option 2"] }
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
      fields.splice(index + 1, 0, { ...d.fields[index], id: newField().id });
      return { ...d, fields };
    });

  const remove = (index) => setDraft((d) => ({ ...d, fields: d.fields.filter((_, i) => i !== index) }));

  const addField = () => setDraft((d) => ({ ...d, fields: [...d.fields, newField("short")] }));

  const save = async () => {
    setMessage(null);
    const problem = problemsIn(draft);
    if (problem) {
      setMessage({ color: "red", text: problem });
      return;
    }
    const clean = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      fields: draft.fields.map((f) => {
        const out = { id: f.id, type: f.type, label: f.label.trim(), required: !!f.required };
        if (f.placeholder?.trim()) out.placeholder = f.placeholder.trim();
        if (HAS_OPTIONS.has(f.type)) out.options = f.options.map((o) => o.trim());
        return out;
      }),
    };
    setSaving(true);
    try {
      await updateDoc(doc(db, FORMS_COLLECTION, form.id), {
        ...clean,
        updatedBy: editorEmail,
        updatedAt: serverTimestamp(),
      });
      setDraft(clean);
      setMessage({ color: "teal", text: "Saved." });
    } catch (err) {
      console.error("Could not save form:", err);
      setMessage({ color: "red", text: "Could not save. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.builder}>
      <div className={styles.titleCard}>
        <TextInput
          variant="unstyled"
          className={styles.titleInput}
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Form title"
          aria-label="Form title"
        />
        <Textarea
          variant="unstyled"
          autosize
          minRows={1}
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="Description shown under the title (optional)"
          aria-label="Form description"
        />
      </div>

      {draft.fields.map((f, index) => (
        <div className={styles.questionCard} key={f.id}>
          <div className={styles.questionTop}>
            <span className={styles.questionNumber}>{index + 1}</span>
            <Textarea
              className={styles.questionLabel}
              autosize
              minRows={1}
              value={f.label}
              onChange={(e) => setField(index, { label: e.target.value })}
              placeholder="Question"
              aria-label={`Question ${index + 1}`}
            />
            <Select
              className={styles.typeSelect}
              data={FIELD_TYPES}
              value={f.type}
              onChange={(type) => type && changeType(index, type)}
              allowDeselect={false}
              aria-label="Answer type"
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
                    value={option}
                    onChange={(e) =>
                      setField(index, {
                        options: f.options.map((o, i) => (i === oi ? e.target.value : o)),
                      })
                    }
                    aria-label={`Option ${oi + 1}`}
                  />
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    disabled={f.options.length <= 1}
                    onClick={() => setField(index, { options: f.options.filter((_, i) => i !== oi) })}
                    aria-label="Remove option"
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
                  setField(index, { options: [...(f.options || []), `Option ${(f.options || []).length + 1}`] })
                }
              >
                Add option
              </Button>
            </div>
          ) : (
            f.type !== "date" && (
              <TextInput
                mt="xs"
                size="xs"
                className={styles.hintInput}
                value={f.placeholder || ""}
                onChange={(e) => setField(index, { placeholder: e.target.value })}
                placeholder="Example answer shown in the empty box (optional)"
                aria-label="Placeholder"
              />
            )
          )}

          <div className={styles.questionFooter}>
            <Switch
              size="sm"
              color="teal"
              label="Required"
              checked={!!f.required}
              onChange={(e) => setField(index, { required: e.currentTarget.checked })}
            />
            <Group gap={2}>
              <Tooltip label="Move up">
                <ActionIcon variant="subtle" color="gray" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move up">
                  <IconArrowUp size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Move down">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  disabled={index === draft.fields.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  <IconArrowDown size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Duplicate">
                <ActionIcon variant="subtle" color="gray" onClick={() => duplicate(index)} aria-label="Duplicate">
                  <IconCopy size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete question">
                <ActionIcon variant="subtle" color="red" onClick={() => remove(index)} aria-label="Delete question">
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </div>
        </div>
      ))}

      <button type="button" className={styles.addQuestion} onClick={addField}>
        <IconPlus size={18} /> Add question
      </button>

      <Text size="xs" c="dimmed" ta="center" mt="xs">
        Answers already collected for a deleted question stay in the CSV export.
      </Text>

      <div className={`${styles.saveBar} ${dirty ? styles.saveBarDirty : ""}`}>
        {message ? (
          <Alert color={message.color} p={6} className={styles.saveMessage} withCloseButton onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        ) : (
          <Text size="sm" c={dirty ? "orange.8" : "dimmed"} fw={dirty ? 600 : 400}>
            {dirty ? "Unsaved changes" : "All changes saved"}
          </Text>
        )}
        <Group gap="xs">
          {dirty && (
            <Button variant="default" onClick={() => setDraft(editableOf(form))}>
              Discard
            </Button>
          )}
          <Button
            className={styles.primaryButton}
            leftSection={<IconDeviceFloppy size={17} />}
            loading={saving}
            disabled={!dirty}
            onClick={save}
          >
            Save
          </Button>
        </Group>
      </div>
    </div>
  );
}
