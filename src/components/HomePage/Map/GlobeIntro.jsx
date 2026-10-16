import { useEffect, useMemo, useState } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import land110 from "world-atlas/land-110m.json";
import { useTranslation } from "react-i18next";
import HolyPlaces from "../../Common/HolyPlaces";
import styles from "./Map.module.css";
import { ALL_PROVINCES, WIDTH } from "./mapGeometry";

const LAND = feature(land110, land110.objects.land);
const GRATICULE = geoGraticule10();
const SPHERE = { type: "Sphere" };
const SPIN_DEG_PER_S = 6;

const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/**
 * A globe that zooms into Indonesia as `progress` goes from 0 to 1 (the
 * scroll position of the map section), ending exactly on `target`, the
 * flat map's projection. Near the centre an orthographic globe at that
 * scale is all but flat, so the hand-over to the flat map is seamless.
 * While `spinning` and fully zoomed out, it also turns slowly; that turn
 * (kept within ±180°) unwinds as it zooms, so it always lands on Indonesia.
 */
export default function GlobeIntro({ target, height, provinces, progress, spinning, onSkip }) {
  const { t } = useTranslation("homepage/Map");
  const [seconds, setSeconds] = useState(0);
  const idle = progress <= 0.001;

  useEffect(() => {
    if (!spinning || !idle) return undefined;
    let raf = 0;
    const began = performance.now() - seconds * 1000;
    const tick = (now) => {
      setSeconds((now - began) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `seconds` only seeds the clock when spinning resumes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, idle]);

  // Where the flat map is centred, and how far in it is zoomed.
  const end = useMemo(() => {
    const [lon, lat] = target.invert([WIDTH / 2, height / 2]);
    return { lambda: -lon, phi: -lat, scale: target.scale() };
  }, [target, height]);

  const start = useMemo(
    () => ({ lambda: end.lambda + 75, phi: end.phi - 18, scale: Math.min(WIDTH, height) * 0.42 }),
    [end, height]
  );

  const e = ease(Math.min(1, Math.max(0, progress)));
  const turned = ((((seconds * SPIN_DEG_PER_S + 180) % 360) + 360) % 360) - 180;
  const spin = turned * (1 - e);

  const projection = useMemo(
    () =>
      geoOrthographic()
        .translate([WIDTH / 2, height / 2])
        // zooming feels even when the scale grows geometrically
        .scale(start.scale * Math.pow(end.scale / start.scale, e))
        .rotate([start.lambda + (end.lambda - start.lambda) * e + spin, start.phi + (end.phi - start.phi) * e])
        .clipAngle(90),
    [start, end, e, spin, height]
  );
  const path = geoPath(projection);

  return (
    <svg className={styles.globe} viewBox={`0 0 ${WIDTH} ${height}`} aria-hidden="true" onClick={onSkip}>
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
      {/* Makkah, Madinah and Al-Quds, and the line to Indonesia; gone before
          the globe lands so the hand-over to the flat map stays clean */}
      <HolyPlaces
        projection={projection}
        opacity={Math.max(0, 1 - e * 2.4)}
        size={30}
        labels={{ makkah: t("holy.makkah"), madinah: t("holy.madinah"), quds: t("holy.quds") }}
      />
    </svg>
  );
}
