import { useMemo } from "react";
import { geoDistance, geoInterpolate, geoPath } from "d3-geo";
import styles from "./HolyPlaces.module.css";

const MAKKAH = [39.8262, 21.4225];
const MADINAH = [39.6111, 24.4672];
const QUDS = [35.236, 31.7781];
const JAKARTA = [106.8456, -6.2088];

// Makkah → Indonesia along the great circle, as a line the globe can clip.
const interpolate = geoInterpolate(MAKKAH, JAKARTA);
const ROUTE = { type: "LineString", coordinates: Array.from({ length: 65 }, (_, i) => interpolate(i / 64)) };

// The three sit only a few degrees apart, so each badge is set off to the
// side with a thin line to its exact spot. Offsets are in badge sizes.
const PLACES = [
  { key: "quds", at: QUDS, dx: -2.3, dy: -1.15, Icon: DomeOfTheRock },
  { key: "madinah", at: MADINAH, dx: -2.6, dy: 0.15, Icon: GreenDome },
  { key: "makkah", at: MAKKAH, dx: -1.9, dy: 1.45, Icon: Kaaba, source: true },
];

/**
 * The Haramain and Al-Aqsa on the globe, and a line of light from Makkah to
 * Indonesia: where the knowledge comes from and where it is going. Drawn with
 * the globe's own projection; `opacity` lets it fade out as the view flies
 * in. `size` is the badge diameter in the svg's units, `labels` optional.
 */
export default function HolyPlaces({ projection, opacity = 1, size = 26, labels }) {
  const path = useMemo(() => geoPath(projection), [projection]);
  if (opacity <= 0.01) return null;

  const [lambda, phi] = projection.rotate();
  const centre = [-lambda, -phi];
  const visible = (point) => geoDistance(point, centre) < Math.PI / 2 - 0.08;
  const route = path(ROUTE);
  const end = visible(JAKARTA) ? projection(JAKARTA) : null;

  return (
    <g className={styles.layer} style={{ opacity }} pointerEvents="none">
      {route && (
        <>
          <path d={route} className={styles.routeGlow} style={{ strokeWidth: size * 0.32 }} />
          <path d={route} className={styles.route} style={{ strokeWidth: size * 0.09 }} />
          <path d={route} pathLength="100" className={styles.flow} style={{ strokeWidth: size * 0.12 }} />
        </>
      )}
      {end && (
        <g transform={`translate(${end[0]} ${end[1]})`}>
          <circle r={size * 0.42} className={styles.arrival} />
          <circle r={size * 0.14} className={styles.arrivalDot} />
        </g>
      )}

      {PLACES.map(({ key, at, dx, dy, Icon, source }) => {
        if (!visible(at)) return null;
        const [x, y] = projection(at);
        const bx = x + dx * size;
        const by = y + dy * size;
        return (
          <g key={key}>
            <line x1={x} y1={y} x2={bx} y2={by} className={styles.leader} style={{ strokeWidth: size * 0.045 }} />
            <circle cx={x} cy={y} r={size * 0.1} className={source ? styles.spotSource : styles.spot} />
            <g transform={`translate(${bx} ${by})`}>
              <circle r={size / 2} className={source ? styles.badgeSource : styles.badge} style={{ strokeWidth: size * 0.07 }} />
              <g transform={`scale(${size / 26})`}>
                <Icon />
              </g>
              {labels?.[key] && (
                <text x={-size * 0.68} className={styles.label} style={{ fontSize: size * 0.42 }}>
                  {labels[key]}
                </text>
              )}
            </g>
          </g>
        );
      })}
    </g>
  );
}

// Icons drawn for a 26-unit badge centred on 0,0.

function Kaaba() {
  return (
    <g>
      {/* top face, then the black cube with its gold kiswah band */}
      <path d="M-7 -4.5 L0 -7.8 L7 -4.5 L0 -1.2 Z" fill="#3a3a3a" />
      <path d="M-7 -4.5 L0 -1.2 L0 8.2 L-7 4.9 Z" fill="#111111" />
      <path d="M7 -4.5 L0 -1.2 L0 8.2 L7 4.9 Z" fill="#232323" />
      <path d="M-7 -2.2 L0 1.1 L0 2.9 L-7 -0.4 Z" fill="#d4a912" />
      <path d="M7 -2.2 L0 1.1 L0 2.9 L7 -0.4 Z" fill="#e7c24a" />
    </g>
  );
}

function GreenDome() {
  return (
    <g>
      <rect x="-7.5" y="2" width="15" height="5.5" rx="0.8" fill="#e9e4d6" />
      <path d="M-5.6 2.2 Q-5.6 -6.4 0 -6.4 Q5.6 -6.4 5.6 2.2 Z" fill="#1f8f4e" />
      <path d="M0 -6.4 L0 -9.6" stroke="#c9a227" strokeWidth="1.1" strokeLinecap="round" />
      {/* minaret */}
      <rect x="7.6" y="-5" width="1.9" height="12.5" rx="0.6" fill="#e9e4d6" />
      <path d="M7.4 -5 L8.55 -8.2 L9.7 -5 Z" fill="#1f8f4e" />
    </g>
  );
}

function DomeOfTheRock() {
  return (
    <g>
      <rect x="-8" y="1.6" width="16" height="6" rx="0.8" fill="#3d6fb5" />
      <rect x="-8" y="1.6" width="16" height="1.4" fill="#e9e4d6" />
      <path d="M-5.8 1.8 Q-5.8 -6.8 0 -6.8 Q5.8 -6.8 5.8 1.8 Z" fill="#e2b23a" />
      <path d="M-3.4 -4.8 Q-1.6 -6.3 0.6 -6.1" stroke="#fff2c2" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M0 -6.8 L0 -9.6" stroke="#c9a227" strokeWidth="1.1" strokeLinecap="round" />
    </g>
  );
}
