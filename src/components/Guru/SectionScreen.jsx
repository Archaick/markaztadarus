import { useState } from "react";
import { IconCheck, IconMessageCircle, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { isArabic, kindOf, questionsOf, sectionTitle, textDir } from "../Belajar/belajarSchema";
import ArabicText from "./ArabicText";
import styles from "./Guru.module.css";

const NS = "guru/Guru";

/**
 * What a teacher sees on opening one section: its reading, then the button to
 * start the questions, confirm the reading, or the written tasks. The admin's
 * "try as a teacher" shows this same screen, so the two cannot drift apart.
 */
export default function SectionScreen({ section, surahTitle, back, mine, onStart, onRead, onWritten }) {
  const { t } = useTranslation(NS);
  const kind = kindOf(section);
  const questions = questionsOf(section);
  // a question section that so far has only its reading must not block the sections after it
  const readOnly = kind === "reading" || (kind === "quiz" && !questions.length);

  return (
    <>
      {back}
      <span className={styles.helloSmall}>{surahTitle}</span>
      <h1 className={styles.helloTitle}>{sectionTitle(section, t)}</h1>

      {(section.reading || []).length > 0 && <Reading blocks={section.reading} />}

      {kind === "quiz" && questions.length > 0 && (
        <div className={`${styles.glassCard} ${styles.startCard}`}>
          <div>
            <b>{t("view.ready", { count: questions.length })}</b>
            <span>{mine?.max ? t("surah.best", { best: mine.best, max: mine.max }) : t("view.readyHint")}</span>
          </div>
          <button type="button" className={styles.primaryBig} onClick={onStart}>
            <IconPlayerPlayFilled size={18} /> {mine?.done ? t("view.again") : t("view.start")}
          </button>
        </div>
      )}

      {readOnly && (
        <button type="button" className={styles.primaryBig} disabled={!!mine?.done} onClick={onRead}>
          <IconCheck size={18} /> {mine?.done ? t("surah.read") : t("view.haveRead")}
        </button>
      )}

      {kind === "written" && <Written section={section} mine={mine} onSubmit={onWritten} />}
    </>
  );
}

function Reading({ blocks }) {
  return (
    <div className={`${styles.glassCard} ${styles.reading}`}>
      {blocks.map((b, i) =>
        b.type === "heading" ? (
          <h3 key={i}>{b.text}</h3>
        ) : (
          <p key={i} className={b.type === "arabic" || isArabic(b.text) ? styles.arabic : undefined} dir={b.type === "arabic" ? "rtl" : textDir(b.text)}>
            {b.type === "arabic" ? b.text : <ArabicText text={b.text} />}
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
          <p className={styles.taskPrompt} dir={textDir(task.prompt)}>
            <ArabicText text={task.prompt} />
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
