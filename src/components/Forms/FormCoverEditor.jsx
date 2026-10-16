import { useEffect, useRef, useState } from "react";
import { Alert, Button, Group, Loader, SegmentedControl, Text } from "@mantine/core";
import { IconPhoto, IconPhotoPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { deleteField, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { db } from "../../../firebaseConfig";
import styles from "./Forms.module.css";
import { COVER_DOC, COVER_POSITIONS, FORMS_COLLECTION, MEDIA, compressCover } from "./formSchema";

export default function FormCoverEditor({ form, editorEmail }) {
  const { t } = useTranslation("internal/Forms");
  const { user } = useAccess();
  const inputRef = useRef(null);
  // The cover's current version, needed to delete it (see Internal/audit.js).
  const coverAuditId = useRef(null);
  const [cover, setCover] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const hasCover = !!form.coverVersion;
  const position = form.coverPosition || "center";

  useEffect(() => {
    if (!hasCover) {
      setCover(null);
      return undefined;
    }
    return onSnapshot(
      doc(db, FORMS_COLLECTION, form.id, MEDIA, COVER_DOC),
      (snap) => {
        setCover(snap.exists() ? snap.data().dataUrl : null);
        coverAuditId.current = snap.exists() ? snap.data().auditId : null;
      },
      (err) => console.error("Could not load cover:", err)
    );
  }, [form.id, hasCover]);

  // Changes the form (and its cover) in one batch with a history entry.
  const touchForm = (action, patch, more, details) =>
    auditedWrite(user, { area: "forms", action, target: form.id, label: form.title, details }, (batch, auditId, markDelete) => {
      batch.update(doc(db, FORMS_COLLECTION, form.id), {
        ...patch,
        auditId,
        updatedBy: editorEmail,
        updatedAt: serverTimestamp(),
      });
      more?.(batch, auditId, markDelete);
    });

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setBusy("upload");
    try {
      const dataUrl = await compressCover(file);
      await touchForm("form.cover", { coverVersion: Date.now(), coverPosition: position }, (batch, auditId) =>
        batch.set(doc(db, FORMS_COLLECTION, form.id, MEDIA, COVER_DOC), {
          dataUrl,
          auditId,
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      console.error("Cover upload failed:", err);
      setError(
        err.message === "unreadable" ? "unreadable" : err.message === "too-large" ? "tooLarge" : "saveFailed"
      );
    } finally {
      setBusy("");
    }
  };

  const removeCover = async () => {
    setError("");
    setBusy("remove");
    try {
      await touchForm("form.cover_remove", { coverVersion: deleteField(), coverPosition: deleteField() }, (batch, _id, markDelete) => {
        batch.delete(doc(db, FORMS_COLLECTION, form.id, MEDIA, COVER_DOC));
        markDelete(`forms~${form.id}~media~${COVER_DOC}`, coverAuditId.current);
      });
    } catch (err) {
      console.error("Could not remove cover:", err);
      setError("removeFailed");
    } finally {
      setBusy("");
    }
  };

  const changePosition = (value) =>
    touchForm("form.cover_position", { coverPosition: value }, null, { position: value }).catch((err) => {
      console.error("Could not move cover:", err);
      setError("moveFailed");
    });

  return (
    <div className={styles.coverEditor}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />

      {hasCover ? (
        <>
          <div
            className={styles.coverPreview}
            style={cover ? { backgroundImage: `url(${cover})`, backgroundPosition: `center ${position}` } : undefined}
          >
            {!cover && <Loader size="sm" color="white" />}
            <span className={styles.coverTag}>
              <IconPhoto size={14} /> {t("cover.tag")}
            </span>
          </div>
          <Group justify="space-between" mt="xs" gap="xs">
            <Group gap={6}>
              <Text size="xs" c="dimmed">
                {t("cover.showThe")}
              </Text>
              <SegmentedControl
                size="xs"
                value={position}
                onChange={changePosition}
                data={COVER_POSITIONS.map((value) => ({ value, label: t(`cover.${value}`) }))}
                disabled={!!busy}
              />
              <Text size="xs" c="dimmed">
                {t("cover.ofImage")}
              </Text>
            </Group>
            <Group gap={6}>
              <Button
                size="xs"
                variant="light"
                color="teal"
                leftSection={<IconPhotoPlus size={14} />}
                loading={busy === "upload"}
                disabled={!!busy}
                onClick={() => inputRef.current?.click()}
              >
                {t("cover.change")}
              </Button>
              <Button
                size="xs"
                variant="subtle"
                color="red"
                leftSection={<IconTrash size={14} />}
                loading={busy === "remove"}
                disabled={!!busy}
                onClick={removeCover}
              >
                {t("cover.remove")}
              </Button>
            </Group>
          </Group>
        </>
      ) : (
        <button
          type="button"
          className={styles.coverEmpty}
          onClick={() => inputRef.current?.click()}
          disabled={!!busy}
        >
          {busy === "upload" ? <Loader size="sm" color="teal" /> : <IconPhotoPlus size={22} />}
          <span className={styles.coverEmptyTitle}>
            {busy === "upload" ? t("cover.saving") : t("cover.add")}
          </span>
          <span className={styles.coverEmptyHint}>
            {t("cover.hint")}
          </span>
        </button>
      )}

      {error && (
        <Alert color="red" mt="xs" withCloseButton onClose={() => setError("")}>
          {t(`cover.errors.${error}`)}
        </Alert>
      )}
    </div>
  );
}
