import { countryByCode } from "./globalData";
import { CENTROIDS, SHOW_PINS } from "./ProvinceLayer";
import styles from "./WorldGlobe.module.css";

/**
 * Tadarus Guru teachers studying right now, never by name: a pulsing green
 * bubble with how many. Up close, one at each pinned school (with its name)
 * and one per province for the teachers of no pinned school; far out, one
 * per country for all of them.
 *
 * `teachers` are those of no pinned school; `schools` the pinned schools
 * with `active` (the uids of theirs studying now) and `at` ([lon, lat]).
 */
export default function GuruLayer({ teachers = [], schools = [], projection, scale, visible, words }) {
  // per province and school only once the province pins show; before that, one bubble for the whole country
  const close = scale >= SHOW_PINS;
  const groups = new Map();
  const put = (key, at, count, extra) => {
    if (!at) return;
    const g = groups.get(key) || { key, at, active: 0, ...extra };
    g.active += count;
    groups.set(key, g);
  };
  // only where someone is studying right now; the totals are in the side panel
  teachers
    .filter((x) => x.active)
    .forEach((x) => {
      const byProvince = close && x.country === "ID" && x.province && CENTROIDS[x.province];
      if (byProvince) put(`ID-${x.province}`, CENTROIDS[x.province], 1);
      else put(x.country, countryByCode.get(x.country)?.centre, 1);
    });
  schools
    .filter((s) => s.active.length)
    .forEach((s) => {
      if (close) put(`school-${s.id}`, s.at, s.active.length, { name: s.name });
      else put(s.country, countryByCode.get(s.country)?.centre, s.active.length);
    });
  // the busiest last, so they sit on top
  const bubbles = [...groups.values()].sort((a, b) => a.active - b.active);
  if (!bubbles.length) return null;

  return (
    <g pointerEvents="none">
      {bubbles.map((b) => {
        if (!visible(b.at)) return null;
        const [x, y] = projection(b.at);
        if (b.name) return <SchoolBubble key={b.key} x={x} y={y} name={b.name} text={words.school ? words.school(b.active) : words.studying(b.active)} />;
        const text = words.studying(b.active);
        const w = text.length * 6.4 + 24;
        return (
          // beside the place, so it does not hide the program pin there
          <g key={b.key} transform={`translate(${x} ${y})`}>
            <circle r={14} className={styles.guruRing} />
            <circle r={5} className={styles.guruCore} />
            <g transform="translate(0 20)">
              <rect x={-w / 2} y={-10} width={w} height={20} rx={10} className={styles.guruPillOn} />
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

/** A pinned school: its name over how many of its teachers are studying now. */
function SchoolBubble({ x, y, name, text }) {
  const title = name.length > 34 ? `${name.slice(0, 33)}…` : name;
  const w = Math.max(title.length * 6.6, text.length * 5.8) + 28;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={14} className={styles.guruRing} />
      <circle r={5} className={styles.guruCore} />
      <g transform="translate(0 30)">
        <rect x={-w / 2} y={-19} width={w} height={38} rx={12} className={styles.guruPillOn} />
        <circle cx={-w / 2 + 11} cy={-6} r={3} className={styles.guruPillDot} />
        <text x={5} y={-6} dy="0.35em" className={styles.guruPillText}>
          {title}
        </text>
        <text x={5} y={9} dy="0.35em" className={styles.guruSchoolCount}>
          {text}
        </text>
      </g>
    </g>
  );
}
