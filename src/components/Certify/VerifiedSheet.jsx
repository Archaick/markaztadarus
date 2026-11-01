import { useEffect, useRef, useState } from "react";
import { IconDownload } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import CertificateSheet from "./Template/CertificateSheet";
import styles from "./CertificateVerify.module.css";

/**
 * A Studio certificate on its verification page: the very page that was
 * printed (drawn from its design, as wide as the card), and a PDF of it.
 */
export default function VerifiedSheet({ sheet, fileName, revoked }) {
  const { t } = useTranslation("verification/CertificateVerify");
  const box = useRef(null);
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const download = async () => {
    setBusy(true);
    try {
      const { certificatesPdf, saveBlob } = await import("./Template/studioPdf");
      saveBlob(await certificatesPdf([sheet]), `${fileName}.pdf`);
    } catch (err) {
      console.error("Could not make the PDF:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.sheetWrap}>
      <div ref={box} className={`${styles.sheet} ${revoked ? styles.sheetRevoked : ""}`} dir="ltr">
        {width > 0 && <CertificateSheet data={sheet} width={width} />}
      </div>
      {!revoked && (
        <button type="button" className={styles.sheetDownload} onClick={download} disabled={busy}>
          <IconDownload size={17} /> {busy ? t("pdf_preparing") : t("pdf_download")}
        </button>
      )}
    </div>
  );
}
