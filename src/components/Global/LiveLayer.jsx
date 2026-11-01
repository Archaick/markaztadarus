import { countryByCode } from "./globalData";
import { CENTROIDS, SHOW_PROVINCES } from "./ProvinceLayer";
import styles from "./WorldGlobe.module.css";

const where = (p) => p.at || (p.province && CENTROIDS[p.province]) || countryByCode.get(p.code)?.centre || null;

// far out: one bubble per country, where its places are on average
function byCountry(places) {
  const groups = new Map();
  places.forEach((p) => {
    const at = where(p);
    if (!at) return;
    const g = groups.get(p.code) || { key: p.code, points: [], live: 0 };
    g.points.push(at);
    if (p.live) g.live += 1;
    groups.set(p.code, g);
  });
  return [...groups.values()].map((g) => ({
    key: g.key,
    live: g.live,
    at: [g.points.reduce((s, a) => s + a[0], 0) / g.points.length, g.points.reduce((s, a) => s + a[1], 0) / g.points.length],
  }));
}

/**
 * Tadarus Live on the globe: a red pulsing bubble marked LIVE where an online
 * Tadarus is running now, a small violet dot where one meets on other days.
 * Far out, one bubble per country (LIVE 2: two of its places are live).
 */
export default function LiveLayer({ sessions, projection, scale, visible }) {
  if (!sessions.length) return null;
  const close = scale >= SHOW_PROVINCES;
  const bubbles = close
    ? sessions.map((p) => ({ key: p.key, live: p.live ? 1 : 0, at: where(p), single: true })).filter((b) => b.at)
    : byCountry(sessions);
  // the live ones last, so they sit on top
  bubbles.sort((a, b) => a.live - b.live);

  return (
    <g pointerEvents="none">
      {bubbles.map((b) => {
        if (!visible(b.at)) return null;
        const [x, y] = projection(b.at);
        if (!b.live) {
          return (
            <g key={b.key} transform={`translate(${x} ${y})`}>
              <circle r={close ? 5 : 6} className={styles.onlineDot} />
            </g>
          );
        }
        const text = b.single || b.live === 1 ? "LIVE" : `LIVE ${b.live}`;
        const w = text.length * 6.6 + 16;
        return (
          <g key={b.key} transform={`translate(${x} ${y})`}>
            <circle r={13} className={styles.liveRing} />
            <circle r={6} className={styles.liveCore} />
            <g transform="translate(0 -22)">
              <rect x={-w / 2} y={-9} width={w} height={18} rx={9} className={styles.livePill} />
              <circle cx={-w / 2 + 9} cy={0} r={2.6} className={styles.livePillDot} />
              <text x={5} dy="0.35em" className={styles.livePillText}>
                {text}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
