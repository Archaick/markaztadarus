import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IconCheck, IconClock, IconRefresh, IconStarFilled, IconTarget, IconVolume, IconVolumeOff, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { isArabic, questionsOf, textDir } from "../Belajar/belajarSchema";
import { play, setSoundOn, soundOn } from "./sounds";
import Sky, { FIVE_COLOR, fiveNames, quizShares, sharesOf } from "./Sky";
import styles from "./Guru.module.css";

const NS = "guru/Guru";
const RETRY_GAP = 2; // a missed question comes back this many questions later
// how long the sheet stays before going on by itself (ms); an explanation adds time to read it
const AUTO_NEXT = { right: 1600, wrong: 4500, note: 2500 };

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
export default function Player({ section, title, guide, onFinish, onExit }) {
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
  const [sound, setSound] = useState(soundOn);
  const [hold, setHold] = useState(false); // tapped the sheet: wait for "Lanjut"
  const [fired, setFired] = useState(null); // the question whose beam just went out
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
    setHold(false);
  };

  const mark = useCallback(
    (ok) => {
      setFirst((f) => (qi in f ? f : { ...f, [qi]: ok }));
      if (ok) {
        setSolved((s) => new Set(s).add(qi));
        setFired(questions[qi].id);
      }
      else setQueue((list) => [...list.slice(0, pos + 1 + RETRY_GAP), qi, ...list.slice(pos + 1 + RETRY_GAP)]);
      play(ok ? "right" : "wrong");
      const words = Array.isArray(praises) ? praises : ["✓"];
      setVerdict({ ok, praise: words[Math.floor(Math.random() * words.length)] });
    },
    [qi, pos, praises, questions]
  );

  const finish = useCallback(() => {
    const score = Object.values(first).filter(Boolean).length;
    const result = { score, max: questions.filter((x) => x.type !== "task").length, seconds: Math.round((Date.now() - started.current) / 1000) };
    setEnded(result);
    play(result.max && result.score / result.max >= 0.7 ? "great" : "done");
    if (!saved.current) {
      saved.current = true;
      onFinish?.(result);
    }
  }, [first, questions, onFinish]);

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

  const without = (k) => Object.fromEntries(Object.entries(pairs).filter(([left]) => Number(left) !== k));

  // tapping a paired item on the left takes it back and makes it the one to place again
  const tapLeft = (k) => {
    if (verdict) return;
    if (pairs[k] !== undefined) setPairs(without(k));
    setLeftOn(k);
  };

  const tapRight = (j) => {
    if (verdict) return;
    const owner = Object.keys(pairs).find((k) => pairs[k] === j);
    // nothing being placed, or tapping the pair of the one being placed: take that pair back
    if (owner !== undefined && (leftOn === null || Number(owner) === leftOn)) {
      setPairs(without(Number(owner)));
      setLeftOn(Number(owner));
      return;
    }
    if (leftOn === null) return;
    const clean = Object.fromEntries(Object.entries(pairs).filter(([, v]) => v !== j));
    setPairs({ ...clean, [leftOn]: j });
    const nextFree = q.left.findIndex((_, k) => k !== leftOn && clean[k] === undefined);
    setLeftOn(nextFree >= 0 ? nextFree : null);
  };

  // after a short moment the sheet goes on by itself (unless tapped to stay)
  const nextRef = useRef(next);
  nextRef.current = next;
  const wait = verdict ? (verdict.ok ? AUTO_NEXT.right : AUTO_NEXT.wrong) + (q?.explanation ? AUTO_NEXT.note : 0) : 0;
  useEffect(() => {
    if (!verdict || hold) return undefined;
    const id = setTimeout(() => nextRef.current(), wait);
    return () => clearTimeout(id);
  }, [verdict, hold, wait]);

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
      if (!verdict && n >= 1 && n <= 6 && q && q.type !== "match" && q.type !== "task" && n <= q.options.length) tap(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // the player is the whole screen: only it scrolls, not the page behind it
  useEffect(() => {
    const { documentElement: html, body } = document;
    const before = [html.style.overflow, body.style.overflow];
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      [html.style.overflow, body.style.overflow] = before;
    };
  }, []);

  // in match questions, start with the first row ready
  useEffect(() => {
    if (q?.type === "match") setLeftOn(0);
  }, [q]);

  if (!questions.length) return null;

  // the sky: real progress through the surah, or (in an admin preview) through these questions
  const frac = solved.size / questions.length;
  const steps = guide?.steps || [];
  const firedQuestion = fired ? questions.find((x) => x.id === fired) : null;
  const sky = (
    <Sky
      className={styles.skyFull}
      label={title}
      names={fiveNames(t)}
      shares={guide ? quizShares(steps, guide.sectionId, frac) : sharesOf(questions.map((x, i) => ({ t: x.fiveT, done: solved.has(i) })))}
      progress={steps.length ? steps.reduce((n, x) => n + (x.state === "done" ? 1 : x.section.id === guide.sectionId ? frac : 0), 0) / steps.length : frac}
      fireKey={fired}
      fireT={firedQuestion ? firedQuestion.fiveT || guide?.tag : undefined}
      celebrate={!!ended}
    />
  );

  if (ended) {
    const pct = ended.max ? Math.round((ended.score / ended.max) * 100) : 100;
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct > 0 ? 1 : 0;
    const time = `${Math.floor(ended.seconds / 60)}:${String(ended.seconds % 60).padStart(2, "0")}`;
    return (
      <div className={`${styles.player} ${styles.skyOn}`}>
      {sky}
        <div className={styles.endWrap}>
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
              setFired(null);
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
    <div className={`${styles.player} ${styles.skyOn}`}>
      {sky}
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
        <button
          type="button"
          className={styles.close}
          aria-label={t(sound ? "player.soundOff" : "player.soundOn")}
          title={t(sound ? "player.soundOff" : "player.soundOn")}
          onClick={() => {
            setSoundOn(!sound);
            setSound(!sound);
          }}
        >
          {sound ? <IconVolume size={21} /> : <IconVolumeOff size={21} />}
        </button>
      </div>

      <div className={`${styles.stage} ${["task", "multi", "match"].includes(q.type) ? styles.stageBar : ""}`} key={`${pos}-${qi}`}>
        <div className={styles.kickerRow}>
          <span className={styles.kicker}>{!verdict && first[qi] === false ? t("player.tryAgain") : t(`qtype.${q.type}`)}</span>
          {(q.fiveT || guide?.tag) && (
            <span className={styles.kickerFive} style={{ "--c": FIVE_COLOR[q.fiveT || guide.tag] }}>
              {t(`fiveT.${q.fiveT || guide.tag}`)}
            </span>
          )}
        </div>
        <p className={`${styles.stem} ${isArabic(q.stem) ? styles.arabic : ""}`} dir={textDir(q.stem)}>
          {q.stem}
        </p>

        {q.type === "task" ? (
          <textarea className={styles.taskBox} rows={Math.max(3, q.lines || 3)} placeholder={t("player.writeHere")} dir="auto" />
        ) : q.type === "match" ? (
          <>
            <MatchBoard q={q} order={order} pairs={pairs} leftOn={leftOn} verdict={verdict} onLeft={tapLeft} onRight={tapRight} />
            {!verdict && Object.keys(pairs).length > 0 && <p className={styles.matchHint}>{t("player.matchUndo")}</p>}
          </>
        ) : (
          <div className={q.type === "truefalse" ? styles.twoUp : styles.options}>
            {q.options.map((opt, k) => (
              <button key={k} type="button" className={optionClass(k)} onClick={() => tap(k)} dir={textDir(opt)}>
                {q.type !== "truefalse" && <span className={`${styles.letter} ${q.type === "multi" ? styles.letterBox : ""}`}>{q.type === "multi" ? (picked.includes(k) || (verdict && q.correct.includes(k)) ? "✓" : "") : String.fromCharCode(65 + k)}</span>}
                <span>{opt}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {q.type === "task" && (
        <div className={styles.checkBar}>
          <button
            type="button"
            className={styles.primaryBig}
            onClick={() => {
              setSolved((x) => new Set(x).add(qi));
              setFired(q.id);
              play("right");
              setTimeout(next, 750);
            }}
          >
            {t("player.continue")}
          </button>
        </div>
      )}

      {!verdict && (q.type === "multi" || q.type === "match") && (
        <div className={styles.checkBar}>
          <button type="button" className={styles.primaryBig} disabled={!ready} onClick={checkNow}>
            {t("player.check")}
          </button>
        </div>
      )}

      {verdict && (
        <div className={`${styles.sheet} ${verdict.ok ? styles.sheetRight : styles.sheetWrong}`} role="status" onPointerDown={(e) => !e.target.closest("button") && setHold(true)}>
          <div className={styles.sheetHead}>
            <span className={styles.sheetIcon}>{verdict.ok ? <IconCheck size={22} /> : <IconX size={22} />}</span>
            <strong>{verdict.ok ? verdict.praise : t("player.notQuite")}</strong>
          </div>
          {!verdict.ok && (
            <div className={styles.sheetBody}>
              <span>{t("player.correctIs")}</span>
              <p className={isArabic(rightText) ? styles.arabicSmall : undefined} dir={textDir(rightText)}>
                {rightText}
              </p>
            </div>
          )}
          {q.explanation && <p className={styles.sheetNote}>{q.explanation}</p>}
          {!verdict.ok && <p className={styles.sheetLater}>{t("player.comesBack")}</p>}
          <button type="button" className={styles.sheetButton} onClick={next} autoFocus>
            {!hold && <span className={styles.sheetTimer} style={{ animationDuration: `${wait}ms` }} aria-hidden="true" />}
            <span className={styles.sheetLabel}>{t("player.continue")}</span>
          </button>
          {!hold && <p className={styles.sheetHint}>{t("player.tapToStay")}</p>}
        </div>
      )}
    </div>
  );
}

// one colour per pair, so each left item and its chosen match share it
const PAIR_COLORS = ["#3b82f6", "#f59e0b", "#ec4899", "#10b981", "#8b5cf6", "#f97316"];

/**
 * Matching: tap a left item, then its match on the right. Each pair takes its
 * own colour and a curved line draws itself between the two; after checking,
 * the lines turn green (right) or red (wrong).
 */
function MatchBoard({ q, order, pairs, leftOn, verdict, onLeft, onRight }) {
  const box = useRef(null);
  const lefts = useRef([]);
  const rights = useRef([]);
  const [lines, setLines] = useState([]);

  const measure = useCallback(() => {
    const root = box.current;
    if (!root) return;
    const o = root.getBoundingClientRect();
    const rtl = getComputedStyle(root).direction === "rtl";
    setLines(
      Object.entries(pairs).flatMap(([k, j]) => {
        const a = lefts.current[k]?.getBoundingClientRect();
        const b = rights.current[j]?.getBoundingClientRect();
        if (!a || !b) return [];
        const x1 = (rtl ? a.left : a.right) - o.left;
        const x2 = (rtl ? b.right : b.left) - o.left;
        const y1 = a.top + a.height / 2 - o.top;
        const y2 = b.top + b.height / 2 - o.top;
        const mid = (x1 + x2) / 2;
        return [{ k: Number(k), j, d: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}` }];
      })
    );
  }, [pairs]);

  useLayoutEffect(measure, [measure, verdict]);
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [measure]);

  const colorOf = (k) => PAIR_COLORS[k % PAIR_COLORS.length];
  const judged = (k) => (verdict ? (pairs[k] === q.answer[k] ? "var(--ok)" : "var(--bad)") : colorOf(k));

  return (
    <div className={styles.match} ref={box}>
      <svg className={styles.matchLines} aria-hidden="true">
        {lines.map((l) => (
          <g key={`${l.k}-${l.j}`}>
            <path d={l.d} className={styles.matchHalo} />
            <path d={l.d} pathLength="1" className={`${styles.matchLine} ${verdict && pairs[l.k] !== q.answer[l.k] ? styles.matchLineWrong : ""}`} style={{ stroke: judged(l.k) }} />
          </g>
        ))}
      </svg>
      <div className={styles.matchCol}>
        {q.left.map((l, k) => {
          const paired = pairs[k] !== undefined;
          return (
            <button
              type="button"
              key={k}
              ref={(el) => (lefts.current[k] = el)}
              dir={textDir(l)}
              style={{ "--pc": judged(k) }}
              className={`${styles.chip} ${styles.chipColored} ${leftOn === k ? styles.chipOn : ""} ${paired ? styles.chipFilled : ""}`}
              onClick={() => onLeft(k)}
            >
              <span className={styles.pairNo}>{k + 1}</span>
              {l}
            </button>
          );
        })}
      </div>
      <div className={styles.matchCol}>
        {order.map((j) => {
          const by = Object.keys(pairs).find((k) => pairs[k] === j);
          const k = by === undefined ? null : Number(by);
          return (
            <button
              type="button"
              key={j}
              ref={(el) => (rights.current[j] = el)}
              dir={textDir(q.right[j])}
              style={k === null ? undefined : { "--pc": judged(k) }}
              className={`${styles.chip} ${k === null ? "" : `${styles.chipColored} ${styles.chipFilled}`}`}
              onClick={() => onRight(j)}
            >
              <span className={`${styles.pairNo} ${k === null ? styles.pairNoEmpty : ""}`}>{k === null ? "" : k + 1}</span>
              {q.right[j]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
