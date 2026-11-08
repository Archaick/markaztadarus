import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconCheck, IconClock, IconRefresh, IconStarFilled, IconTarget, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { questionsOf } from "../Belajar/belajarSchema";
import styles from "./Guru.module.css";

const NS = "guru/Guru";
const RETRY_GAP = 2; // a missed question comes back this many questions later

const isArabic = (s) => {
  const letters = (s || "").replace(/\s/g, "");
  return letters.length > 0 && (s.match(/[؀-ۿ]/g) || []).length > letters.length * 0.5;
};

// the same shuffle for one question every time it shows
const shuffle = (n, seed) => {
  const out = Array.from({ length: n }, (_, i) => i);
  let h = 7;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  for (let i = n - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * The practice player: full screen, one question at a time, marked the
 * moment it is answered. A sheet slides up (green with praise, or red with
 * the right answer and the explanation); a missed question comes back a
 * little later until it is right; the score counts first tries. The end
 * shows stars, accuracy and time. `onFinish({ score, max })` saves it.
 */
export default function Player({ section, title, onFinish, onExit }) {
  const { t } = useTranslation(NS);
  const questions = useMemo(() => questionsOf(section), [section]);
  const [queue, setQueue] = useState(() => questions.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [first, setFirst] = useState({}); // question index → right on the first try
  const [solved, setSolved] = useState(() => new Set());
  const [picked, setPicked] = useState([]);
  const [pairs, setPairs] = useState({}); // left index → right index
  const [leftOn, setLeftOn] = useState(null);
  const [verdict, setVerdict] = useState(null); // null | { ok, praise }
  const [ended, setEnded] = useState(null);
  const started = useRef(Date.now());
  const saved = useRef(false);

  const qi = queue[pos];
  const q = questions[qi];
  const order = useMemo(() => (q?.type === "match" ? shuffle(q.right.length, q.id) : []), [q]);
  const praises = t("player.praise", { returnObjects: true });

  const reset = () => {
    setPicked([]);
    setPairs({});
    setLeftOn(null);
    setVerdict(null);
  };

  const mark = useCallback(
    (ok) => {
      setFirst((f) => (qi in f ? f : { ...f, [qi]: ok }));
      if (ok) setSolved((s) => new Set(s).add(qi));
      else setQueue((list) => [...list.slice(0, pos + 1 + RETRY_GAP), qi, ...list.slice(pos + 1 + RETRY_GAP)]);
      const words = Array.isArray(praises) ? praises : ["✓"];
      setVerdict({ ok, praise: words[Math.floor(Math.random() * words.length)] });
    },
    [qi, pos, praises]
  );

  const finish = useCallback(() => {
    const score = Object.values(first).filter(Boolean).length;
    const result = { score, max: questions.length, seconds: Math.round((Date.now() - started.current) / 1000) };
    setEnded(result);
    if (!saved.current) {
      saved.current = true;
      onFinish?.(result);
    }
  }, [first, questions.length, onFinish]);

  const next = useCallback(() => {
    reset();
    if (pos + 1 >= queue.length) finish();
    else setPos(pos + 1);
  }, [pos, queue.length, finish]);

  const tap = (k) => {
    if (verdict) return;
    if (q.type === "multi") setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
    else {
      setPicked([k]);
      mark(sameSet([k], q.correct || []));
    }
  };

  const checkNow = () => {
    if (q.type === "match") mark(q.left.every((_, k) => pairs[k] === q.answer[k]));
    else mark(sameSet(picked, q.correct || []));
  };

  const tapRight = (j) => {
    if (verdict || leftOn === null) return;
    const clean = Object.fromEntries(Object.entries(pairs).filter(([, v]) => v !== j));
    setPairs({ ...clean, [leftOn]: j });
    const nextFree = q.left.findIndex((_, k) => k !== leftOn && clean[k] === undefined);
    setLeftOn(nextFree >= 0 ? nextFree : null);
  };

  // keys: 1–6 pick, Enter checks or goes on, Esc leaves
  useEffect(() => {
    const onKey = (e) => {
      if (ended) return;
      if (e.key === "Escape") onExit?.();
      if (e.key === "Enter") {
        if (verdict) next();
        else if (q?.type === "multi" && picked.length) checkNow();
      }
      const n = Number(e.key);
      if (!verdict && n >= 1 && n <= 6 && q && q.type !== "match" && n <= q.options.length) tap(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // in match questions, start with the first row ready
  useEffect(() => {
    if (q?.type === "match") setLeftOn(0);
  }, [q]);

  if (!questions.length) return null;

  if (ended) {
    const pct = Math.round((ended.score / ended.max) * 100);
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct > 0 ? 1 : 0;
    const time = `${Math.floor(ended.seconds / 60)}:${String(ended.seconds % 60).padStart(2, "0")}`;
    return (
      <div className={styles.player}>
        <div className={styles.endWrap}>
          <div className={styles.burst} aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ "--i": i }} />
            ))}
          </div>
          <div className={styles.stars}>
            {[0, 1, 2].map((i) => (
              <IconStarFilled key={i} className={i < stars ? styles.starOn : styles.starOff} style={{ animationDelay: `${0.25 + i * 0.18}s` }} />
            ))}
          </div>
          <h2 className={styles.endTitle}>{t(stars === 3 ? "player.endGreat" : stars === 2 ? "player.endGood" : "player.endKeep")}</h2>
          <p className={styles.endSub}>{title}</p>
          <div className={styles.tiles}>
            <div className={styles.tile}>
              <IconCheck size={18} />
              <b>
                {ended.score}/{ended.max}
              </b>
              <span>{t("player.right")}</span>
            </div>
            <div className={styles.tile}>
              <IconTarget size={18} />
              <b>{pct}%</b>
              <span>{t("player.accuracy")}</span>
            </div>
            <div className={styles.tile}>
              <IconClock size={18} />
              <b>{time}</b>
              <span>{t("player.time")}</span>
            </div>
          </div>
          <button type="button" className={styles.primaryBig} onClick={onExit}>
            {t("player.done")}
          </button>
          <button
            type="button"
            className={styles.ghostBig}
            onClick={() => {
              setQueue(questions.map((_, i) => i));
              setPos(0);
              setFirst({});
              setSolved(new Set());
              reset();
              setEnded(null);
              started.current = Date.now();
              saved.current = false;
            }}
          >
            <IconRefresh size={18} /> {t("player.again")}
          </button>
        </div>
      </div>
    );
  }

  const optionClass = (k) => {
    const c = [styles.option];
    if (isArabic(q.options[k])) c.push(styles.optionArabic);
    if (!verdict) {
      if (picked.includes(k)) c.push(styles.optionPicked);
    } else if ((q.correct || []).includes(k)) c.push(styles.optionRight);
    else if (picked.includes(k)) c.push(styles.optionWrong);
    else c.push(styles.optionDim);
    return c.join(" ");
  };
  const ready = q.type === "multi" ? picked.length > 0 : q.type === "match" ? q.left.every((_, k) => pairs[k] !== undefined) : false;
  const rightText = q.type === "match" ? q.left.map((l, k) => `${l} → ${q.right[q.answer[k]] ?? "?"}`).join("\n") : (q.correct || []).map((k) => q.options[k]).join("\n");

  return (
    <div className={styles.player}>
      <div className={styles.playerTop}>
        <button type="button" className={styles.close} onClick={onExit} aria-label={t("player.exit")}>
          <IconX size={22} />
        </button>
        <div className={styles.bar}>
          <span style={{ width: `${(solved.size / questions.length) * 100}%` }} />
        </div>
        <span className={styles.count}>
          {solved.size}/{questions.length}
        </span>
      </div>

      <div className={styles.stage} key={`${pos}-${qi}`}>
        <span className={styles.kicker}>{!verdict && first[qi] === false ? t("player.tryAgain") : t(`qtype.${q.type}`)}</span>
        <p className={`${styles.stem} ${isArabic(q.stem) ? styles.arabic : ""}`} dir="auto">
          {q.stem}
        </p>

        {q.type === "match" ? (
          <div className={styles.match}>
            <div className={styles.matchCol}>
              {q.left.map((l, k) => (
                <button
                  type="button"
                  key={k}
                  dir="auto"
                  className={`${styles.chip} ${leftOn === k ? styles.chipOn : ""} ${pairs[k] !== undefined ? styles.chipPaired : ""} ${verdict ? (pairs[k] === q.answer[k] ? styles.chipRight : styles.chipWrong) : ""}`}
                  onClick={() => !verdict && setLeftOn(k)}
                >
                  {pairs[k] !== undefined && <span className={styles.pairNo}>{order.indexOf(pairs[k]) + 1}</span>}
                  {l}
                </button>
              ))}
            </div>
            <div className={styles.matchCol}>
              {order.map((j, n) => {
                const usedBy = Object.keys(pairs).find((k) => pairs[k] === j);
                return (
                  <button type="button" key={j} dir="auto" className={`${styles.chip} ${usedBy !== undefined ? styles.chipPaired : ""}`} onClick={() => tapRight(j)}>
                    <span className={styles.pairNo}>{n + 1}</span>
                    {q.right[j]}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={q.type === "truefalse" ? styles.twoUp : styles.options}>
            {q.options.map((opt, k) => (
              <button key={k} type="button" className={optionClass(k)} onClick={() => tap(k)} dir="auto">
                {q.type !== "truefalse" && <span className={styles.letter}>{q.type === "multi" ? (picked.includes(k) || (verdict && q.correct.includes(k)) ? "✓" : "") : String.fromCharCode(65 + k)}</span>}
                <span>{opt}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!verdict && (q.type === "multi" || q.type === "match") && (
        <div className={styles.checkBar}>
          <button type="button" className={styles.primaryBig} disabled={!ready} onClick={checkNow}>
            {t("player.check")}
          </button>
        </div>
      )}

      {verdict && (
        <div className={`${styles.sheet} ${verdict.ok ? styles.sheetRight : styles.sheetWrong}`} role="status">
          <div className={styles.sheetHead}>
            <span className={styles.sheetIcon}>{verdict.ok ? <IconCheck size={22} /> : <IconX size={22} />}</span>
            <strong>{verdict.ok ? verdict.praise : t("player.notQuite")}</strong>
          </div>
          {!verdict.ok && (
            <div className={styles.sheetBody}>
              <span>{t("player.correctIs")}</span>
              <p className={isArabic(rightText) ? styles.arabicSmall : undefined} dir="auto">
                {rightText}
              </p>
            </div>
          )}
          {q.explanation && <p className={styles.sheetNote}>{q.explanation}</p>}
          {!verdict.ok && <p className={styles.sheetLater}>{t("player.comesBack")}</p>}
          <button type="button" className={styles.sheetButton} onClick={next} autoFocus>
            {t("player.continue")}
          </button>
        </div>
      )}
    </div>
  );
}
