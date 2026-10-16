import { useEffect, useMemo, useState } from "react";
import { geoCentroid, geoMercator, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import land110 from "world-atlas/land-110m.json";
import { ALL_PROVINCES } from "../HomePage/Map/mapGeometry";
import { mtiProvinces } from "../../data/mtiProvinceData";
import { SITE_DOCS, useSiteContent } from "../HomePage/siteContent";
import HolyPlaces from "./HolyPlaces";
import styles from "./LoaderGlobe.module.css";

const LAND = feature(land110, land110.objects.land);
const SPHERE = { type: "Sphere" };
const W = 400;
const H = 300;
const FLIGHT_MS = 2800;
const DELAY_MS = 1100; // the line from Makkah draws first

const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// Indonesia framed in the box, as a flat (Mercator) map: where the flight ends.
const TARGET = geoMercator().fitExtent(
  [
    [22, 22],
    [W - 22, H - 22],
  ],
  { type: "FeatureCollection", features: ALL_PROVINCES }
);
const END = (() => {
  const [lon, lat] = TARGET.invert([W / 2, H / 2]);
  return { lambda: -lon, phi: -lat, scale: TARGET.scale() };
})();
const START = { lambda: END.lambda + 70, phi: END.phi - 16, scale: 118 };

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A small version of the home-page globe for loading screens: the Earth turns,
 * flies down to Indonesia, and the provinces with Tadarus programs light up
 * in gold with a soft pulse. Plays once (about 4 s) and then holds.
 * `at` (0–1) freezes it at one point of the flight, for previews.
 */
export default function LoaderGlobe({ className = "", at }) {
  const stored = useSiteContent(SITE_DOCS.map);
  const provinces =
    stored?.provinces && Object.keys(stored.provinces).length ? stored.provinces : mtiProvinces;

  const [played, setPlayed] = useState(() => (reducedMotion() ? 1 : 0));
  const progress = at ?? played;

  useEffect(() => {
    if (at !== undefined || reducedMotion()) return undefined;
    let raf = 0;
    const began = performance.now() + DELAY_MS;
    const tick = (now) => {
      const p = Math.min(1, Math.max(0, (now - began) / FLIGHT_MS));
      setPlayed(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [at]);

  const e = ease(progress);
  const projection = useMemo(
    () =>
      geoOrthographic()
        .translate([W / 2, H / 2])
        // zooming feels even when the scale grows geometrically
        .scale(START.scale * Math.pow(END.scale / START.scale, e))
        .rotate([START.lambda + (END.lambda - START.lambda) * e, START.phi + (END.phi - START.phi) * e])
        .clipAngle(90),
    [e]
  );
  const path = geoPath(projection);

  const active = ALL_PROVINCES.filter((f) => provinces[f.properties.PROVINSI]);
  const landed = progress >= 1;

  return (
    <svg className={`${styles.globe} ${className}`} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <radialGradient id="loaderSea" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="75%" stopColor="#eef3f9" />
          <stop offset="100%" stopColor="#dde7f2" />
        </radialGradient>
        {/* soft oval window: whatever the zoom pushes past the box fades out */}
        <radialGradient id="loaderFade" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <mask id="loaderWindow">
          <rect width={W} height={H} fill="url(#loaderFade)" />
        </mask>
      </defs>
      <g mask="url(#loaderWindow)">
      {/* the sphere fades away as the view flattens into a map */}
      <path d={path(SPHERE)} fill="url(#loaderSea)" stroke="#d9e3ee" strokeWidth="1" opacity={1 - e * 0.85} />
      {/* the rest of the world steps back as Indonesia comes forward */}
      <path d={path(LAND)} fill="#dfe7f0" opacity={1 - e * 0.55} />
      {ALL_PROVINCES.map((f) => {
        const d = path(f);
        if (!d) return null;
        const on = !!provinces[f.properties.PROVINSI];
        return (
          <path
            key={f.properties.PROVINSI}
            d={d}
            fill={on ? "#d4a912" : "#cbd8e6"}
            stroke="#ffffff"
            strokeWidth="0.6"
            className={on ? styles.active : undefined}
          />
        );
      })}
      <HolyPlaces projection={projection} opacity={Math.min(1, Math.max(0, (0.88 - e) / 0.3))} size={13} />
      {landed &&
        active.map((f, i) => {
          const point = projection(geoCentroid(f));
          if (!point) return null;
          return (
            <g key={f.properties.PROVINSI} transform={`translate(${point[0]} ${point[1]})`}>
              <circle r="9" className={styles.ripple} style={{ animationDelay: `${i * 90}ms` }} />
              <circle r="3.2" className={styles.dot} style={{ animationDelay: `${i * 90}ms` }} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
