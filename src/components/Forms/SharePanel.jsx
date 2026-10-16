import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, CopyButton, Group, Modal, Text, TextInput, Textarea } from "@mantine/core";
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
import { collection, doc, getDoc, getDocs, limit, query } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { AUDIT_CHUNK, auditedWrite } from "../Internal/audit";
import styles from "./Forms.module.css";
import { COVER_DOC, FORMS_COLLECTION, MEDIA, RESPONSES, formLink } from "./formSchema";

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
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

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

  const deleteForm = async () => {
    setDeleting(true);
    setDeleteError(false);
    try {
      // Responses live in a subcollection, which Firestore does not remove
      // with the parent, so clear them first in batches.
      let removed = 0;
      for (;;) {
        const snap = await getDocs(query(collection(db, FORMS_COLLECTION, form.id, RESPONSES), limit(AUDIT_CHUNK)));
        if (snap.empty) break;
        await auditedWrite(
          user,
          { area: "forms", action: "responses.clear", target: form.id, label: form.title, details: { count: snap.size } },
          (batch, _auditId, markDelete) =>
            snap.docs.forEach((d) => {
              batch.delete(d.ref);
              markDelete(`forms~${form.id}~responses~${d.id}`, d.data().auditId);
            })
        );
        removed += snap.size;
      }
      const cover = await getDoc(doc(db, FORMS_COLLECTION, form.id, MEDIA, COVER_DOC));
      await auditedWrite(
        user,
        { area: "forms", action: "form.delete", target: form.id, label: form.title, details: { status: form.status, responses: removed } },
        (batch, _auditId, markDelete) => {
          if (cover.exists()) {
            batch.delete(cover.ref);
            markDelete(`forms~${form.id}~media~${COVER_DOC}`, cover.data().auditId);
          }
          batch.delete(doc(db, FORMS_COLLECTION, form.id));
          markDelete(`forms~${form.id}`, form.auditId);
        }
      );
      navigate("/internal/forms", { replace: true });
    } catch (err) {
      console.error("Could not delete form:", err);
      setDeleteError(true);
      setDeleting(false);
    }
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

      <Modal
        opened={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmText("");
        }}
        title={t("share.deleteModalTitle")}
        centered
      >
        <Text size="sm">
          <Trans t={t} i18nKey="share.deleteConfirm" values={{ id: form.id }} components={{ b: <strong dir="ltr" /> }} />
        </Text>
        <TextInput
          mt="sm"
          dir="ltr"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={form.id}
        />
        {deleteError && (
          <Alert color="red" mt="sm">
            {t("share.deleteFailed")}
          </Alert>
        )}
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setDeleteOpen(false)}>
            {t("share.cancel")}
          </Button>
          <Button color="red" disabled={confirmText.trim() !== form.id} loading={deleting} onClick={deleteForm}>
            {t("share.deleteForever")}
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
