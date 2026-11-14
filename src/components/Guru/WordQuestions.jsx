import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { GAP_RE, BLANK_RE, bankOf, isArabic, keyOf, markedParts, textDir } from "../Belajar/belajarSchema";
import { shuffle } from "./wordLogic";
import styles from "./Guru.module.css";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // ease-out: quick start, soft landing
const FLIGHT_MS = 380;
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The words of one question, flying. Each word in the bank and each slot is
 * a button that stays in the page; a move changes only which slot holds which
 * word. Before the change every button's place is measured; after it (before
 * the screen paints) a copy of the word's new button is laid over the page at
 * its new place, shifted back to where the word was, and slid home
 * (FLIP: first, last, invert, play). The real button stays hidden until the
 * copy lands, so the word is seen leaving its place and arriving in the other.
 * Buttons that only shifted because of it (a gap getting wider) glide too.
 */
function useFlights(slots) {
  const els = useRef(new Map()); // "b3" (word 3 in the bank) or "s1" (slot 1) → its button
  const pending = useRef(null);
  const live = useRef(new Map()); // button → the copy flying to it
  const root = useRef(null);

  const reg = (id) => (el) => {
    if (el) els.current.set(id, el);
    else els.current.delete(id);
  };

  /** Call just before the change: the word leaves `fromId` for `toId`. */
  const prepare = (fromId, toId) => {
    if (reducedMotion()) return;
    const rects = new Map();
    els.current.forEach((el, id) => rects.set(id, el.getBoundingClientRect()));
    const fromEl = els.current.get(fromId);
    // a word sent back while still in the air leaves from where it is now
    const flying = live.current.get(fromEl);
    const from = flying ? flying.ghost.getBoundingClientRect() : rects.get(fromId);
    if (flying) flying.anim.cancel();
    pending.current = { rects, from, to: toId };
  };

  useLayoutEffect(() => {
    const p = pending.current;
    pending.current = null;
    if (!p) return;
    els.current.forEach((el, id) => {
      if (id === p.to) return;
      const was = p.rects.get(id);
      if (!was) return;
      const now = el.getBoundingClientRect();
      const dx = was.left - now.left;
      const dy = was.top - now.top;
      if (Math.abs(dx) + Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 300, easing: EASE });
    });
    const el = els.current.get(p.to);
    if (!el || !p.from) return;
    const to = el.getBoundingClientRect();
    const dx = p.from.left - to.left;
    const dy = p.from.top - to.top;
    if (Math.abs(dx) + Math.abs(dy) < 1 || !to.width) return;
    const sx = p.from.width / to.width;
    const sy = p.from.height / to.height;
    const ghost = el.cloneNode(true);
    ghost.removeAttribute("id");
    ghost.setAttribute("aria-hidden", "true");
    ghost.tabIndex = -1;
    ghost.classList.add(styles.wordGhost);
    Object.assign(ghost.style, { position: "fixed", left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px`, margin: "0", transformOrigin: "0 0", visibility: "visible" });
    // the player itself, so no card's blur or scroll box can clip or shift the flight
    const host = root.current?.closest(`.${styles.player}`) || document.body;
    host.appendChild(ghost);
    el.style.visibility = "hidden";
    const anim = ghost.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - Math.min(28, Math.abs(dx) * 0.08 + 10)}px) scale(1.06)`, offset: 0.45 },
        { transform: "none" },
      ],
      { duration: FLIGHT_MS, easing: EASE }
    );
    // if the page stops painting (a hidden tab), the word still lands
    const safety = setTimeout(() => done(), FLIGHT_MS + 400);
    const done = () => {
      clearTimeout(safety);
      ghost.remove();
      el.style.visibility = "";
      if (live.current.get(el)?.ghost === ghost) live.current.delete(el);
    };
    anim.onfinish = done;
    anim.oncancel = done;
    live.current.set(el, { ghost, anim });
  }, [slots]);

  // a question left mid-flight takes its flying words with it
  useEffect(() => {
    const flights = live.current;
    return () => flights.forEach(({ anim }) => anim.cancel());
  }, []);

  return { reg, prepare, root };
}

