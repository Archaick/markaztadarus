import { Link, useParams } from "react-router-dom";
import { IconArrowLeft, IconBook, IconCheck, IconLock, IconPencil, IconPlayerPlayFilled, IconStarFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { fiveTOf, kindOf, sectionTitle } from "../Belajar/belajarSchema";
import { useLearner } from "./guruData";
import { GURU, NS, TopBar } from "./GuruApp";
import Sky, { FIVE, FIVE_COLOR, fiveNames, sharesOf, stepItems } from "./Sky";
import styles from "./Guru.module.css";

export const starsOf = (p) => {
  if (!p?.max) return null;
  const pct = (p.best / p.max) * 100;
  return pct >= 90 ? 3 : pct >= 70 ? 2 : pct > 0 ? 1 : 0;
};

/** One surah as a path: each section done, open (the next one) or locked. */
export default function SurahPage() {
  const { lessonId } = useParams();
  const { t } = useTranslation(NS);
  const { surahs } = useLearner();
  const s = surahs.find((x) => x.lesson.id === lessonId);

  if (!s) {
    return (
      <>
        <TopBar />
        <main className={styles.page}>
          <div className={`${styles.glassCard} ${styles.emptyCard}`}>{t("surah.missing")}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className={styles.page}>
        <Link to={GURU} className={styles.back}>
          <IconArrowLeft size={18} className={styles.flip} /> {t("surah.back")}
        </Link>
        <section className={`${styles.lightCard} ${styles.lightHero}`}>
          <div className={styles.skyBand}>
            <Sky mode="card" className={styles.skyFill} names={fiveNames(t)} shares={sharesOf(stepItems(s.steps))} progress={s.percent / 100} label={`${s.lesson.title}: ${s.percent}%`} />
          </div>
          <span className={styles.lightAr}>{s.lesson.titleAr}</span>
          <h1 className={styles.lightTitle}>{s.lesson.title}</h1>
          <span className={styles.lightMeta}>{t("surah.meta", { ayat: (s.lesson.ayat || []).length, done: s.done, total: s.total })}</span>
          <div className={styles.fiveRow}>
            {FIVE.map((k) => {
              const of = s.steps.filter((x) => fiveTOf(x.section) === k);
              if (!of.length) return null;
              const done = of.filter((x) => x.state === "done").length;
              return (
                <span key={k} className={`${styles.fiveChip} ${done === of.length ? styles.fiveChipDone : ""}`} style={{ "--c": FIVE_COLOR[k] }}>
                  <i />
                  {t(`fiveT.${k}`)}
                  <b>
                    {done}/{of.length}
                  </b>
                </span>
              );
            })}
          </div>
        </section>

        <ol className={styles.path}>
          {s.steps.map(({ section, progress, state }, i) => {
            const kind = kindOf(section);
            const stars = starsOf(progress);
            const Icon = state === "done" ? IconCheck : state === "locked" ? IconLock : kind === "written" ? IconPencil : kind === "reading" ? IconBook : IconPlayerPlayFilled;
            const body = (
              <>
                <span className={`${styles.node} ${styles[`node_${state}`]}`}>
                  <Icon size={state === "locked" ? 16 : 20} />
                </span>
                <span className={styles.stepCard}>
                  <span className={styles.stepTop}>
                    <b>{sectionTitle(section, t)}</b>
                    {fiveTOf(section) && <i>{t(`fiveT.${fiveTOf(section)}`)}</i>}
                  </span>
                  <span className={styles.stepMeta}>
                    {state === "locked"
                      ? t("surah.locked")
                      : kind === "quiz"
                        ? progress?.max
                          ? t("surah.best", { best: progress.best, max: progress.max })
                          : t("surah.questions", { count: (section.parts || []).reduce((n, p) => n + (p.questions || []).length, 0) })
                        : kind === "written"
                          ? progress?.done
                            ? progress.note
                              ? t("surah.noted")
                              : t("surah.sent")
                            : t("surah.tasks", { count: (section.tasks || []).length })
                          : progress?.done
                            ? t("surah.read")
                            : t("surah.toRead")}
                  </span>
                  {stars !== null && (
                    <span className={styles.miniStars}>
                      {[0, 1, 2].map((k) => (
                        <IconStarFilled key={k} size={14} className={k < stars ? styles.starOn : styles.starOff} />
                      ))}
                    </span>
                  )}
                </span>
              </>
            );
            return (
              <li key={section.id} className={styles.pathItem} style={{ "--i": i }}>
                {state === "locked" ? (
                  <div className={`${styles.pathLink} ${styles.pathLocked}`}>{body}</div>
                ) : (
                  <Link to={`${GURU}/bagian/${section.id}`} className={`${styles.pathLink} ${state === "open" ? styles.pathNow : ""}`}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
