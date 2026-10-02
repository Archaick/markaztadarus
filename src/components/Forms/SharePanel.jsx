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
import QRCode from "qrcode";
import { collection, deleteDoc, doc, getDocs, limit, query, writeBatch } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import styles from "./Forms.module.css";
import { FORMS_COLLECTION, RESPONSES, formLink } from "./formSchema";

const shareMessage = (form) =>
  `Assalamu'alaikum.\n\nMohon kesediaannya untuk mengisi formulir *${form.title}* melalui tautan berikut:\n${formLink(form.id)}\n\nJazakumullahu khairan.`;

export default function SharePanel({ form, onOpen }) {
  const navigate = useNavigate();
  const { hasFeature } = useAccess();
  const link = formLink(form.id);
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState(() => shareMessage(form));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
    setDeleteError("");
    try {
      // Responses live in a subcollection, which Firestore does not remove
      // with the parent, so clear them first in batches.
      for (;;) {
        const snap = await getDocs(query(collection(db, FORMS_COLLECTION, form.id, RESPONSES), limit(400)));
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      await deleteDoc(doc(db, FORMS_COLLECTION, form.id));
      navigate("/internal/forms", { replace: true });
    } catch (err) {
      console.error("Could not delete form:", err);
      setDeleteError("Could not delete the form. Try again.");
      setDeleting(false);
    }
  };

  return (
    <div className={styles.share}>
      {form.status !== "open" && (
        <Alert
          color={form.status === "closed" ? "red" : "yellow"}
          icon={<IconAlertTriangle size={18} />}
          title={form.status === "closed" ? "This form is closed" : "This form is still a draft"}
          mb="lg"
        >
          <Text size="sm">
            {form.status === "closed"
              ? "People who open the link are told it no longer accepts answers."
              : "People who open the link will see “form not found” until you open it."}
          </Text>
          <Button size="xs" mt="sm" color="teal" onClick={onOpen}>
            Open the form for answers
          </Button>
        </Alert>
      )}

      <div className={styles.shareGrid}>
        <div>
          <Text className={styles.shareLabel}>Form link</Text>
          <div className={styles.linkBox}>
            <span className={styles.linkBoxText}>{link}</span>
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
                  {copied ? "Copied" : "Copy link"}
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
              Open
            </Button>
          </Group>

          <Text className={styles.shareLabel} mt="lg">
            WhatsApp message
          </Text>
          <Textarea autosize minRows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
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
              Share on WhatsApp
            </Button>
            <CopyButton value={message}>
              {({ copied, copy }) => (
                <Button size="sm" variant="default" onClick={copy} leftSection={copied ? <IconCheck size={15} /> : <IconCopy size={15} />}>
                  {copied ? "Copied" : "Copy message"}
                </Button>
              )}
            </CopyButton>
          </Group>

          {hasFeature("redirects") && (
            <Text size="xs" c="dimmed" mt="md">
              Want a shorter link? Create one in the{" "}
              <a href="/internal/redirect-manager" className={styles.inlineLink}>
                Redirect Manager
              </a>{" "}
              pointing to this form.
            </Text>
          )}
        </div>

        <div className={styles.qrBox}>
          {qr ? <img src={qr} alt={`QR code for ${link}`} className={styles.qrImage} /> : <div className={styles.qrImage} />}
          <Button size="xs" variant="light" leftSection={<IconDownload size={14} />} onClick={downloadQr} disabled={!qr}>
            Download QR
          </Button>
        </div>
      </div>

      <div className={styles.dangerZone}>
        <div>
          <Text fw={700} size="sm">
            Delete this form
          </Text>
          <Text size="xs" c="dimmed">
            Removes the form and every response. This cannot be undone — export the CSV first.
          </Text>
        </div>
        <Button color="red" variant="light" leftSection={<IconTrash size={15} />} onClick={() => setDeleteOpen(true)}>
          Delete form
        </Button>
      </div>

      <Modal
        opened={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmText("");
        }}
        title="Delete form and all responses"
        centered
      >
        <Text size="sm">
          Type <strong>{form.id}</strong> to confirm.
        </Text>
        <TextInput mt="sm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={form.id} />
        {deleteError && (
          <Alert color="red" mt="sm">
            {deleteError}
          </Alert>
        )}
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button color="red" disabled={confirmText.trim() !== form.id} loading={deleting} onClick={deleteForm}>
            Delete forever
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