/**
 * Fill in the Blanks (the words go into the gaps of a sentence) and Word
 * Ordering (the words go into a row of numbered slots). Tap a word in the
 * bank: it flies to the first empty place; tap a placed word: it flies back.
 * The bank keeps an outline where a word was, so nothing in it jumps.
 * `slots`: one bank index (or null) per place.
 */
export function WordBank({ q, slots, onChange, verdict, preview, t }) {
  const bank = useMemo(() => bankOf(q), [q]);
  const key = useMemo(() => keyOf(q), [q]);
  const order = useMemo(() => {
    const o = shuffle(bank.length, q.id || "q");
    // never deal the words already in their right order
    const solved = key.length > 1 && o.filter((b) => b < key.length).every((b, i) => b === i);
    return solved ? [...o].reverse() : o;
  }, [bank.length, key.length, q.id]);
  const { reg, prepare, root } = useFlights(slots);
  const dir = q.type === "order" ? (q.dir === "ltr" ? "ltr" : "rtl") : textDir(q.sentence);
  const used = new Set(slots.filter((x) => x !== null && x !== undefined));
  const locked = !!verdict;

  const place = (b) => {
    if (locked || used.has(b)) return;
    const i = slots.findIndex((x) => x === null || x === undefined);
    if (i < 0) return;
    prepare(`b${b}`, `s${i}`);
    onChange(slots.map((x, j) => (j === i ? b : x)));
  };
  const takeBack = (i) => {
    const b = slots[i];
    if (locked || b === null || b === undefined) return;
    prepare(`s${i}`, `b${b}`);
    onChange(slots.map((x, j) => (j === i ? null : x)));
  };

  const wordClass = (w) => `${styles.word} ${isArabic(w) ? styles.wordArabic : ""}`;
  const slot = (i) => {
    const b = slots[i];
    const has = b !== null && b !== undefined;
    const w = has ? bank[b] : "";
    const judged = verdict ? (w === key[i] ? styles.slotRight : styles.slotWrong) : "";
    return (
      <button
        key={i}
        type="button"
        ref={reg(`s${i}`)}
        dir={has ? textDir(w) : undefined}
        className={has ? `${wordClass(w)} ${styles.slotFilled} ${judged}` : `${styles.slot} ${verdict ? styles.slotWrong : ""}`}
        onClick={() => takeBack(i)}
        disabled={locked || !has}
        aria-label={has ? t("player.slotFilled", { n: i + 1, word: w }) : t("player.slotEmpty", { n: i + 1 })}
      >
        {has ? w : <span className={styles.slotNo}>{i + 1}</span>}
      </button>
    );
  };

  return (
    <div className={styles.words} ref={root}>
      {q.type === "fillblank" ? (
        <p className={`${styles.wordSentence} ${isArabic((q.sentence || "").replace(/_+/g, "")) ? styles.wordSentenceArabic : ""}`} dir={dir}>
          {(q.sentence || "").split(BLANK_RE).map((part, i, all) => (
            <Fragment key={i}>
              <span>{part}</span>
              {i < all.length - 1 && i < slots.length && slot(i)}
            </Fragment>
          ))}
        </p>
      ) : (
        <div className={styles.slotRow} dir={dir}>
          {slots.map((_, i) => slot(i))}
        </div>
      )}

      <div className={styles.bankLabel}>{t("player.bank")}</div>
      <div className={styles.bank} dir={dir}>
        {order.map((b) => {
          const gone = used.has(b);
          return (
            <button
              key={b}
              type="button"
              ref={reg(`b${b}`)}
              dir={textDir(bank[b])}
              className={`${wordClass(bank[b])} ${gone ? styles.wordGap : ""} ${preview && !verdict && !gone && b < key.length ? styles.wordKey : ""}`}
              onClick={() => place(b)}
              disabled={locked || gone}
              aria-hidden={gone || undefined}
              tabIndex={gone ? -1 : undefined}
            >
              {bank[b]}
            </button>
          );
        })}
      </div>
      {!verdict && used.size > 0 && <p className={styles.matchHint}>{t("player.wordUndo")}</p>}
    </div>
  );
}

