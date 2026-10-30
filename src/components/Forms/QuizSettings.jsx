import { useEffect, useState } from "react";
import { Alert, Button, Group, NumberInput, Radio, Switch, Text } from "@mantine/core";
import { IconDeviceFloppy, IconDownload, IconSchool } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { deleteField, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { stableKey } from "../Internal/stableKey";
import { FORMS_COLLECTION, quizOf } from "./formSchema";
import styles from "./Forms.module.css";

const NS = "internal/Forms";

/**
 * The form's settings: making it a quiz, as in Google Forms. When results are
 * released right after sending, the answer key is copied onto the form so the
 * browser can grade; otherwise it stays in the admins-only key document.
 */
export default function QuizSettings({ form, quizKey, editorEmail }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [quiz, setQuiz] = useState(() => quizOf(form));
  const [allowDownload, setAllowDownload] = useState(!!form.allowDownload);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const saved = stableKey(quizOf(form));
  const dirty = stableKey(quiz) !== saved || allowDownload !== !!form.allowDownload;

  useEffect(() => {
    setQuiz(quizOf(form));
  }, [saved]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setAllowDownload(!!form.allowDownload);
  }, [form.allowDownload]);

  const set = (patch) => setQuiz((q) => ({ ...q, ...patch }));

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const shareKey = quiz.enabled && quiz.release === "immediate";
      await auditedWrite(
        user,
        { area: "forms", action: "form.quiz", target: form.id, label: form.title, details: { quiz: quiz.enabled, release: quiz.release, download: allowDownload } },
        (batch, auditId) =>
          batch.update(doc(db, FORMS_COLLECTION, form.id), {
            quiz: { ...quiz, defaultPoints: Math.max(0, Math.min(1000, Number(quiz.defaultPoints) || 0)) },
            quizKey: shareKey ? quizKey || {} : deleteField(),
            allowDownload,
            auditId,
            updatedBy: editorEmail,
            updatedAt: serverTimestamp(),
          })
      );
      setMessage({ color: "teal", text: t("quiz.saved") });
    } catch (err) {
      console.error("Could not save the quiz settings:", err);
      setMessage({ color: "red", text: t("builder.saveFailed") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.settings}>
      <div className={styles.settingsCard}>
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <div>
            <Text fw={700} className={styles.settingsTitle}>
              <IconSchool size={18} /> {t("quiz.make")}
            </Text>
            <Text size="sm" c="dimmed">
              {t("quiz.makeHint")}
            </Text>
          </div>
          <Switch color="teal" size="md" checked={quiz.enabled} onChange={(e) => set({ enabled: e.currentTarget.checked })} aria-label={t("quiz.make")} />
        </Group>

        {quiz.enabled && (
          <div className={styles.settingsBody}>
            <Text className={styles.settingsLabel}>{t("quiz.release")}</Text>
            <Radio.Group value={quiz.release} onChange={(release) => set({ release })}>
              <div className={styles.settingsRadios}>
                <Radio color="teal" value="immediate" label={t("quiz.releaseNow")} description={t("quiz.releaseNowHint")} />
                <Radio color="teal" value="later" label={t("quiz.releaseLater")} description={t("quiz.releaseLaterHint")} />
              </div>
            </Radio.Group>

            <Text className={styles.settingsLabel}>{t("quiz.respondent")}</Text>
            {[
              ["showMissed", "missed"],
              ["showCorrect", "correct"],
              ["showPoints", "points"],
            ].map(([key, label]) => (
              <Group key={key} justify="space-between" wrap="nowrap" className={styles.settingsRow}>
                <div>
                  <Text size="sm" fw={600}>
                    {t(`quiz.${label}`)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t(`quiz.${label}Hint`)}
                  </Text>
                </div>
                <Switch color="teal" checked={!!quiz[key]} onChange={(e) => set({ [key]: e.currentTarget.checked })} aria-label={t(`quiz.${label}`)} />
              </Group>
            ))}

            <Text className={styles.settingsLabel}>{t("quiz.defaults")}</Text>
            <Group justify="space-between" wrap="nowrap" className={styles.settingsRow}>
              <div>
                <Text size="sm" fw={600}>
                  {t("quiz.defaultPoints")}
                </Text>
                <Text size="xs" c="dimmed">
                  {t("quiz.defaultPointsHint")}
                </Text>
              </div>
              <NumberInput w={110} min={0} max={1000} value={quiz.defaultPoints} onChange={(v) => set({ defaultPoints: Number(v) || 0 })} rightSection={<Text size="xs" c="dimmed" pe={6}>{t("quiz.pts")}</Text>} rightSectionWidth={44} />
            </Group>
          </div>
        )}
      </div>

      <div className={styles.settingsCard}>
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <div>
            <Text fw={700} className={styles.settingsTitle}>
              <IconDownload size={18} /> {t("settings.download")}
            </Text>
            <Text size="sm" c="dimmed">
              {t("settings.downloadHint")}
            </Text>
          </div>
          <Switch color="teal" size="md" checked={allowDownload} onChange={(e) => setAllowDownload(e.currentTarget.checked)} aria-label={t("settings.download")} />
        </Group>
      </div>

      {message && (
        <Alert color={message.color} mt="sm" p={8} withCloseButton onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}
      <Group justify="flex-end" mt="md">
        <Button className={styles.primaryButton} leftSection={<IconDeviceFloppy size={17} />} loading={saving} disabled={!dirty} onClick={save}>
          {t("builder.save")}
        </Button>
      </Group>
    </div>
  );
}
