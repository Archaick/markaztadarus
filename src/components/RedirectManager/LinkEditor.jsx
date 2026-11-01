import { useEffect, useState } from "react";
import { Alert, Button, Group, Modal, Switch, Text, TextInput, Textarea } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Timestamp, collection, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import {
  PATH_PATTERN,
  REDIRECT_COLLECTION,
  REDIRECT_PUBLIC,
  SITE_HOST,
  expiryDate,
  isReserved,
  normalizePath,
  normalizeUrl,
  publicId,
  publicLink,
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
  const { user } = useAccess();
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

    // What changed, for the history.
    const changed = link
      ? ["title", "source", "destination", "note", "active"].filter((k) => String(link[k] ?? "") !== String(data[k] ?? ""))
      : [];
    if (link && (link.expiresAt?.toMillis?.() || 0) !== (data.expiresAt?.toMillis?.() || 0)) changed.push("ends");
    const entry = {
      area: "redirects",
      action: !link ? "link.create" : link.source !== source ? "link.rename" : "link.update",
      target: source,
      label: data.title || source,
      details: {
        path: `${SITE_HOST}${source}`,
        destination,
        ...(link && { changed }),
        ...(link && link.destination !== destination && { previousDestination: link.destination }),
        ...(link && link.source !== source && { previousPath: `${SITE_HOST}${link.source}` }),
        ...(link && (link.active !== false) !== data.active && { active: data.active }),
      },
    };

    setSaving(true);
    try {
      await auditedWrite(user, entry, (batch, auditId) => {
        const ref = link ? doc(db, REDIRECT_COLLECTION, link.id) : doc(collection(db, REDIRECT_COLLECTION));
        if (link) {
          batch.update(ref, { ...data, auditId });
        } else {
          batch.set(ref, {
            ...data,
            auditId,
            clicks: 0,
            createdAt: serverTimestamp(),
            createdBy: email || "unknown",
          });
        }
        // what the short-link page reads, under the (new) path
        batch.set(doc(db, REDIRECT_PUBLIC, publicId(source)), publicLink(ref.id, data));
        if (link && link.source !== source) batch.delete(doc(db, REDIRECT_PUBLIC, publicId(link.source)));
      });
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
