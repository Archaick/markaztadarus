import { Link, useParams } from "react-router-dom";
import { IconArrowLeft, IconBook, IconCheck, IconLock, IconPencil, IconPlayerPlayFilled, IconStarFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { sectionType } from "../Belajar/belajarSchema";
import { useLearner } from "./guruData";
import { GURU, NS, TopBar } from "./GuruApp";
import { Ring } from "./GuruHome";
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
        <section className={styles.surahHead}>
          <span className={styles.surahHeadAr}>{s.lesson.titleAr}</span>
          <div className={styles.surahHeadRow}>
            <div>
              <h1 className={styles.helloTitle}>{s.lesson.title}</h1>
              <span className={styles.helloSmall}>{t("surah.meta", { ayat: (s.lesson.ayat || []).length, done: s.done, total: s.total })}</span>
            </div>
            <Ring value={s.percent} size={70} stroke={7}>
              <b>{s.percent}%</b>
            </Ring>
          </div>
        </section>

        <ol className={styles.path}>
          {s.steps.map(({ section, progress, state }, i) => {
            const kind = sectionType(section.key)?.kind || "quiz";
            const stars = starsOf(progress);
            const Icon = state === "done" ? IconCheck : state === "locked" ? IconLock : kind === "written" ? IconPencil : kind === "reading" ? IconBook : IconPlayerPlayFilled;
            const body = (
              <>
                <span className={`${styles.node} ${styles[`node_${state}`]}`}>
                  <Icon size={state === "locked" ? 16 : 20} />
                </span>
                <span className={styles.stepCard}>
                  <span className={styles.stepTop}>
                    <b>{t(`section.${section.key}`)}</b>
                    {sectionType(section.key)?.t && <i>{t(`fiveT.${sectionType(section.key).t}`)}</i>}
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
