import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { IconArrowLeft, IconCheck, IconMessageCircle, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { kindOf, questionsOf, sectionTitle } from "../Belajar/belajarSchema";
import { useLearner } from "./guruData";
import { GURU, NS, TopBar } from "./GuruApp";
import Player from "./Player";
import styles from "./Guru.module.css";

/** One section: its text to read, then the practice player; or written tasks; or a reading. */
export default function SectionView() {
  const { sectionId } = useParams();
  const { t } = useTranslation(NS);
  const navigate = useNavigate();
  const { surahs, progress, saveProgress } = useLearner();
  const [playing, setPlaying] = useState(false);

  // the section, its surah, and whether it is open yet
  let found = null;
  surahs.forEach((s) => s.steps.forEach((step) => step.section.id === sectionId && (found = { surah: s, step })));
  if (!found) return <Navigate to={GURU} replace />;
  const { surah, step } = found;
  if (step.state === "locked") return <Navigate to={`${GURU}/surat/${surah.lesson.id}`} replace />;

  const section = step.section;
  const kind = kindOf(section);
  const title = `${surah.lesson.title} · ${sectionTitle(section, t)}`;
  const backTo = `${GURU}/surat/${surah.lesson.id}`;
  const questions = questionsOf(section);
  const mine = progress.get(section.id);

  if (playing && questions.length) {
    return <Player section={section} title={title} onFinish={(r) => saveProgress(section, r).catch((err) => console.error("Could not save progress:", err))} onExit={() => navigate(backTo)} />;
  }

  return (
    <>
      <TopBar />
      <main className={styles.page}>
        <Link to={backTo} className={styles.back}>
          <IconArrowLeft size={18} className={styles.flip} /> {surah.lesson.title}
        </Link>
        <span className={styles.helloSmall}>{surah.lesson.title}</span>
        <h1 className={styles.helloTitle}>{sectionTitle(section, t)}</h1>

        {(section.reading || []).length > 0 && <Reading blocks={section.reading} />}

        {kind === "quiz" && (
          <div className={`${styles.glassCard} ${styles.startCard}`}>
            <div>
              <b>{t("view.ready", { count: questions.length })}</b>
              <span>{mine?.max ? t("surah.best", { best: mine.best, max: mine.max }) : t("view.readyHint")}</span>
            </div>
            <button type="button" className={styles.primaryBig} onClick={() => setPlaying(true)} disabled={!questions.length}>
              <IconPlayerPlayFilled size={18} /> {mine?.done ? t("view.again") : t("view.start")}
            </button>
          </div>
        )}

        {kind === "reading" && (
          <button
            type="button"
            className={styles.primaryBig}
            disabled={!!mine?.done}
            onClick={() => saveProgress(section, {}).then(() => navigate(backTo))}
          >
            <IconCheck size={18} /> {mine?.done ? t("surah.read") : t("view.haveRead")}
          </button>
        )}

        {kind === "written" && <Written section={section} mine={mine} onSubmit={(answers) => saveProgress(section, { answers }).then(() => navigate(backTo))} />}
      </main>
    </>
  );
}

const isArabic = (s) => {
  const letters = (s || "").replace(/\s/g, "");
  return letters.length > 0 && (s.match(/[؀-ۿ]/g) || []).length > letters.length * 0.5;
};

function Reading({ blocks }) {
  return (
    <div className={`${styles.glassCard} ${styles.reading}`}>
      {blocks.map((b, i) =>
        b.type === "heading" ? (
          <h3 key={i}>{b.text}</h3>
        ) : (
          <p key={i} className={b.type === "arabic" || isArabic(b.text) ? styles.arabic : undefined} dir="auto">
            {b.text}
          </p>
        )
      )}
    </div>
  );
}

function Written({ section, mine, onSubmit }) {
  const { t } = useTranslation(NS);
  const [answers, setAnswers] = useState(() => ({ ...(mine?.answers || {}) }));
  const [busy, setBusy] = useState(false);
  const tasks = section.tasks || [];
  const filled = tasks.every((task) => (answers[task.id] || "").trim());

  return (
    <>
      {section.instructions && <p className={styles.instructions}>{section.instructions}</p>}
      {mine?.note && (
        <div className={styles.noteCard}>
          <IconMessageCircle size={20} />
          <div>
            <b>{t("view.noteFrom", { name: mine.noteBy || "Admin" })}</b>
            <p>{mine.note}</p>
          </div>
        </div>
      )}
      {tasks.map((task, i) => (
        <div key={task.id} className={`${styles.glassCard} ${styles.task}`}>
          <span className={styles.kicker}>{t("view.task", { n: i + 1 })}</span>
          <p className={styles.taskPrompt} dir="auto">
            {task.prompt}
          </p>
          <textarea
            className={styles.textarea}
            rows={Math.max(3, task.lines || 3)}
            dir="auto"
            placeholder={t("view.writeHere")}
            value={answers[task.id] || ""}
            onChange={(e) => setAnswers({ ...answers, [task.id]: e.currentTarget.value.slice(0, 4000) })}
          />
        </div>
      ))}
      <button
        type="button"
        className={styles.primaryBig}
        disabled={!filled || busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onSubmit(answers);
          } finally {
            setBusy(false);
          }
        }}
      >
        <IconCheck size={18} /> {mine?.done ? t("view.resend") : t("view.send")}
      </button>
    </>
  );
}
