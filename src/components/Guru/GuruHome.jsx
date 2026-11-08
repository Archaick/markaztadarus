import { Link } from "react-router-dom";
import { IconChevronRight, IconPlayerPlayFilled, IconTrophy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { fiveTOf, sectionTitle } from "../Belajar/belajarSchema";
import { useLearner } from "./guruData";
import { GURU, NS, TopBar } from "./GuruApp";
import InstallCard from "./InstallCard";
import Lantern, { lanternItems } from "./Lantern";
import styles from "./Guru.module.css";

/** A ring that fills to `value` percent. */
export function Ring({ value, size = 64, stroke = 7, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className={styles.ring} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className={styles.ringTrack} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} className={styles.ringFill} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <span className={styles.ringText}>{children}</span>
    </span>
  );
}

const greetingKey = () => {
  const h = new Date().getHours();
  return h < 11 ? "home.morning" : h < 15 ? "home.noon" : h < 18 ? "home.afternoon" : "home.evening";
};

/**
 * Home: one clear next step (the big "Lanjutkan" card), how far along
 * overall, and every surah the class was given.
 */
export default function GuruHome() {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const { surahs, overall, next, classes } = useLearner();
  const name = (user?.displayName || "").split(" ")[0];
  const allDone = overall.total > 0 && overall.done === overall.total;

  return (
    <>
      <TopBar />
      <main className={styles.page}>
        <section className={styles.hello}>
          <div>
            <span className={styles.helloSmall}>{t(greetingKey())}</span>
            <h1 className={styles.helloTitle}>{t("home.salam", { name })}</h1>
            <div className={styles.classChips}>
              {classes.map((c) => (
                <span key={c.id}>{c.name}</span>
              ))}
            </div>
          </div>
          <Ring value={overall.percent} size={78} stroke={8}>
            <b>{overall.percent}%</b>
          </Ring>
        </section>

        {next ? (
          <Link to={`${GURU}/bagian/${next.step.section.id}`} className={styles.hero}>
            <span className={styles.heroAr} aria-hidden="true">
              {next.lesson.titleAr}
            </span>
            <span className={styles.heroLabel}>{overall.done ? t("home.continue") : t("home.start")}</span>
            <span className={styles.heroSection}>{sectionTitle(next.step.section, t)}</span>
            <span className={styles.heroSurah}>
              {t("home.surah", { name: next.lesson.title })}
              {fiveTOf(next.step.section) && <i>{t(`fiveT.${fiveTOf(next.step.section)}`)}</i>}
            </span>
            <span className={styles.heroPlay}>
              <IconPlayerPlayFilled size={22} />
            </span>
          </Link>
        ) : allDone ? (
          <div className={`${styles.hero} ${styles.heroDone}`}>
            <IconTrophy size={42} />
            <span className={styles.heroSection}>{t("home.allDone")}</span>
            <span className={styles.heroSurah}>{t("home.allDoneText")}</span>
          </div>
        ) : (
          <div className={`${styles.glassCard} ${styles.emptyCard}`}>{t("home.nothingYet")}</div>
        )}

        <InstallCard />

        {surahs.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>{t("home.yourSurahs")}</h2>
            <div className={styles.surahList}>
              {surahs.map((s, i) => (
                <Link key={s.lesson.id} to={`${GURU}/surat/${s.lesson.id}`} className={styles.surahCard} style={{ "--i": i }}>
                  <span className={`${styles.lightCard} ${styles.lightThumb}`}>
                    <Lantern compact items={lanternItems(s.steps)} label={`${s.lesson.title}: ${s.percent}%`} />
                  </span>
                  <span className={styles.surahText}>
                    <b>{s.lesson.title}</b>
                    <span>{t("home.steps", { done: s.done, total: s.total })}</span>
                    <span className={styles.surahPercent}>{s.percent}%</span>
                  </span>
                  <span className={styles.surahAr}>{s.lesson.titleAr}</span>
                  <IconChevronRight size={18} className={styles.flip} />
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
