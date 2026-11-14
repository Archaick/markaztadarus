import { IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import LoaderGlobe from "../Common/LoaderGlobe";
import styles from "../Redirects/Redirects.module.css";

/**
 * The opening of a form link: the same card as a short link's redirect (the
 * globe flying from the Haramain down to the Tadarus provinces), with the
 * form's title once it is known, then the form itself. A tap skips it.
 */
export default function FormIntro({ title, rtl, onSkip }) {
  const { t } = useTranslation("common/Redirect");
  return (
    <main className={styles.page} dir={rtl ? "rtl" : "ltr"}>
      <div className={styles.pattern} aria-hidden="true" />
      <section className={styles.card} aria-live="polite" aria-busy="true">
        <LoaderGlobe />
        <p className={styles.brandRow}>
          <img src="/MTIFavicon.png" alt="" width="22" height="22" />
          Markaz Tadarus Indonesia
        </p>
        <h1 className={styles.headline}>{t("wait.title")}</h1>
        <p className={styles.text}>{t("wait.to.form")}</p>
        {title && (
          <p className={styles.linkTitle} dir="auto">
            {title}
          </p>
        )}
        <div className={styles.bar}>
          <span />
        </div>
        {title && (
          <button type="button" className={styles.fallback} onClick={onSkip} style={{ border: 0, background: "none", cursor: "pointer", font: "inherit" }}>
            {t("wait.manual")} <IconArrowRight size={15} className={styles.flip} />
          </button>
        )}
      </section>
    </main>
  );
}
