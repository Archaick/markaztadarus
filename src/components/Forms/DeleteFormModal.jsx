import { useState } from "react";
import { Alert, Button, Group, Modal, Text, TextInput } from "@mantine/core";
import { Trans, useTranslation } from "react-i18next";
import { collection, doc, getDoc, getDocs, limit, query } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { AUDIT_CHUNK, auditedWrite } from "../Internal/audit";
import { COVER_DOC, FORMS_COLLECTION, KEY_DOC, MEDIA, PRIVATE, RESPONSES } from "./formSchema";
import { FILE } from "./fileUpload";

/**
 * Deleting a form and everything in it, after typing its link. It all goes to
 * Recently deleted as one entry, where it can be restored for 30 days and then
 * goes for good. Files people uploaded stay in Drive.
 */
export default function DeleteFormModal({ form, opened, onClose, onDeleted }) {
  const { t } = useTranslation("internal/Forms");
  const { user } = useAccess();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const hasFiles = (form?.fields || []).some((f) => f.type === FILE);

  const close = () => {
    if (deleting) return;
    setConfirmText("");
    setFailed(false);
    onClose();
  };

  const deleteForm = async () => {
    setDeleting(true);
    setFailed(false);
    try {
      // Responses live in a subcollection, which Firestore does not remove
      // with the parent, so clear them first in batches.
      // All of it is one entry in the recycle bin, restored together.
      const trash = { group: `form-${form.id}-${Date.now().toString(36)}`, more: false };
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
            }),
          { trash }
        );
        trash.more = true;
        removed += snap.size;
      }
      const cover = await getDoc(doc(db, FORMS_COLLECTION, form.id, MEDIA, COVER_DOC));
      const key = await getDoc(doc(db, FORMS_COLLECTION, form.id, PRIVATE, KEY_DOC));
      await auditedWrite(
        user,
        { area: "forms", action: "form.delete", target: form.id, label: form.title, details: { status: form.status, responses: removed } },
        (batch, _auditId, markDelete) => {
          if (cover.exists()) {
            batch.delete(cover.ref);
            markDelete(`forms~${form.id}~media~${COVER_DOC}`, cover.data().auditId);
          }
          if (key.exists()) {
            batch.delete(key.ref);
            markDelete(`forms~${form.id}~private~${KEY_DOC}`, key.data().auditId);
          }
          batch.delete(doc(db, FORMS_COLLECTION, form.id));
          markDelete(`forms~${form.id}`, form.auditId);
        },
        { trash }
      );
      setConfirmText("");
      setDeleting(false);
      onDeleted();
    } catch (err) {
      console.error("Could not delete form:", err);
      setFailed(true);
      setDeleting(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title={t("share.deleteModalTitle")} centered>
      {form && (
        <>
          <Text size="sm" fw={700} mb={4} dir="auto">
            {form.title || t("untitled")}
          </Text>
          <Text size="sm" mb="sm">
            {t("share.deleteText")}
            {hasFiles ? ` ${t("share.deleteDrive")}` : ""}
          </Text>
          <Text size="sm">
            <Trans t={t} i18nKey="share.deleteConfirm" values={{ id: form.id }} components={{ b: <strong dir="ltr" /> }} />
          </Text>
          <TextInput mt="sm" dir="ltr" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={form.id} aria-label={t("share.deleteModalTitle")} />
          {failed && (
            <Alert color="red" mt="sm">
              {t("share.deleteFailed")}
            </Alert>
          )}
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={close} disabled={deleting}>
              {t("share.cancel")}
            </Button>
            <Button color="red" disabled={confirmText.trim() !== form.id} loading={deleting} onClick={deleteForm}>
              {t("share.deleteForever")}
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
