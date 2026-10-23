import { useEffect, useRef, useState } from "react";
import { Alert, Button, Group, Switch, Text, TextInput } from "@mantine/core";
import { IconDeviceFloppy, IconSignature } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useSupervisi } from "./SupervisiData";
import { saveSettings } from "./actions";
import SignaturePad from "./SignaturePad";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";

/**
 * What every supervision starts with: the supervisor's name and signature
 * (drawn or uploaded once, then already in place at sign-off), whether the
 * supervisor signs at all, and whether teachers' pictures show in reports.
 */
export default function SupervisorDefaults() {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const { settings } = useSupervisi();
  const pad = useRef(null);
  const [name, setName] = useState("");
  const [signs, setSigns] = useState(true);
  const [photos, setPhotos] = useState(true);
  const [padKey, setPadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  // take in the saved defaults (and redraw the pad with the saved signature)
  useEffect(() => {
    setName(settings?.supervisorName || "");
    setSigns(settings?.supervisorSigns !== false);
    setPhotos(settings?.showPhotos !== false);
    setPadKey((k) => k + 1);
  }, [settings]);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await saveSettings(user, {
        supervisorName: name.trim().slice(0, 200),
        supervisorSignature: pad.current?.toDataUrl() || "",
        supervisorSigns: signs,
        showPhotos: photos,
      });
      setMessage({ color: "green", text: t("defaults.saved") });
    } catch (err) {
      console.error(err);
      setMessage({ color: "red", text: t("errors.failed") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`${styles.panel} ${styles.defaults}`}>
      <div className={styles.defaultsHead}>
        <span className={styles.statIcon}>
          <IconSignature size={22} />
        </span>
        <div>
          <h2 className={styles.panelTitle} style={{ margin: 0 }}>
            {t("defaults.title")}
          </h2>
          <Text size="sm" c="dimmed">
            {t("defaults.intro")}
          </Text>
        </div>
      </div>

      <div className={styles.defaultsGrid}>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <TextInput label={t("defaults.name")} placeholder={user?.displayName || ""} value={name} onChange={(e) => setName(e.currentTarget.value)} dir="auto" />
          <Switch color="#003366" label={t("defaults.signs")} description={t("defaults.signsHint")} checked={signs} onChange={(e) => setSigns(e.currentTarget.checked)} />
          <Switch color="#003366" label={t("defaults.photos")} description={t("defaults.photosHint")} checked={photos} onChange={(e) => setPhotos(e.currentTarget.checked)} />
        </div>
        <SignaturePad key={padKey} ref={pad} label={t("defaults.signature")} name={name || user?.displayName || ""} value={settings?.supervisorSignature || ""} />
      </div>

      {message && (
        <Alert color={message.color} mt="md" p={8} withCloseButton onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}
      <Group justify="flex-end" mt="md">
        <Button color="#003366" leftSection={<IconDeviceFloppy size={16} />} loading={busy} onClick={save}>
          {t("common.save")}
        </Button>
      </Group>
    </section>
  );
}
