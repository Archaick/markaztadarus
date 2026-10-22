import styles from "./Scene.module.css";

// The cover of a school card when it has no photo: a drawn mosque or school
// under a sunset, a dusk or a night sky, gently animated (sun glow, drifting
// clouds, birds, twinkling stars, a waving flag, lit windows). Which one is
// picked from the school's id, so neighbouring cards don't look the same.

const SKIES = [
  { kind: "sunset", sky: ["#14306b", "#7b4f9e", "#f59a5c"], sun: "#ffd08a", ground: ["#2a2350", "#140f2c"], glow: "#ffcf8a" },
  { kind: "dusk", sky: ["#0f2557", "#3b4fa8", "#e98a7a"], sun: "#ffe0b0", ground: ["#1d2a5c", "#0b1433"], glow: "#ffb48a" },
  { kind: "night", sky: ["#050d26", "#0f2350", "#26407a"], sun: "#fff6d8", ground: ["#0c1736", "#050b1f"], glow: "#cfe0ff" },
];

// The designs an admin can pick for a card ("" = picked from the id).
export const SCENES = ["mosque-sunset", "mosque-dusk", "mosque-night", "school-sunset", "school-dusk", "school-night"];

const hash = (str) => [...(str || "x")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const STARS = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 97) % 400,
  y: 12 + ((i * 53) % 120),
  r: 0.6 + ((i * 7) % 10) / 10,
  d: (i % 7) * 0.45,
}));

function Mosque({ lit }) {
  const win = lit ? "#ffd987" : "#f3c77a";
  return (
    <g>
      {/* minarets */}
      {[96, 304].map((x) => (
        <g key={x}>
          <rect x={x - 7} y="118" width="14" height="112" rx="2" fill="#eef0f6" />
          <rect x={x - 10} y="150" width="20" height="5" rx="2" fill="#d8dceb" />
          <path d={`M${x - 7} 118 Q${x} 98 ${x + 7} 118 Z`} fill="#cc9933" />
          <rect x={x - 0.8} y="88" width="1.6" height="12" fill="#cc9933" />
          <path d={`M${x + 3} 86 a4.5 4.5 0 1 1 -3 -5 a3.6 3.6 0 1 0 3 5 Z`} fill="#cc9933" />
          <rect x={x - 3} y="168" width="6" height="12" rx="3" fill={win} className={styles.window} />
        </g>
      ))}
      {/* the hall and its great dome */}
      <rect x="128" y="168" width="144" height="62" rx="3" fill="#f4f5fa" />
      <path d="M150 170 Q150 112 200 104 Q250 112 250 170 Z" fill="#e7e9f3" />
      <path d="M156 170 Q158 120 200 112" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="3" fill="none" />
      <rect x="199" y="80" width="2" height="26" fill="#cc9933" />
      <path d="M205 79 a6 6 0 1 1 -4 -7 a4.8 4.8 0 1 0 4 7 Z" fill="#cc9933" />
      <rect x="128" y="166" width="144" height="6" rx="2" fill="#cc9933" opacity="0.9" />
      {/* arched windows and the door */}
      {[146, 170, 230, 254].map((x, i) => (
        <path key={x} d={`M${x - 6} 214 V192 Q${x} 182 ${x + 6} 192 V214 Z`} fill={win} className={styles.window} style={{ animationDelay: `${i * 0.7}s` }} />
      ))}
      <path d="M188 230 V200 Q200 186 212 200 V230 Z" fill="#14306b" />
      <path d="M192 230 V202 Q200 192 208 202 V230 Z" fill={win} opacity="0.55" />
    </g>
  );
}

function School({ lit }) {
  const win = lit ? "#ffd987" : "#f3c77a";
  return (
    <g>
      {/* flag on its pole */}
      <rect x="318" y="102" width="2.4" height="128" fill="#d8dceb" />
      <g className={styles.flag}>
        <rect x="320" y="104" width="30" height="10" fill="#ce1126" />
        <rect x="320" y="114" width="30" height="10" fill="#ffffff" />
      </g>
      {/* wings and the centre block */}
      <rect x="86" y="160" width="228" height="70" rx="3" fill="#f4f5fa" />
      <path d="M78 162 L200 120 L322 162 Z" fill="#cc9933" />
      <rect x="160" y="132" width="80" height="98" rx="3" fill="#eef0f6" />
      <path d="M152 134 L200 104 L248 134 Z" fill="#b8862b" />
      {/* clock */}
      <circle cx="200" cy="124" r="8" fill="#ffffff" stroke="#14306b" strokeWidth="1.5" />
      <path d="M200 119 V124 L204 126" stroke="#14306b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* windows */}
      {[100, 124, 270, 294].flatMap((x, i) =>
        [174, 198].map((y, j) => (
          <rect key={`${x}-${y}`} x={x - 7} y={y} width="14" height="14" rx="2" fill={win} className={styles.window} style={{ animationDelay: `${(i + j) * 0.6}s` }} />
        ))
      )}
      {[176, 200, 224].map((x) => (
        <rect key={x} x={x - 7} y="146" width="14" height="16" rx="2" fill={win} />
      ))}
      <path d="M186 230 V196 Q200 184 214 196 V230 Z" fill="#14306b" />
      <rect x="176" y="226" width="48" height="4" fill="#d8dceb" />
    </g>
  );
}

