import { useEffect, useState, useRef } from "react";
import CountUp from "react-countup";
import { useTranslation } from "react-i18next";
import styles from "./Stats.module.css";
import StatIcon from "./StatIcon";
import { DEFAULT_STATS, localized } from "../../../data/defaultStats";
import { SITE_DOCS, useSiteContent } from "../siteContent";

const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const { t, i18n } = useTranslation("homepage/Stats");
  const stored = useSiteContent(SITE_DOCS.stats);

  useEffect(() => {
    const node = containerRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, []);

  // Numbers come from the Website dashboard once an admin has saved them.
  const items = (Array.isArray(stored?.items) ? stored.items : DEFAULT_STATS).filter((s) => s.visible !== false);
  const lng = i18n.language;

  return (
    <div className={styles.statisticsContainer} ref={containerRef}>
      <div className={styles.statisticsContent}>
        <h2 className={styles.statisticsTitle}>{t("achievementsTitle")}</h2>
        <div className={styles.statisticsGrid}>
          {items.map((stat) => (
            <div key={stat.id} className={styles.statisticCard}>
              <div className={styles.statisticIcon}>
                <StatIcon name={stat.icon} size={32} className={styles.customIcon} />
              </div>
              <div className={styles.statisticData}>
                {isVisible ? (
                  <CountUp end={Number(stat.value) || 0} duration={4} className={styles.statisticValue} delay={0.2} />
                ) : (
                  <span className={styles.statisticValue}>0</span>
                )}
                <span className={styles.statisticSuffix}>{localized(stat.suffix, lng)}</span>
              </div>
              <h3 className={styles.statisticTitle}>{localized(stat.label, lng)}</h3>
              {localized(stat.description, lng) && (
                <p className={styles.statisticDescription}>{localized(stat.description, lng)}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;
