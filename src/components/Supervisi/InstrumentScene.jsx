import styles from "./Scene.module.css";

// The cover of an instrument card: an open Mushaf on its stand (rehal) by an
// arched window, under a swinging lantern; the sky through the window is a
// sunset, a dusk or a night, picked from the instrument's id.

const SKIES = [
  ["#14306b", "#7b4f9e", "#f59a5c"],
  ["#0f2557", "#3b4fa8", "#e98a7a"],
  ["#050d26", "#0f2350", "#26407a"],
];

const hash = (str) => [...(str || "x")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 11);

export default function InstrumentScene({ id }) {
  const seed = hash(id);
  const sky = SKIES[seed % SKIES.length];
  const night = seed % SKIES.length === 2;
  const key = `is-${seed}`;

  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={styles.scene} aria-hidden="true">
      <defs>
        <linearGradient id={`${key}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c2a52" />
          <stop offset="1" stopColor="#05162f" />
        </linearGradient>
        <linearGradient id={`${key}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="0.6" stopColor={sky[1]} />
          <stop offset="1" stopColor={sky[2]} />
        </linearGradient>
        <radialGradient id={`${key}-lamp`}>
          <stop offset="0" stopColor="#ffd987" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffd987" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#${key}-wall)`} />

      {/* the arched window and its sky */}
      <path d="M232 250 V120 Q232 60 292 50 Q352 60 352 120 V250 Z" fill={`url(#${key}-sky)`} />
      {night ? (
        <path d="M318 98 a16 16 0 1 1 -8 -21 a13 13 0 1 0 8 21 Z" fill="#fff6d8" />
      ) : (
        <circle cx="300" cy="190" r="22" fill="#ffd08a" className={styles.glow} />
      )}
      <path d="M232 250 V120 Q232 60 292 50 Q352 60 352 120 V250" stroke="#cc9933" strokeWidth="6" fill="none" />
      <path d="M292 52 V250 M232 160 H352" stroke="#cc9933" strokeWidth="3" opacity="0.7" />

      {/* the lantern, swinging slowly, with its glow */}
      <g className={styles.palm} style={{ transformOrigin: "120px 0px" }}>
        <line x1="120" y1="0" x2="120" y2="58" stroke="#cc9933" strokeWidth="2" />
        <circle cx="120" cy="92" r="58" fill={`url(#${key}-lamp)`} className={styles.glow} />
        <path d="M106 64 H134 L130 70 H110 Z" fill="#cc9933" />
        <path d="M108 70 H132 L128 112 H112 Z" fill="#ffd987" opacity="0.9" className={styles.window} />
        <path d="M108 70 H132 L128 112 H112 Z" fill="none" stroke="#cc9933" strokeWidth="2" />
        <path d="M110 112 H130 L124 120 H116 Z" fill="#cc9933" />
      </g>

      {/* floor, the rehal and the open Mushaf */}
      <rect y="240" width="400" height="60" fill="#04112a" />
      <path d="M70 262 L150 200 L230 262" stroke="#8a5a2b" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M86 262 L150 214 L214 262" stroke="#b8793d" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M150 206 Q118 188 84 200 L92 236 Q122 226 150 240 Z" fill="#fbf6ea" />
      <path d="M150 206 Q182 188 216 200 L208 236 Q178 226 150 240 Z" fill="#f3ead4" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} opacity="0.55">
          <path d={`M${98 + i * 2} ${206 + i * 7} Q122 ${200 + i * 7} 144 ${210 + i * 7}`} stroke="#14306b" strokeWidth="1.4" fill="none" />
          <path d={`M${156} ${210 + i * 7} Q178 ${200 + i * 7} ${202 - i * 2} ${206 + i * 7}`} stroke="#14306b" strokeWidth="1.4" fill="none" />
        </g>
      ))}
      <path d="M84 200 L92 236 Q122 226 150 240 Q178 226 208 236 L216 200" stroke="#cc9933" strokeWidth="2.5" fill="none" />
    </svg>
  );
}
