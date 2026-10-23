import { useEffect, useRef, useState } from "react";
import { Alert, Button, Group, Modal, Text, TextInput } from "@mantine/core";
import { IconCamera, IconPhoto, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { compressImage } from "../Internal/images";
import { saveTeacher } from "./actions";
import TeacherAvatar, { avatarKind, guessAvatar } from "./TeacherAvatar";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";
const CHOICES = ["photo", "male", "female", "none"];

/**
 * A teacher's name and picture: a photo (from a file, or the phone's camera),
 * the friendly figure of an ustadz or an ustadzah, or no picture at all.
 */
export default function TeacherForm({ teacher, schoolId, opened, onClose }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [kind, setKind] = useState("male");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const file = useRef(null);
  const camera = useRef(null);

  useEffect(() => {
    if (!opened || !teacher) return;
    setName(teacher.name || "");
    setPhoto(teacher.photo || "");
    setKind(avatarKind(teacher));
    setError("");
  }, [opened, teacher]);

  const pick = async (e) => {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!f) return;
    setError("");
    try {
      const { dataUrl } = await compressImage(f, { maxWidth: 320, maxHeight: 320, maxChars: 60000 });
      setPhoto(dataUrl);
      setKind("photo");
    } catch {
      setError(t("errors.photo"));
    }
  };

  const save = async () => {
    if (!name.trim()) return setError(t("errors.name"));
    setBusy(true);
    try {
      const keepPhoto = kind === "photo" ? photo : "";
      await saveTeacher(user, teacher, { name: name.trim(), schoolId, photo: keepPhoto, avatar: kind === "photo" ? (keepPhoto ? "photo" : guessAvatar(name)) : kind });
      onClose();
    } catch (err) {
      console.error(err);
      setError(t("errors.failed"));
    } finally {
      setBusy(false);
    }
  };

  const preview = { name, photo: kind === "photo" ? photo : "", avatar: kind };

  return (
    <Modal opened={opened} onClose={onClose} title={t("teachers.edit")} centered>
      <div style={{ display: "grid", gap: 14 }}>
        <TextInput label={t("fields.teacherName")} value={name} onChange={(e) => setName(e.currentTarget.value)} dir="auto" data-autofocus />

        <div>
          <Text size="sm" fw={600} mb={6}>
            {t("teachers.picture")}
          </Text>
          <div className={styles.avatarChoices}>
            {CHOICES.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.avatarChoice} ${kind === c ? styles.avatarOn : ""}`}
                onClick={() => (c === "photo" && !photo ? file.current?.click() : setKind(c))}
              >
                {c === "none" ? (
                  <span className={styles.avatarNone}>—</span>
                ) : c === "photo" && !photo ? (
                  <span className={styles.avatarNone}>
                    <IconPhoto size={22} />
                  </span>
                ) : (
                  <TeacherAvatar teacher={{ name, photo: c === "photo" ? photo : "" }} kind={c} size={56} />
                )}
                <span>{t(`teachers.avatars.${c}`)}</span>
              </button>
            ))}
          </div>
          <Group gap="xs" mt="sm">
            <Button size="xs" variant="light" color="#003366" leftSection={<IconPhoto size={15} />} onClick={() => file.current?.click()}>
              {t("teachers.choosePhoto")}
            </Button>
            <Button size="xs" variant="light" color="#003366" leftSection={<IconCamera size={15} />} onClick={() => camera.current?.click()}>
              {t("teachers.takePhoto")}
            </Button>
            {photo && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                leftSection={<IconTrash size={15} />}
                onClick={() => {
                  setPhoto("");
                  if (kind === "photo") setKind(guessAvatar(name));
                }}
              >
                {t("teachers.removePhoto")}
              </Button>
            )}
          </Group>
          <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
          <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={pick} />
          <Text size="xs" c="dimmed" mt={6}>
            {t("teachers.pictureHint")}
          </Text>
        </div>

        {avatarKind(preview) !== "none" && (
          <Group gap="sm">
            <TeacherAvatar teacher={preview} size={72} />
            <Text size="sm" c="dimmed">
              {t("teachers.inReport")}
            </Text>
          </Group>
        )}

        {error && <Alert color="red">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button color="#003366" loading={busy} onClick={save}>
            {t("common.save")}
          </Button>
        </Group>
      </div>
    </Modal>
  );
}
