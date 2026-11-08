import { useId } from "react";
import { fiveTOf } from "../Belajar/belajarSchema";
import styles from "./Lantern.module.css";

export const FIVE = ["tamhid", "tilawah", "tafsir", "tadabbur", "tazkiyah"];
export const FIVE_COLOR = { tamhid: "#b39dff", tilawah: "#5cc8ff", tafsir: "#4fe0ad", tadabbur: "#ffc861", tazkiyah: "#ff8ac2" };
const UNTAGGED = "#cfe3ff";

/** A surah's steps as the lantern needs them: one beam per section. */
export const lanternItems = (steps) => steps.map((s) => ({ id: s.section.id, t: fiveTOf(s.section), done: s.state === "done" }));

const CX = 200;
const CY = 162;
const SPREAD = 125; // beams fan out this many degrees either side of straight up

/**
 * The teacher's lantern. Five glass panes, one per T, brighten as that T's
 * sections are finished, and every finished section sends out one beam in its
 * 5T colour. `fire` is the section just finished: its beam shoots out while
 * the others stay still. `compact` is the small version for the surah list.
 * Draw it on a dark surface: the light is added to what is behind it.
 */
export default function Lantern({ items, fire, compact, label }) {
  const uid = useId().replace(/:/g, "");
  const total = items.length;
  const doneCount = items.filter((x) => x.done).length;
  const lit = total ? doneCount / total : 0;
  const complete = total > 0 && doneCount === total;
  const step = total > 1 ? (SPREAD * 2) / (total - 1) : 0;
  const half = Math.min(34, 150 * Math.tan((Math.min(step || 30, 40) * 0.3 * Math.PI) / 180));
  const share = (t) => {
    const of = items.filter((x) => x.t === t);
    return of.length ? of.filter((x) => x.done).length / of.length : 0;
  };
  const colorOf = (t) => FIVE_COLOR[t] || UNTAGGED;
  const usedColors = [...new Set(items.map((x) => x.t || ""))];
  const edgeTop = (i) => 168 + 12.8 * i;
  const edgeBottom = (i) => 152 + 19.2 * i;
  const line = compact ? 3 : 1.6;

  return (
    <svg className={`${styles.lantern} ${compact ? styles.compact : ""} ${complete ? styles.complete : ""}`} viewBox={compact ? "62 26 276 276" : "0 0 400 320"} role="img" aria-label={label}>
      <defs>
        {usedColors.map((t) => (
          <linearGradient key={t} id={`${uid}b${t}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="0.22" stopColor={colorOf(t)} stopOpacity="0.8" />
            <stop offset="0.7" stopColor={colorOf(t)} stopOpacity="0.18" />
            <stop offset="1" stopColor={colorOf(t)} stopOpacity="0" />
          </linearGradient>
        ))}
        {FIVE.map((t) => (
          <linearGradient key={t} id={`${uid}p${t}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colorOf(t)} stopOpacity="0.55" />
            <stop offset="1" stopColor={colorOf(t)} stopOpacity="0.98" />
          </linearGradient>
        ))}
        <radialGradient id={`${uid}core`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="0.7" stopColor="#dcebff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#dcebff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}room`}>
          <stop offset="0" stopColor="#9cc9f5" stopOpacity="0.75" />
          <stop offset="0.55" stopColor="#6aa5dc" stopOpacity="0.2" />
          <stop offset="1" stopColor="#6aa5dc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* the light in the room rises with the whole surah */}
      <circle className={styles.room} cx={CX} cy={CY} r="210" fill={`url(#${uid}room)`} style={{ opacity: 0.12 + lit * 0.5 }} />

      <g className={styles.sway}>
        <g className={styles.light}>
          {items.map((item, i) => {
            if (!item.done) return null;
            const angle = total > 1 ? -SPREAD + step * i : 0;
            const long = i % 2 ? 205 : 180;
            const paint = `url(#${uid}b${item.t || ""})`;
            const motion = fire === item.id ? styles.firing : fire ? styles.still : "";
            return (
              <g key={item.id} transform={`translate(${CX} ${CY}) rotate(${angle})`}>
                <g className={styles.shimmer} style={{ "--d": `-${i * 0.55}s` }}>
                  <polygon className={`${styles.beam} ${styles.bloom} ${motion}`} style={{ "--i": i }} points={`-10,0 10,0 ${half * 1.7},${-long} ${-half * 1.7},${-long}`} fill={paint} />
                  <polygon className={`${styles.beam} ${motion}`} style={{ "--i": i }} points={`-3,0 3,0 ${half * 0.72},${-long} ${-half * 0.72},${-long}`} fill={paint} />
                </g>
              </g>
            );
          })}
        </g>

        <line x1={CX} y1="-20" x2={CX} y2="70" className={styles.chain} strokeWidth={line} />
        <circle cx={CX} cy="74" r="5" fill="none" className={styles.frame} strokeWidth={line} />
        <path d="M166 112Q172 84 200 80Q228 84 234 112Z" className={styles.cap} strokeWidth={line} />

        {FIVE.map((t, i) => (
          <polygon
            key={t}
            className={styles.pane}
            points={`${edgeTop(i)},112 ${edgeTop(i + 1)},112 ${edgeBottom(i + 1)},212 ${edgeBottom(i)},212`}
            fill={`url(#${uid}p${t})`}
            style={{ opacity: 0.1 + share(t) * 0.9 }}
          />
        ))}

        <circle className={styles.core} cx={CX} cy={CY} style={{ r: 18 + lit * 22 }} fill={`url(#${uid}core)`} />

        <polygon points="168,112 232,112 248,212 152,212" fill={`url(#${uid}shine)`} />
        <polygon points="168,112 232,112 248,212 152,212" fill="none" className={styles.frame} strokeWidth={line} strokeLinejoin="round" />
        {[1, 2, 3, 4].map((i) => (
          <line key={i} x1={edgeTop(i)} y1="112" x2={edgeBottom(i)} y2="212" className={styles.rib} strokeWidth={line * 0.6} />
        ))}
        <path d="M148 212H252L242 225H158Z" className={styles.cap} strokeWidth={line} strokeLinejoin="round" />
        {fire && items.some((x) => x.id === fire && x.done) && <circle key={fire} className={styles.flash} cx={CX} cy={CY} r="70" fill={`url(#${uid}core)`} />}
      </g>
    </svg>
  );
}
