import { useEffect, useRef, useState } from "react";
import { IconDownload, IconLoader2 } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Guru.module.css";

/**
 * A PDF read right on the page, every page drawn to fit the width (no new
 * tab, no download needed), with a button that saves the file to the device.
 * The PDF reader is loaded only when a PDF is shown.
 */
export default function PdfView({ pdf, onProgress }) {
  const { t } = useTranslation("guru/Guru");
  // the words for page labels, without restarting the whole PDF when they load
  const tRef = useRef(t);
  tRef.current = t;
  const box = useRef(null);
  const [pages, setPages] = useState(null); // null loading, [] failed, else canvases drawn
  const [saving, setSaving] = useState(false);
  // how far the reader has come: the furthest page that has been half on screen
  const report = useRef(onProgress);
  report.current = onProgress;

  useEffect(() => {
    let cancelled = false;
    let doc = null;
    let seen = null;
    (async () => {
      try {
        const lib = await import("pdfjs-dist");
        const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        lib.GlobalWorkerOptions.workerSrc = worker;
        doc = await lib.getDocument({ url: pdf.url }).promise;
        if (cancelled) return;
        const el = box.current;
        el.innerHTML = "";
        const width = el.clientWidth || 640;
        const ratio = Math.min(2, window.devicePixelRatio || 1);
        const drawn = [];
        let furthest = 0;
        report.current?.(0, doc.numPages);
        seen = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              const n = Number(e.target.dataset.page);
              if (e.isIntersecting && n > furthest) {
                furthest = n;
                report.current?.(furthest, doc.numPages);
              }
            });
          },
          { threshold: 0.5 }
        );
        for (let n = 1; n <= doc.numPages; n += 1) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = styles.pdfPage;
          canvas.setAttribute("aria-label", tRef.current("pdf.page", { n, total: doc.numPages }));
          canvas.dataset.page = String(n);
          el.appendChild(canvas);
          seen.observe(canvas);
          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
          drawn.push(n);
          if (n === 1) setPages([...drawn]);
        }
        if (!cancelled) setPages(drawn);
      } catch (err) {
        console.error("Could not show the PDF:", err);
        if (!cancelled) setPages([]);
        // a PDF that cannot be shown must not lock the teacher out of the questions
        if (!cancelled) report.current?.(1, 1);
      }
    })();
    return () => {
      cancelled = true;
      seen?.disconnect();
      doc?.destroy?.();
    };
  }, [pdf.url]);

  // saved on the device under its own name, without leaving the page
  const download = async () => {
    setSaving(true);
    try {
      const res = await fetch(pdf.url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = pdf.name || "materi.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 4000);
    } catch (err) {
      console.error("Could not save the PDF:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${styles.glassCard} ${styles.pdfCard}`}>
      <div className={styles.pdfBar}>
        <b className={styles.pdfName}>{pdf.name || "PDF"}</b>
        <button type="button" className={styles.pdfDownload} onClick={download} disabled={saving}>
          <IconDownload size={16} /> {t("pdf.download")}
        </button>
      </div>
      {pages === null && (
        <p className={styles.pdfState}>
          <IconLoader2 size={18} className={styles.pdfSpin} /> {t("pdf.loading")}
        </p>
      )}
      {pages !== null && pages.length === 0 && <p className={styles.pdfState}>{t("pdf.failed")}</p>}
      <div ref={box} className={styles.pdfPages} />
    </div>
  );
}
