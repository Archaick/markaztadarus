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

// Each icon sits on its own city, nudged a little (in icon sizes) so Makkah
// and Madinah, three degrees apart, do not cover each other. `side` is where
// the name goes.
const PLACES = [
  { key: "quds", at: QUDS, dx: -0.35, dy: -0.55, side: "left", Icon: DomeOfTheRock },
  { key: "madinah", at: MADINAH, dx: -0.45, dy: -0.4, side: "left", Icon: GreenDome },
  { key: "makkah", at: MAKKAH, dx: 0.5, dy: 0.42, side: "right", Icon: Kaaba, source: true },
];

/**
 * The Haramain and Al-Aqsa on the globe, and a line of light from Makkah to
 * Indonesia: where the knowledge comes from and where it is going. Drawn with
 * the globe's own projection; `opacity` lets it fade out as the view flies
 * in. `size` is the icon diameter in the svg's units, `labels` optional.
 * `reveal` (0–1) draws the line that far from Makkah; without it the line
 * draws itself once.
 */
export default function HolyPlaces({ projection, opacity = 1, size = 26, labels, reveal }) {
  const path = useMemo(() => geoPath(projection), [projection]);
  if (opacity <= 0.01) return null;

  const [lambda, phi] = projection.rotate();
  const centre = [-lambda, -phi];
  const visible = (point) => geoDistance(point, centre) < Math.PI / 2 - 0.08;
  const route = path(ROUTE);
  const manual = reveal !== undefined;
  const drawn = manual ? { strokeDasharray: 100, strokeDashoffset: 100 * (1 - reveal) } : undefined;
  const lineWidth = Math.min(size, 26) * 0.09;
  const end = visible(JAKARTA) && (!manual || reveal >= 0.98) ? projection(JAKARTA) : null;

  return (
    <g className={styles.layer} style={{ opacity }} pointerEvents="none">
      {route && (
        <>
          {/* the line's width stays the same while the icons grow in the close-up */}
          <path
            d={route}
            pathLength="100"
            className={styles.routeGlow}
            style={{ strokeWidth: lineWidth * 3.5, ...drawn }}
          />
          <path
            d={route}
            pathLength="100"
            className={manual ? styles.routeManual : styles.route}
            style={{ strokeWidth: lineWidth, ...drawn }}
          />
          {(!manual || reveal >= 0.98) && (
            <path d={route} pathLength="100" className={styles.flow} style={{ strokeWidth: lineWidth * 1.3 }} />
          )}
        </>
      )}
      {end && (
        <g transform={`translate(${end[0]} ${end[1]})`}>
          <circle r={Math.min(size, 26) * 0.42} className={styles.arrival} />
          <circle r={Math.min(size, 26) * 0.14} className={styles.arrivalDot} />
        </g>
      )}

      {PLACES.map(({ key, at, dx, dy, side, Icon, source }) => {
        if (!visible(at)) return null;
        const [x, y] = projection(at);
        const label = labels?.[key];
        return (
          <g key={key} transform={`translate(${x + dx * size} ${y + dy * size})`}>
            <circle r={size / 2} className={source ? styles.badgeSource : styles.badge} style={{ strokeWidth: size * 0.07 }} />
            <g transform={`scale(${size / 26})`}>
              <Icon />
            </g>
            {label && (
              <text
                x={(side === "left" ? -1 : 1) * size * 0.68}
                className={`${styles.label} ${side === "left" ? styles.labelLeft : styles.labelRight}`}
                style={{ fontSize: size * 0.44 }}
              >
                {label}
              </text>
            )}
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
