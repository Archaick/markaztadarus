import { useState } from "react";
import { Alert, Button, FileButton, Group } from "@mantine/core";
import { IconExternalLink, IconFileTypePdf, IconReplace, IconTrash, IconUpload } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { setSectionPdf } from "./actions";
import { NS } from "./belajarSchema";
import { PDF_MAX_BYTES, removePdf, storePdf } from "./pdfFiles";
import styles from "./Belajar.module.css";

/**
 * A section's written material as a PDF: upload one, replace or remove it.
 * Here it is a small file card, so the questions stay close at hand; the whole
 * PDF is read as teachers read it in "Try them all as a teacher".
 * Saved at once (not with the page's Save).
 */
export default function PdfSlot({ lesson, section }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pdf = section.pdf?.url ? section.pdf : null;

  const upload = async (file) => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const stored = await storePdf(lesson.id, section.id, file);
      await setSectionPdf(user, lesson, section, stored);
      if (pdf?.file) removePdf(pdf.file).catch(() => {});
    } catch (err) {
      console.error("Could not add the PDF:", err);
      setError(t(err.message === "too-large" ? "pdf.tooLarge" : err.message === "not-pdf" ? "pdf.notPdf" : "pdf.failed", { mb: Math.round(PDF_MAX_BYTES / 1048576) }));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await setSectionPdf(user, lesson, section, null);
      removePdf(pdf.file).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.pdfSlot}>
      {error && (
        <Alert color="red" mb="sm" withCloseButton onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {pdf ? (
        <>
          <div className={styles.pdfFile}>
            <IconFileTypePdf size={30} className={styles.pdfFileIcon} />
            <b className={styles.pdfFileName}>{pdf.name || "PDF"}</b>
            <a href={pdf.url} target="_blank" rel="noreferrer" className={styles.pdfFileOpen}>
              <IconExternalLink size={14} /> {t("pdf.open")}
            </a>
          </div>
          <Group gap="xs" mt="xs">
            <FileButton onChange={upload} accept="application/pdf">
              {(props) => (
                <Button {...props} size="xs" variant="light" color="#003366" leftSection={<IconReplace size={14} />} loading={busy}>
                  {t("pdf.replace")}
                </Button>
              )}
            </FileButton>
            <Button size="xs" variant="subtle" color="red" leftSection={<IconTrash size={14} />} onClick={remove} disabled={busy}>
              {t("pdf.remove")}
            </Button>
          </Group>
        </>
      ) : (
        <FileButton onChange={upload} accept="application/pdf">
          {(props) => (
            <button type="button" {...props} className={styles.pdfDrop} disabled={busy}>
              <IconFileTypePdf size={34} />
              <b>{busy ? t("pdf.uploading") : t("pdf.add")}</b>
              <span>{t("pdf.addHint", { mb: Math.round(PDF_MAX_BYTES / 1048576) })}</span>
              {!busy && (
                <span className={styles.pdfDropBtn}>
                  <IconUpload size={14} /> {t("pdf.choose")}
                </span>
              )}
            </button>
          )}
        </FileButton>
      )}
    </div>
  );
}
