import { useEffect, useState } from "react";
import { Alert, Button, Group, Modal, Switch, Text, TextInput, Textarea } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Timestamp, addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import {
  PATH_PATTERN,
  REDIRECT_COLLECTION,
  SITE_HOST,
  expiryDate,
  isReserved,
  normalizePath,
  normalizeUrl,
} from "../Redirects/redirectSchema";
import styles from "./RedirectAdmin.module.css";

const NS = ["internal/Redirects", "internal/Internal"];

const pad = (n) => String(n).padStart(2, "0");
const toDateInput = (date) => (date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : "");
// The link stays open until the end of the chosen day.
const fromDateInput = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d, 23, 59, 59) : null;
};

const blank = { title: "", path: "", destination: "", note: "", active: true, ends: "" };

/** Create a short link, or change one (`link`) without breaking its printed QR codes. */
export default function LinkEditor({ opened, onClose, link, links, email, onSaved }) {
  const { t } = useTranslation(NS);
  const [values, setValues] = useState(blank);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setError(null);
    setValues(
      link
        ? {
            title: link.title || "",
            path: (link.source || "").replace(/^\//, ""),
            destination: link.destination || "",
            note: link.note || "",
            active: link.active !== false,
            ends: toDateInput(expiryDate(link)),
          }
        : blank
    );
  }, [opened, link]);

  const set = (key) => (e) => {
    const value = e?.currentTarget ? (e.currentTarget.type === "checkbox" ? e.currentTarget.checked : e.currentTarget.value) : e;
    setValues((v) => ({ ...v, [key]: value }));
  };

  const source = normalizePath(values.path);
  const pathChanged = link && source && source !== link.source;

  const save = async () => {
    setError(null);
    if (!PATH_PATTERN.test(source)) return setError({ key: "badPath" });
    if (isReserved(source)) return setError({ key: "reserved", path: source });
    if (links.some((l) => l.source === source && l.id !== link?.id)) return setError({ key: "taken", path: source });
    const destination = normalizeUrl(values.destination);
    if (!destination) return setError({ key: "badUrl" });
    try {
      const target = new URL(destination);
      if (target.hostname.replace(/^www\./, "") === SITE_HOST && target.pathname.toLowerCase() === source) {
        return setError({ key: "loopUrl" });
      }
    } catch {
      return setError({ key: "badUrl" });
    }

    const ends = values.ends ? fromDateInput(values.ends) : null;
    const data = {
      source,
      destination,
      title: values.title.trim(),
      note: values.note.trim(),
      active: values.active,
      expiresAt: ends ? Timestamp.fromDate(ends) : null,
      updatedAt: serverTimestamp(),
      updatedBy: email || "unknown",
    };

    setSaving(true);
    try {
      if (link) {
        await updateDoc(doc(db, REDIRECT_COLLECTION, link.id), data);
      } else {
        await addDoc(collection(db, REDIRECT_COLLECTION), {
          ...data,
          clicks: 0,
          createdAt: serverTimestamp(),
          createdBy: email || "unknown",
        });
      }
      onSaved(link ? "saved" : "created", source);
      onClose();
    } catch (err) {
      console.error("Could not save link:", err);
      setError({ key: "failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t(link ? "editor.editTitle" : "editor.newTitle")}
      centered
      size="lg"
    >
      <div className={styles.editor}>
        <TextInput
          label={t("editor.title")}
          placeholder={t("editor.titlePlaceholder")}
          value={values.title}
          onChange={set("title")}
          dir="auto"
        />
        <TextInput
          label={t("editor.path")}
          description={t("editor.pathHint")}
          required
          dir="ltr"
          leftSection={
            <Text size="xs" c="dimmed" pl={8}>
              {SITE_HOST}/
            </Text>
          }
          leftSectionWidth={128}
          value={values.path}
          onChange={(e) => {
            const value = e.currentTarget.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            setValues((v) => ({ ...v, path: value }));
          }}
          placeholder="kuesioner-guru"
        />
        {pathChanged && (
          <Alert color="orange" variant="light" icon={<IconAlertTriangle size={18} />}>
            {t("editor.pathChanged", { path: link.source })}
          </Alert>
        )}
        <TextInput
          label={t("editor.destination")}
          description={t("editor.destinationHint")}
          required
          dir="ltr"
          placeholder="https://docs.google.com/forms/…"
          value={values.destination}
          onChange={set("destination")}
        />
        <Textarea
          label={t("editor.note")}
          placeholder={t("editor.notePlaceholder")}
          autosize
          minRows={2}
          maxRows={5}
          value={values.note}
          onChange={set("note")}
          dir="auto"
        />
        <div className={styles.editorRow}>
          <Switch
            label={t("editor.active")}
            description={t("editor.activeHint")}
            checked={values.active}
            onChange={set("active")}
            color="teal"
          />
          <TextInput
            type="date"
            label={t("editor.ends")}
            description={t("editor.endsHint")}
            value={values.ends}
            onChange={set("ends")}
            className={styles.dateInput}
          />
        </div>

        {error && (
          <Alert color="red" variant="light">
            {t(`errors.${error.key}`, { path: error.path })}
          </Alert>
        )}
      </div>

      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          {t("editor.cancel")}
        </Button>
        <Button className={styles.primaryButton} loading={saving} onClick={save}>
          {t(link ? "editor.save" : "editor.create")}
        </Button>
      </Group>
    </Modal>
  );
}
