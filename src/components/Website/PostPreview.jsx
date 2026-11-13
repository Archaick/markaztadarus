import { useEffect, useRef, useState } from "react";
import { Badge, Button, Group, Modal, SegmentedControl, Text } from "@mantine/core";
import { IconDeviceDesktop, IconDeviceMobile, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { PREVIEW_MESSAGE } from "../Blog/PostPreviewPage";
import styles from "./Website.module.css";

const PREVIEW_PATH = "/internal/preview-post";

/**
 * Full-screen preview of a news post as visitors will see it, with the
 * editor's unsaved changes. The page runs in a frame (same site) so the
 * phone width gets the real mobile layout; the post is handed to it with
 * postMessage, nothing is saved. `contentLanguage` is the version of the
 * post shown ("id", "en" or "ar"), the one picked in the editor.
 */
export default function PostPreview({ opened, onClose, post, images, unsaved, contentLanguage = "id" }) {
  const { t, i18n } = useTranslation("internal/Website");
  const [view, setView] = useState("article");
  const [device, setDevice] = useState("desktop");
  const frame = useRef(null);
  const latest = useRef(null);
  latest.current = { type: PREVIEW_MESSAGE, post, images, language: i18n.language, contentLanguage };

  const send = () => frame.current?.contentWindow?.postMessage(latest.current, window.location.origin);

  // the frame asks for the post once it has loaded
  useEffect(() => {
    if (!opened) return undefined;
    const onMessage = (event) => {
      if (event.origin === window.location.origin && event.data?.type === `${PREVIEW_MESSAGE}-ready`) send();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [opened]);

  // and again whenever the post changes while the preview is open
  useEffect(() => {
    if (opened) send();
  }, [opened, post, images, i18n.language, contentLanguage]);

  return (
    <Modal opened={opened} onClose={onClose} fullScreen withCloseButton={false} padding={0} classNames={{ body: styles.previewBody }}>
      <div className={styles.previewBar}>
        <Group gap="sm" wrap="wrap">
          <Text fw={700}>{t("blog.editor.previewTitle")}</Text>
          <Badge color="gray" variant="light">
            {t(`blog.editor.languages.${contentLanguage}`)}
          </Badge>
          {unsaved && (
            <Badge color="yellow" variant="light">
              {t("blog.editor.previewUnsaved")}
            </Badge>
          )}
        </Group>
        <Group gap="sm" wrap="wrap">
          <SegmentedControl
            size="xs"
            value={view}
            onChange={setView}
            data={[
              { value: "article", label: t("blog.editor.previewArticle") },
              { value: "card", label: t("blog.editor.previewCard") },
            ]}
          />
          <SegmentedControl
            size="xs"
            value={device}
            onChange={setDevice}
            data={[
              { value: "desktop", label: <IconDeviceDesktop size={16} aria-label={t("blog.editor.previewDesktop")} /> },
              { value: "phone", label: <IconDeviceMobile size={16} aria-label={t("blog.editor.previewPhone")} /> },
            ]}
          />
          <Button size="xs" variant="default" leftSection={<IconX size={14} />} onClick={onClose}>
            {t("blog.editor.previewClose")}
          </Button>
        </Group>
      </div>
      <div className={styles.previewStage}>
        <iframe
          key={view}
          ref={frame}
          title={t("blog.editor.previewTitle")}
          src={`${PREVIEW_PATH}?view=${view}`}
          className={`${styles.previewFrame} ${device === "phone" ? styles.previewPhone : ""}`}
          onLoad={send}
        />
      </div>
    </Modal>
  );
}
