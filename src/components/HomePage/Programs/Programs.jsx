import { IconArrowUpRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Programs.module.css";

import Seminar from "../../../assets/imgs/homepage/programs/seminar.jpg";
import Pelatihan from "../../../assets/imgs/homepage/programs/pelatihan.jpg";
import Majelis from "../../../assets/imgs/homepage/hero.jpg";
import Karya from "../../../assets/imgs/homepage/programs/karya.jpg";
import Umrah from "../../../assets/imgs/homepage/gallery/umrah/umrah2.jpg";

// The first one is the big card; the rest share the other half.
const PROGRAMS = [
  { key: "pelatihan", src: Pelatihan, link: "/pelatihan" },
  { key: "seminar", src: Seminar, link: "/seminar" },
  { key: "majelis", src: Majelis, link: "/majelis" },
  { key: "karya", src: Karya, link: "/ilmiah" },
  { key: "umrah", src: Umrah, link: "/umrah" },
];

/** Program Kami: every program on one screen, a photo under frosted glass each. */
const Programs = () => {
  const { t, i18n } = useTranslation("homepage/Programs");
  const rtl = i18n.language === "ar";

  return (
    <section className={styles.programsSection} id="programs" dir={rtl ? "rtl" : "ltr"}>
      <div className={styles.inner}>
        <div className={styles.headerContainer}>
          <span className={styles.headerTag}>{t("tagline")}</span>
          <h2 className={styles.header}>{t("header")}</h2>
        </div>

        <div className={styles.bento}>
          {PROGRAMS.map((p, i) => (
            <a key={p.key} href={p.link} className={`${styles.card} ${i === 0 ? styles.featured : ""}`}>
              <img src={p.src} alt="" className={styles.cardImage} loading="lazy" />
              <span className={styles.shade} />
              <div className={styles.caption}>
                <div className={styles.captionText}>
                  <h3 className={styles.cardTitle}>{t(`programs.${p.key}.title`)}</h3>
                  <p className={styles.cardDescription}>{t(`programs.${p.key}.description`)}</p>
                </div>
                <span className={styles.arrow} aria-label={t("learnMore")}>
                  <IconArrowUpRight size={20} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Programs;
