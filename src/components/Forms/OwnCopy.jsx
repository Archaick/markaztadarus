import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconFileTypePdf, IconPhoto } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../Internal/timeAgo";
import { reportToPdf } from "../Supervisi/reportPdf";
import { sectionsOf } from "./formSchema";
import { ResponseSheet, SHEET_PX, hostClass } from "./ResponseSheet";
import styles from "./PublicForm.module.css";

const NS = "internal/Forms";
const safe = (s) => String(s || "").replace(/[\\/:*?"<>|]+/g, " ").trim() || "jawaban";

const download = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

/**
 * After sending (when the form allows it): the person's own copy of their
 * answers on the Markaz Tadarus letterhead, as a PDF, or as pictures (one per
 * section, ready for a WhatsApp status; on a phone they go to the share sheet).
 */
export default function OwnCopy({ form, answers, sectionIds, sentAt }) {
  const { t } = useTranslation(NS);
  const sheetRef = useRef(null);
  const [busy, setBusy] = useState(null); // "pdf" | "png"
  const [note, setNote] = useState("");

  // the sections this person went through, in order
  const sections = useMemo(() => {
    const all = sectionsOf(form.fields || [], form.firstNext);
    return sectionIds ? sectionIds.map((id) => all.find((s) => s.id === id)).filter(Boolean) : all;
  }, [form.fields, form.firstNext, sectionIds]);
  const footer = `${form.title} · ${formatDateTime(sentAt)}`;
  const name = safe(form.title);

  const makePdf = async () => {
    setBusy("pdf");
    setNote("");
    try {
      download(await reportToPdf(sheetRef.current, SHEET_PX), `${name}.pdf`);
    } catch (err) {
      console.error("Could not make the PDF:", err);
      setNote(t("public.download.failed"));
    } finally {
      setBusy(null);
    }
  };

  const makePng = async () => {
    setBusy("png");
    setNote("");
    try {
      const { toBlob } = await import("html-to-image");
      await document.fonts?.ready;
      const pages = [...sheetRef.current.querySelectorAll("[data-pdf-page]")];
      const files = [];
      for (let i = 0; i < pages.length; i += 1) {
        const blob = await toBlob(pages[i], { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
        files.push(new File([blob], pages.length > 1 ? `${name} ${i + 1}.png` : `${name}.png`, { type: "image/png" }));
      }
      // a phone: straight to the share sheet (WhatsApp status and the like)
      if (navigator.canShare?.({ files })) {
        try {
          await navigator.share({ files, title: form.title });
          return;
        } catch (err) {
          if (err?.name === "AbortError") return;
        }
      }
      for (const file of files) {
        download(file, file.name);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch (err) {
      console.error("Could not make the pictures:", err);
      setNote(t("public.download.failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`${styles.card} ${styles.ownCopy}`}>
      <div>
        <p className={styles.ownCopyTitle}>{t("public.download.title")}</p>
        <p className={styles.ownCopyText}>{t("public.download.hint")}</p>
      </div>
      <div className={styles.ownCopyButtons}>
        <button type="button" className={styles.ownCopyButton} onClick={makePdf} disabled={!!busy}>
          <IconFileTypePdf size={18} /> {busy === "pdf" ? t("public.download.making") : t("public.download.pdf")}
        </button>
        <button type="button" className={styles.ownCopyButton} onClick={makePng} disabled={!!busy}>
          <IconPhoto size={18} /> {busy === "png" ? t("public.download.making") : t("public.download.png")}
        </button>
      </div>
      {note && <p className={styles.ownCopyNote}>{note}</p>}

      {/* the pages themselves, off screen */}
      {createPortal(
        <div className={hostClass}>
          <ResponseSheet sheetRef={sheetRef} sections={sections} answers={answers} footer={footer} formTitle={form.title} rtl={form.language === "ar"} />
        </div>,
        document.body
      )}
    </div>
  );
}
