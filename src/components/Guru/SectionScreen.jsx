import { useCallback, useState } from "react";
import { IconBook2, IconCheck, IconMessageCircle, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { isArabic, kindOf, questionsOf, sectionTitle, textDir } from "../Belajar/belajarSchema";
import ArabicText from "./ArabicText";
import ReadingTable from "./ReadingTable";
import PdfView from "./PdfView";
import styles from "./Guru.module.css";
import dock from "./SectionDock.module.css";

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
  // a PDF must be read to its last page before the questions (or "I have read this") open;
  // a teacher who has finished the section before is not made to read it again
  const tr = useTranslation("guru/Reading").t;
  const [progress, setProgress] = useState({ seen: 0, total: 0 });
  const hasPdf = !!section.pdf?.url;
  const mustRead = hasPdf && !mine?.done && !(progress.total && progress.seen >= progress.total);
  const onProgress = useCallback((seen, total) => setProgress({ seen, total }), []);

  return (
    <>
      {back}
      <span className={styles.helloSmall}>{surahTitle}</span>
      <h1 className={styles.helloTitle}>{sectionTitle(section, t)}</h1>

      {section.pdf?.url ? <PdfView pdf={section.pdf} onProgress={onProgress} /> : (section.reading || []).length > 0 && <Reading blocks={section.reading} />}

      {hasPdf && (kind === "quiz" ? questions.length > 0 : readOnly) && (
        <div className={dock.dock}>
          <div className={dock.bar}>
            <div className={dock.info}>
              <b>{mustRead ? tr("mustRead") : kind === "quiz" && questions.length ? t("view.ready", { count: questions.length }) : tr("done")}</b>
              {mustRead && progress.total > 0 && (
                <span className={dock.track} aria-hidden="true">
                  <span style={{ width: `${(progress.seen / progress.total) * 100}%` }} />
                </span>
              )}
              {mustRead && <span>{tr("pages", { seen: progress.seen, total: progress.total || "…" })}</span>}
            </div>
            {readOnly ? (
              <button type="button" className={dock.go} disabled={mustRead || !!mine?.done} onClick={onRead}>
                {mustRead ? <IconBook2 size={18} /> : <IconCheck size={18} />} {mine?.done ? t("surah.read") : t("view.haveRead")}
              </button>
            ) : (
              <button type="button" className={dock.go} disabled={mustRead} onClick={onStart}>
                {mustRead ? <IconBook2 size={18} /> : <IconPlayerPlayFilled size={18} />} {mine?.done ? t("view.again") : t("view.start")}
              </button>
            )}
          </div>
        </div>
      )}

      {!hasPdf && kind === "quiz" && questions.length > 0 && (
        <div>
          <div className={`${styles.glassCard} ${styles.startCard}`}>
            <div>
              <b>{t("view.ready", { count: questions.length })}</b>
              <span>{mine?.max ? t("surah.best", { best: mine.best, max: mine.max }) : t("view.readyHint")}</span>
            </div>
            <button type="button" className={styles.primaryBig} onClick={onStart}>
              <IconPlayerPlayFilled size={18} /> {mine?.done ? t("view.again") : t("view.start")}
            </button>
          </div>
        </div>
      )}

      {!hasPdf && readOnly && (
        <div>
          <button type="button" className={styles.primaryBig} disabled={!!mine?.done} onClick={onRead}>
            <IconCheck size={18} /> {mine?.done ? t("surah.read") : t("view.haveRead")}
          </button>
        </div>
      )}

      {kind === "written" && <Written section={section} mine={mine} onSubmit={onWritten} />}
    </>
  );
}

function Reading({ blocks }) {
  return (
    <div className={`${styles.glassCard} ${styles.reading}`}>
      {blocks.map((b, i) =>
        b.type === "table" ? (
          <ReadingTable key={i} block={b} />
        ) : b.type === "heading" ? (
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