export default function SchoolScene({ id, scene, className = "" }) {
  const seed = hash(id);
  const [pickedBuilding, pickedSky] = SCENES.includes(scene) ? scene.split("-") : [];
  // the bits of the hash are mixed so automatic picks spread over all three skies
  const sky = SKIES.find((s) => s.kind === pickedSky) || SKIES[((Math.imul(seed, 2654435761) >>> 0) >>> 24) % SKIES.length];
  const building = pickedBuilding || ((seed >> 3) % 2 === 0 ? "mosque" : "school");
  const night = sky.kind === "night";
  // unique per school and design, so several scenes on one page keep their own colours
  const key = `ss-${seed}-${building}-${sky.kind}`;
  const sunX = 90 + (seed % 220);
  const sunY = night ? 58 : 150;

  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={`${styles.scene} ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${key}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.sky[0]} />
          <stop offset="0.62" stopColor={sky.sky[1]} />
          <stop offset="1" stopColor={sky.sky[2]} />
        </linearGradient>
        <radialGradient id={`${key}-glow`}>
          <stop offset="0" stopColor={sky.glow} stopOpacity={night ? 0.45 : 0.8} />
          <stop offset="0.4" stopColor={sky.glow} stopOpacity={night ? 0.15 : 0.3} />
          <stop offset="1" stopColor={sky.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${key}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.ground[0]} />
          <stop offset="1" stopColor={sky.ground[1]} />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#${key}-sky)`} />

      {night &&
        STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" className={styles.star} style={{ animationDelay: `${s.d}s` }} />
        ))}

      {/* the sun (or the moon at night) with a soft breathing glow */}
      <circle className={styles.glow} cx={sunX} cy={sunY} r={night ? 70 : 120} fill={`url(#${key}-glow)`} />
      {night ? (
        <path d={`M${sunX + 12} ${sunY + 10} a20 20 0 1 1 -10 -26 a16 16 0 1 0 10 26 Z`} fill={sky.sun} />
      ) : (
        <circle cx={sunX} cy={sunY} r="30" fill={sky.sun} />
      )}

      {/* drifting clouds */}
      <g className={styles.clouds} opacity={night ? 0.25 : 0.75}>
        <rect x={sunX - 80} y={sunY + 4} width="96" height="6" rx="3" fill="#e8668a" />
        <rect x={sunX - 10} y={sunY + 18} width="120" height="5" rx="2.5" fill="#7a4fa0" />
        <rect x={sunX - 120} y={sunY - 22} width="64" height="5" rx="2.5" fill="#f4a3a8" />
      </g>

      {/* birds crossing at sunset */}
      {!night && (
        <g className={styles.birds} fill="none" stroke="#1b1638" strokeWidth="1.6" strokeLinecap="round">
          <path d="M60 70 q5 -5 10 0 q5 -5 10 0" />
          <path d="M88 58 q4 -4 8 0 q4 -4 8 0" />
          <path d="M44 84 q3 -3 6 0 q3 -3 6 0" />
        </g>
      )}

      {/* hills and palms behind */}
      <path d="M0 236 Q60 214 120 228 T240 222 T400 230 V300 H0 Z" fill={sky.ground[0]} opacity="0.7" />
      {[38, 362].map((x) => (
        <g key={x} className={styles.palm} style={{ transformOrigin: `${x}px 236px` }}>
          <rect x={x - 2} y="186" width="4" height="52" rx="2" fill={sky.ground[1]} />
          <path d={`M${x} 188 q-18 -6 -26 8 M${x} 188 q18 -6 26 8 M${x} 188 q-10 -16 -24 -14 M${x} 188 q10 -16 24 -14`} stroke={sky.ground[1]} strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      ))}

      {building === "mosque" ? <Mosque lit={night} /> : <School lit={night} />}

      <rect y="228" width="400" height="72" fill={`url(#${key}-ground)`} />
      <path d="M0 236 H400" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="2" />
    </svg>
  );
}
