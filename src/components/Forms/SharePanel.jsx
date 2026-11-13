import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, CopyButton, Group, Text, Textarea } from "@mantine/core";
import {
  IconAlertTriangle,
  IconBrandWhatsapp,
  IconCheck,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconTrash,
} from "@tabler/icons-react";
import { Trans, useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { useAccess } from "../Internal/accessContext";
import DeleteFormModal from "./DeleteFormModal";
import styles from "./Forms.module.css";
import { formLink } from "./formSchema";

export default function SharePanel({ form, onOpen }) {
  const { t } = useTranslation("internal/Forms");
  const navigate = useNavigate();
  const { hasFeature, user } = useAccess();
  const link = formLink(form.id);
  const [qr, setQr] = useState("");
  // The invitation is read by respondents, so it is written in the form's language.
  const [message, setMessage] = useState(() =>
    t("share.message", { lng: form.language || "id", title: form.title, link })
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(link, { errorCorrectionLevel: "M", margin: 2, width: 480 })
      .then(setQr)
      .catch((err) => console.error("QR failed:", err));
  }, [link]);

  const downloadQr = () => {
    const a = document.createElement("a");
    a.href = qr;
    a.download = `QR-form-${form.id}.png`;
    a.click();
  };

  const closed = form.status === "closed";

  return (
    <div className={styles.share}>
      {form.status !== "open" && (
        <Alert
          color={closed ? "red" : "yellow"}
          icon={<IconAlertTriangle size={18} />}
          title={closed ? t("share.closedTitle") : t("share.draftTitle")}
          mb="lg"
        >
          <Text size="sm">{closed ? t("share.closedText") : t("share.draftText")}</Text>
          <Button size="xs" mt="sm" color="teal" onClick={onOpen}>
            {t("share.openNow")}
          </Button>
        </Alert>
      )}

      <div className={styles.shareGrid}>
        <div>
          <Text className={styles.shareLabel}>{t("share.link")}</Text>
          <div className={styles.linkBox}>
            <span className={styles.linkBoxText}>
              <bdi>{link}</bdi>
            </span>
          </div>
          <Group gap="xs" mt="xs">
            <CopyButton value={link}>
              {({ copied, copy }) => (
                <Button
                  size="sm"
                  variant="light"
                  color={copied ? "teal" : "blue"}
                  leftSection={copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                  onClick={copy}
                >
                  {copied ? t("share.copied") : t("share.copyLink")}
                </Button>
              )}
            </CopyButton>
            <Button
              size="sm"
              variant="default"
              component="a"
              href={`/form/${form.id}`}
              target="_blank"
              rel="noreferrer"
              leftSection={<IconExternalLink size={15} />}
            >
              {t("share.open")}
            </Button>
          </Group>

          <Text className={styles.shareLabel} mt="lg">
            {t("share.whatsappMessage")}
          </Text>
          <Textarea
            autosize
            minRows={4}
            dir={form.language === "ar" ? "rtl" : "ltr"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Group gap="xs" mt="xs">
            <Button
              size="sm"
              color="green"
              component="a"
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              leftSection={<IconBrandWhatsapp size={16} />}
            >
              {t("share.shareWhatsapp")}
            </Button>
            <CopyButton value={message}>
              {({ copied, copy }) => (
                <Button
                  size="sm"
                  variant="default"
                  onClick={copy}
                  leftSection={copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                >
                  {copied ? t("share.copied") : t("share.copyMessage")}
                </Button>
              )}
            </CopyButton>
          </Group>

          {hasFeature("redirects") && (
            <Text size="xs" c="dimmed" mt="md">
              <Trans
                t={t}
                i18nKey="share.shortLink"
                components={{ a: <a href="/internal/redirect-manager" className={styles.inlineLink} /> }}
              />
            </Text>
          )}
        </div>

        <div className={styles.qrBox}>
          {qr ? <img src={qr} alt={link} className={styles.qrImage} /> : <div className={styles.qrImage} />}
          <Button size="xs" variant="light" leftSection={<IconDownload size={14} />} onClick={downloadQr} disabled={!qr}>
            {t("share.downloadQr")}
          </Button>
        </div>
      </div>

      <div className={styles.dangerZone}>
        <div>
          <Text fw={700} size="sm">
            {t("share.deleteTitle")}
          </Text>
          <Text size="xs" c="dimmed">
            {t("share.deleteText")}
          </Text>
        </div>
        <Button color="red" variant="light" leftSection={<IconTrash size={15} />} onClick={() => setDeleteOpen(true)}>
          {t("share.deleteButton")}
        </Button>
      </div>

      <DeleteFormModal form={form} opened={deleteOpen} onClose={() => setDeleteOpen(false)} onDeleted={() => navigate("/internal/forms", { replace: true })} />
    </div>
  );
}
