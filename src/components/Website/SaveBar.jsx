import { Alert, Button, Group, Text } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "../Forms/Forms.module.css";

// Sticky bar at the bottom of an editor: unsaved state, Discard and Save.
// `canSave` also allows saving untouched built-in data for the first time.
export default function SaveBar({ dirty, canSave = dirty, saving, message, onDismiss, onDiscard, onSave }) {
  const { t } = useTranslation("internal/Website");

  return (
    <div className={`${styles.saveBar} ${dirty ? styles.saveBarDirty : ""}`}>
      {message ? (
        <Alert color={message.color} p={6} className={styles.saveMessage} withCloseButton onClose={onDismiss}>
          {message.text}
        </Alert>
      ) : (
        <Text size="sm" c={dirty ? "orange.8" : "dimmed"} fw={dirty ? 600 : 400}>
          {dirty ? t("unsaved") : t("allSaved")}
        </Text>
      )}
      <Group gap="xs">
        {dirty && (
          <Button variant="default" onClick={onDiscard}>
            {t("discard")}
          </Button>
        )}
        <Button
          className={styles.primaryButton}
          leftSection={<IconDeviceFloppy size={17} />}
          loading={saving}
          disabled={!canSave}
          onClick={onSave}
        >
          {t("save")}
        </Button>
      </Group>
    </div>
  );
}
