import { useEffect, useRef, useState } from "react";
import { IconBan, IconCheck, IconDeviceMobileRotated, IconDownload } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import CertificateSheet from "./Template/CertificateSheet";
import styles from "./VerifiedSheet.module.css";

/**
 * A Studio certificate's verification page: the certificate itself fills the
 * screen (as large as fits, on its own paper colour), under a slim bar that
 * says it is genuine (or revoked), with its code, a PDF of it and the
 * language. Below it, only what the page does not print: the dates.
 */
export default function VerifiedSheet({ sheet, cert, revoked, details, langs, footer }) {
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
      saveBlob(await certificatesPdf([sheet]), `sertifikat-${cert.code}.pdf`);
    } catch (err) {
      console.error("Could not make the PDF:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.page} ${revoked ? styles.revoked : ""}`}>
      <header className={styles.bar}>
        <span className={styles.status}>
          <span className={styles.statusIcon}>{revoked ? <IconBan size={16} /> : <IconCheck size={16} stroke={3} />}</span>
          {revoked ? t("revoked_badge") : t("authentic_badge")}
          <bdi className={styles.code}>{cert.code}</bdi>
        </span>
        <span className={styles.actions}>
          {!revoked && (
            <button type="button" className={styles.download} onClick={download} disabled={busy}>
              <IconDownload size={16} /> <span>{busy ? t("pdf_preparing") : t("pdf_download")}</span>
            </button>
          )}
          {langs}
        </span>
      </header>

      {revoked && (
        <div className={styles.notice}>
          <strong>{t("revoked_title")}</strong> {t("revoked_text")}
          {cert.revokedReason && (
            <span dir="auto">
              {" "}
              {t("revoked_reason")}: {cert.revokedReason}
            </span>
          )}
        </div>
      )}

      <div ref={box} className={styles.sheet} dir="ltr">
        {width > 0 && <CertificateSheet data={sheet} width={width} />}
      </div>

      <p className={styles.rotate}>
        <IconDeviceMobileRotated size={16} /> {t("rotate_hint")}
      </p>

      <div className={styles.below}>
        {details}
        <p className={styles.footer}>{footer}</p>
      </div>
    </div>
  );
}