// a pen circle: one loop that overshoots where it started, as drawn by hand
const PEN = "M52 4 C80 3 98 13 97 26 C96 41 72 48 48 47 C22 46 3 38 4 24 C5 11 25 3 58 6";
const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

function Marked({ text }) {
  return markedParts(text).map((p, k) => (p.bold ? <b key={k} className={styles.marked}>{p.text}</b> : <Fragment key={k}>{p.text}</Fragment>));
}

/**
 * Circle the Word: numbered rows, each a sentence with a gap and two to four
 * words. "circle": the words beside the sentence, a pen circle round the one
 * tapped. "underline": the words inside the sentence, "( a / b )", the one
 * tapped underlined. `picks`: row → word index.
 */
export function CircleRows({ q, picks, onPick, verdict, preview, readOnly, t }) {
  const underline = q.mode === "underline";
  const locked = readOnly || !!verdict;
  return (
    <div className={styles.rows}>
      {(q.rows || []).map((r, row) => {
        const chosen = picks?.[row];
        const options = r.options || [];
        const rtl = textDir(r.sentence || options.join(" ")) === "rtl";
        const parts = (r.sentence || "").split(GAP_RE);
        const inside = underline && parts.length > 1;
        const state = (k) => {
          if (verdict) {
            if (chosen === k) return k === r.correct ? "right" : "wrong";
            return k === r.correct ? "missed" : null;
          }
          if (chosen === k) return "on";
          return preview && k === r.correct ? "missed" : null;
        };
        const word = (opt, k) => {
          const st = state(k);
          return (
            <button
              key={k}
              type="button"
              dir={textDir(opt)}
              className={`${underline ? styles.uword : styles.cword} ${isArabic(opt) ? styles.cwordArabic : ""} ${st ? styles[`c_${st}`] : ""}`}
              onClick={() => !locked && onPick(row, k)}
              disabled={locked}
              aria-pressed={chosen === k}
            >
              {opt || "…"}
              {!underline && st && (
                <svg className={styles.pen} viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
                  <path d={PEN} pathLength="1" className={st === "missed" ? styles.penDashed : styles.penDraw} />
                </svg>
              )}
            </button>
          );
        };
        const choices = (
          <span className={styles.inlineChoices}>
            <span aria-hidden="true">(</span>
            {options.map((opt, k) => (
              <Fragment key={k}>
                {k > 0 && <span aria-hidden="true">/</span>}
                {word(opt, k)}
              </Fragment>
            ))}
            <span aria-hidden="true">)</span>
          </span>
        );
        const gap = verdict && options[r.correct] ? <span className={styles.gapRight}>{options[r.correct]}</span> : <span className={styles.gapDots}>……</span>;
        const wrongRow = verdict && chosen !== r.correct;
        return (
          <div key={row} className={`${styles.crow} ${wrongRow ? styles.crowWrong : ""}`} dir={rtl ? "rtl" : "ltr"}>
            <span className={styles.crowNo}>{rtl ? toArabicDigits(row + 1) : row + 1}</span>
            <p className={`${styles.crowText} ${rtl ? styles.crowArabic : ""}`}>
              {parts.map((part, k) => (
                <Fragment key={k}>
                  <Marked text={part} />
                  {k < parts.length - 1 && (inside && k === 0 ? choices : gap)}
                </Fragment>
              ))}
            </p>
            {!inside && <div className={styles.crowWords}>{options.map((opt, k) => word(opt, k))}</div>}
          </div>
        );
      })}
      {!locked && <p className={styles.matchHint}>{t(underline ? "player.underlineHint" : "player.circleHint")}</p>}
    </div>
  );
}
