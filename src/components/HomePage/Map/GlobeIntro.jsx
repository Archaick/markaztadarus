import { useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import land110 from "world-atlas/land-110m.json";
import styles from "./Map.module.css";
import { ALL_PROVINCES, WIDTH } from "./mapGeometry";

const LAND = feature(land110, land110.objects.land);
const GRATICULE = geoGraticule10();
const SPHERE = { type: "Sphere" };
const FLY_MS = 2600;

const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/**
 * A turning globe that, once `go` is true, swings round to Indonesia and
 * zooms in until it lines up with `target` (the flat map's projection),
 * then calls onDone so the interactive map can take over. Near the centre
 * an orthographic globe at that scale is all but flat, so the hand-over
 * is seamless.
 */
export default function GlobeIntro({ target, height, provinces, go, onDone }) {
  const [frame, setFrame] = useState({ lambda: 0, phi: 0, scale: 0 });
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // Where the flat map is centred, and how far in it is zoomed.
  const end = useMemo(() => {
    const [lon, lat] = target.invert([WIDTH / 2, height / 2]);
    return { lambda: -lon, phi: -lat, scale: target.scale() };
  }, [target, height]);

  const start = useMemo(
    () => ({ lambda: end.lambda + 75, phi: end.phi - 18, scale: Math.min(WIDTH, height) * 0.42 }),
    [end, height]
  );

  // Idle: spin slowly. Go: fly to Indonesia.
  useEffect(() => {
    let raf = 0;
    const began = performance.now();
    if (!go) {
      const spin = (now) => {
        const t = (now - began) / 1000;
        setFrame({ lambda: start.lambda + t * 6, phi: start.phi, scale: start.scale });
        raf = requestAnimationFrame(spin);
      };
      raf = requestAnimationFrame(spin);
      return () => cancelAnimationFrame(raf);
    }
    const from = { ...start };
    const fly = (now) => {
      const p = Math.min(1, (now - began) / FLY_MS);
      const e = ease(p);
      setFrame({
        lambda: from.lambda + (end.lambda - from.lambda) * e,
        phi: from.phi + (end.phi - from.phi) * e,
        // zooming feels even when the scale grows geometrically
        scale: from.scale * Math.pow(end.scale / from.scale, e),
      });
      if (p < 1) raf = requestAnimationFrame(fly);
      else doneRef.current?.();
    };
    raf = requestAnimationFrame(fly);
    return () => cancelAnimationFrame(raf);
  }, [go, start, end]);

  const projection = useMemo(
    () =>
      geoOrthographic()
        .translate([WIDTH / 2, height / 2])
        .scale(frame.scale || start.scale)
        .rotate([frame.lambda, frame.phi])
        .clipAngle(90),
    [frame, height, start.scale]
  );
  const path = geoPath(projection);

  return (
    <svg className={styles.globe} viewBox={`0 0 ${WIDTH} ${height}`} aria-hidden="true">
      <defs>
        {/* sea: light like the map panel, a little darker towards the rim */}
        <radialGradient id="globeShade" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f6f9fd" />
          <stop offset="70%" stopColor="#e4edf7" />
          <stop offset="100%" stopColor="#cddcec" />
        </radialGradient>
        <filter id="globeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#102141" floodOpacity="0.18" />
        </filter>
      </defs>
      <path d={path(SPHERE)} fill="url(#globeShade)" stroke="#c3d3e3" strokeWidth="0.8" filter="url(#globeGlow)" />
      <path d={path(GRATICULE)} fill="none" stroke="rgba(37, 71, 94, 0.09)" strokeWidth="0.6" />
      <path d={path(LAND)} fill="#c3d4e6" stroke="#ffffff" strokeWidth="0.5" />
      {ALL_PROVINCES.map((f) => {
        const active = !!provinces[f.properties.PROVINSI];
        const d = path(f);
        return d ? (
          <path
            key={f.properties.PROVINSI}
            d={d}
            fill={active ? "#d4a912" : "#d7e3ef"}
            stroke="#ffffff"
            strokeWidth="0.4"
          />
        ) : null;
      })}
    </svg>
  );
}
