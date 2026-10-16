import { useMemo } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import land110 from "world-atlas/land-110m.json";
import { useTranslation } from "react-i18next";
import HolyPlaces from "../../Common/HolyPlaces";
import { closeUpOf, flightAt } from "../../Common/haramainFlight";
import styles from "./Map.module.css";
import { ALL_PROVINCES, WIDTH } from "./mapGeometry";

const LAND = feature(land110, land110.objects.land);
const GRATICULE = geoGraticule10();
const SPHERE = { type: "Sphere" };

/**
 * The map's opening story, driven by `progress` 0–1: a close-up of Makkah,
 * Madinah and Al-Quds; the camera pulls back to the whole Earth as a line of
 * light draws from Makkah to Indonesia; then it flies down to Indonesia and
 * ends exactly on `target`, the flat map's projection. Near the centre an
 * orthographic globe at that scale is all but flat, so the hand-over to the
 * flat map is seamless.
 */
export default function GlobeIntro({ target, height, provinces, progress, onSkip }) {
  const { t } = useTranslation("homepage/Map");

  // Where the flat map is centred and how far in it is zoomed; the whole-Earth
  // view in between; and the close-up the story opens on.
  const keys = useMemo(() => {
    const [lon, lat] = target.invert([WIDTH / 2, height / 2]);
    const end = { lambda: -lon, phi: -lat, scale: target.scale() };
    const globe = { lambda: end.lambda + 75, phi: end.phi - 18, scale: Math.min(WIDTH, height) * 0.42 };
    return { end, globe, close: closeUpOf(globe) };
  }, [target, height]);

  const at = flightAt(Math.min(1, Math.max(0, progress)), keys);
  const { view } = at;

  const projection = useMemo(
    () =>
      geoOrthographic()
        .translate([WIDTH / 2, height / 2])
        .scale(view.scale)
        .rotate([view.lambda, view.phi])
        .clipAngle(90),
    [view.scale, view.lambda, view.phi, height]
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
      {/* Makkah, Madinah and Al-Quds, and the line to Indonesia; large in the
          close-up, then fading near the landing for a clean hand-over */}
      <HolyPlaces
        projection={projection}
        opacity={at.holyOpacity}
        size={22 * at.iconScale}
        reveal={at.reveal}
        labels={{
          makkah: t("holy.makkah", "Makkah"),
          madinah: t("holy.madinah", "Madinah"),
          quds: t("holy.quds", "Al-Quds"),
        }}
      />
    </svg>
  );
}
