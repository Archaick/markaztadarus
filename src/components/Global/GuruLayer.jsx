import { countryByCode } from "./globalData";
import { CENTROIDS, SHOW_PINS } from "./ProvinceLayer";
import styles from "./WorldGlobe.module.css";

/**
 * Tadarus Guru teachers on the globe, never by name: a green bubble with how
 * many teachers are in a province (up close) or a country (far out). Where
 * some have the app open right now, it pulses and says so.
 */
export default function GuruLayer({ teachers, projection, scale, visible, words }) {
  if (!teachers?.length) return null;
  // per province only once the province pins show; before that, one bubble for the whole country
  const close = scale >= SHOW_PINS;
  const groups = new Map();
  teachers.forEach((x) => {
    const byProvince = close && x.country === "ID" && x.province && CENTROIDS[x.province];
    const key = byProvince ? `ID-${x.province}` : x.country;
    const at = byProvince ? CENTROIDS[x.province] : countryByCode.get(x.country)?.centre;
    if (!at) return;
    const g = groups.get(key) || { key, at, count: 0, active: 0 };
    g.count += 1;
    if (x.active) g.active += 1;
    groups.set(key, g);
  });
  // the studying ones last, so they sit on top
  const bubbles = [...groups.values()].sort((a, b) => a.active - b.active);

  return (
    <g pointerEvents="none">
      {bubbles.map((b) => {
        if (!visible(b.at)) return null;
        const [x, y] = projection(b.at);
        const text = b.active ? `${words.guru} ${b.count} · ${words.studying(b.active)}` : `${words.guru} ${b.count}`;
        const w = text.length * 6.2 + 24;
        return (
          // beside the place, so it does not hide the program pin there
          <g key={b.key} transform={`translate(${x} ${y})`}>
            {b.active > 0 && <circle r={14} className={styles.guruRing} />}
            <circle r={5} className={styles.guruCore} />
            <g transform="translate(0 20)">
              <rect x={-w / 2} y={-10} width={w} height={20} rx={10} className={b.active ? styles.guruPillOn : styles.guruPill} />
              <circle cx={-w / 2 + 10} cy={0} r={3} className={styles.guruPillDot} />
              <text x={5} dy="0.35em" className={styles.guruPillText}>
                {text}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
