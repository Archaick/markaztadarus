import { useMemo, useState } from "react";
import { Button, Progress, Select, Text, Textarea } from "@mantine/core";
import { IconCheck, IconRefresh, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { NS, isArabic, questionsOf, textDir } from "./belajarSchema";
import styles from "./Cards.module.css";


// the same order every time for one question (so a re-render does not reshuffle)
const shuffled = (arr, seed) => {
  const out = arr.map((x, i) => [x, i]);
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * A section as teachers see it: the text to read, then one question per
 * card with instant feedback, a score at the end; written tasks as cards to
 * answer. Used by the admin's preview now and by /guru later.
 */
export default function TeacherCards({ section, title }) {
  const { t } = useTranslation(NS);
  const questions = useMemo(() => questionsOf(section), [section]);
  const [step, setStep] = useState(section.reading?.length ? -1 : 0);
  const [results, setResults] = useState({});

  const restart = () => {
    setResults({});
    setStep(section.reading?.length ? -1 : 0);
  };

  if (section.kind === "written") {
    return (
      <div className={styles.stage}>
        <Reading blocks={section.reading} />
        {section.instructions && <p className={styles.instructions}>{section.instructions}</p>}
        {(section.tasks || []).map((task, i) => (
          <div key={task.id} className={styles.card}>
            <span className={styles.kicker}>{t("sectionPage.task", { n: i + 1 })}</span>
            <p className={styles.stem} dir={textDir(task.prompt)}>
              {task.prompt}
            </p>
            <Textarea autosize minRows={task.lines || 3} placeholder={t("cards.writeHere")} />
          </div>
        ))}
      </div>
    );
  }

  if (step === -1) {
    return (
      <div className={styles.stage}>
        <div className={styles.card}>
          <span className={styles.kicker}>{title}</span>
          <Reading blocks={section.reading} bare />
          <Button color="#003366" size="md" mt="md" fullWidth onClick={() => setStep(0)} disabled={!questions.length}>
            {t("cards.start")}
          </Button>
        </div>
      </div>
    );
  }

  if (!questions.length) return <Text c="dimmed">{t("cards.empty")}</Text>;

  if (step >= questions.length) {
    const right = Object.values(results).filter(Boolean).length;
    const pct = Math.round((right / questions.length) * 100);
    return (
      <div className={styles.stage}>
        <div className={`${styles.card} ${styles.finish}`}>
          <span className={styles.score}>{pct}%</span>
          <p className={styles.stem}>{t("cards.result", { right, total: questions.length })}</p>
          <Button color="#003366" leftSection={<IconRefresh size={18} />} onClick={restart}>
            {t("cards.again")}
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[step];
  return (
    <div className={styles.stage}>
      <div className={styles.top}>
        <span>{t("cards.of", { n: step + 1, total: questions.length })}</span>
        <Progress value={(step / questions.length) * 100} color="#cc9933" style={{ flex: 1 }} radius="xl" />
      </div>
      <QuestionCard key={q.id} q={q} onDone={(ok) => setResults((r) => ({ ...r, [q.id]: ok }))} onNext={() => setStep(step + 1)} />
    </div>
  );
}

function Reading({ blocks, bare = false }) {
  if (!blocks?.length) return null;
  return (
    <div className={bare ? undefined : styles.readingCard}>
      {blocks.map((b, i) =>
        b.type === "heading" ? (
          <h4 key={i} className={styles.readingHeading}>
            {b.text}
          </h4>
        ) : (
          <p key={i} className={b.type === "arabic" ? styles.arabic : styles.readingText} dir={b.type === "arabic" ? "rtl" : textDir(b.text)}>
            {b.text}
          </p>
        )
      )}
    </div>
  );
}

/** One question: pick, check, see what was right, go on. */
function QuestionCard({ q, onDone, onNext }) {
  const { t } = useTranslation(NS);
  const [picked, setPicked] = useState([]);
  const [match, setMatch] = useState(() => q.left?.map(() => null) || []);
  const [checked, setChecked] = useState(null); // null | true | false
  const rightOrder = useMemo(() => (q.type === "match" ? shuffled(q.right || [], q.id) : []), [q]);

  const check = (choice = picked) => {
    let ok;
    if (q.type === "match") ok = match.every((m, k) => m !== null && Number(m) === q.answer[k]);
    else ok = sameSet(choice, q.correct || []);
    setChecked(ok);
    onDone(ok);
  };

  const tap = (k) => {
    if (checked !== null) return;
    if (q.type === "multi") setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
    else {
      setPicked([k]);
      check([k]);
    }
  };

  const optionClass = (k) => {
    const classes = [styles.option];
    if (isArabic(q.options[k])) classes.push(styles.optionArabic);
    if (checked === null) {
      if (picked.includes(k)) classes.push(styles.optionPicked);
    } else if ((q.correct || []).includes(k)) classes.push(styles.optionRight);
    else if (picked.includes(k)) classes.push(styles.optionWrong);
    else classes.push(styles.optionDim);
    return classes.join(" ");
  };

  return (
    <div className={styles.card}>
      <span className={styles.kicker}>{t(`qtype.${q.type}`)}</span>
      <p className={`${styles.stem} ${isArabic(q.stem) ? styles.arabic : ""}`} dir={textDir(q.stem)}>
        {q.stem}
      </p>

      {q.type === "match" ? (
        <div className={styles.matchList}>
          {q.left.map((left, k) => {
            const ok = checked !== null && match[k] !== null && Number(match[k]) === q.answer[k];
            return (
              <div key={k} className={styles.matchRow}>
                <span className={styles.matchLeft} dir={textDir(left)}>
                  {left}
                </span>
                <Select
                  style={{ flex: 1.6 }}
                  placeholder={t("question.pick")}
                  disabled={checked !== null}
                  data={rightOrder.map(([text, i]) => ({ value: String(i), label: text }))}
                  value={match[k] === null ? null : String(match[k])}
                  onChange={(v) => setMatch(match.map((m, j) => (j === k ? v : m)))}
                  error={checked !== null && !ok}
                />
                {checked !== null && (ok ? <IconCheck color="#10b981" /> : <IconX color="#e03131" />)}
              </div>
            );
          })}
          {checked === false && (
            <Text size="sm" mt="xs">
              {t("cards.rightWas")}: {q.left.map((l, k) => `${l} → ${q.right[q.answer[k]] ?? "?"}`).join(" · ")}
            </Text>
          )}
        </div>
      ) : (
        <div className={q.type === "truefalse" ? styles.twoUp : styles.options}>
          {q.options.map((opt, k) => (
            <button key={k} type="button" className={optionClass(k)} onClick={() => tap(k)} dir={textDir(q.options[k])}>
              {q.type !== "truefalse" && <span className={styles.letter}>{String.fromCharCode(65 + k)}</span>}
              <span>{opt}</span>
            </button>
          ))}
        </div>
      )}

      {checked === null && (q.type === "multi" || q.type === "match") && (
        <Button mt="md" color="#003366" fullWidth size="md" onClick={() => check()} disabled={q.type === "multi" ? !picked.length : match.some((m) => m === null)}>
          {t("cards.check")}
        </Button>
      )}

      {checked !== null && (
        <div className={`${styles.feedback} ${checked ? styles.feedbackRight : styles.feedbackWrong}`}>
          <strong>{checked ? t("cards.right") : t("cards.wrong")}</strong>
          {q.explanation && <p>{q.explanation}</p>}
          <Button mt="sm" color={checked ? "teal" : "#003366"} fullWidth onClick={onNext}>
            {t("cards.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
