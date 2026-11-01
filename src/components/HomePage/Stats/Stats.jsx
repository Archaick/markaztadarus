import { useRef } from "react";
import CountUp from "react-countup";
import { useInView } from "framer-motion";
import { useTranslation } from "react-i18next";
import styles from "./Stats.module.css";
import StatIcon from "./StatIcon";
import { DEFAULT_STATS, localized } from "../../../data/defaultStats";
import { SITE_DOCS, useSiteContent } from "../siteContent";

// "Pencapaian Kami": a navy card set into the light page — the intro on one
// side, a tile per figure on the other, counting up once it comes into view.
const Stats = () => {
  const { t, i18n } = useTranslation("homepage/Stats");
  const stored = useSiteContent(SITE_DOCS.stats);
  const gridRef = useRef(null);
  const inView = useInView(gridRef, { once: true, amount: 0.2 });

  // Numbers come from the Website dashboard once an admin has saved them.
  const items = (Array.isArray(stored?.items) ? stored.items : DEFAULT_STATS).filter((s) => s.visible !== false);
  const lng = i18n.language;
  const separator = lng.startsWith("en") ? "," : ".";

  return (
    <section className={styles.section} id="achievements" dir={lng === "ar" ? "rtl" : "ltr"}>
      <div className={styles.container}>
        <div className={styles.panel}>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>{t("achievementsEyebrow")}</span>
            <h2 className={styles.title}>{t("achievementsTitle")}</h2>
            <p className={styles.lead}>{t("achievementsSubtitle")}</p>
          </div>

          <div className={`${styles.grid} ${inView ? styles.counted : ""}`} ref={gridRef}>
            {items.map((stat, index) => {
              const description = localized(stat.description, lng);
              return (
                <article key={stat.id} className={styles.tile} style={{ "--delay": `${index * 80}ms` }}>
                  <span className={styles.label}>
                    <span className={styles.icon}>
                      <StatIcon name={stat.icon} size={15} className={styles.iconImage} />
                    </span>
                    {localized(stat.label, lng)}
                  </span>
                  <span className={styles.figure}>
                    {inView ? (
                      <CountUp end={Number(stat.value) || 0} duration={2.2} separator={separator} className={styles.value} />
                    ) : (
                      <span className={styles.value}>0</span>
                    )}
                    <span className={styles.suffix}>{localized(stat.suffix, lng)}</span>
                  </span>
                  {description && <span className={styles.description}>{description}</span>}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
