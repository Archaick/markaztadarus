import { geoCentroid, geoContains } from "d3-geo";
import { ALL_PROVINCES } from "../HomePage/Map/mapGeometry";
import { hasCoords } from "../../data/coords";
import styles from "./WorldGlobe.module.css";

// How close the globe must be (its scale, in pixels per radian) for
// Indonesia's provinces, their program pins and the partner places to show.
export const SHOW_PROVINCES = 300;
export const SHOW_PINS = 520;
export const SHOW_PLACES = 900;

export const CENTROIDS = Object.fromEntries(ALL_PROVINCES.map((f) => [f.properties.PROVINSI, geoCentroid(f)]));

// gold: lighter for a few programs, deeper for many
const LOW = [246, 220, 140];
const HIGH = [168, 122, 0];
const shade = (ratio) => `rgb(${LOW.map((c, i) => Math.round(c + (HIGH[i] - c) * ratio)).join(", ")})`;
const INACTIVE = { day: ["#bccfe4", "#aac2dc"], night: ["#33609f", "#3d6bb0"] };

const pinRadius = (programs) => 9 + Math.min(programs, 9) * 0.5;

/** The pins (one per province with programs) and partner places (those given coordinates). */
export function provinceMarks(list) {
  const pins = list.filter((p) => CENTROIDS[p.name]).map((p) => ({ name: p.name, at: CENTROIDS[p.name], programs: p.programs }));
  const places = list.flatMap((p) =>
    (p.locations || []).flatMap((l, i) =>
      hasCoords(l) ? [{ key: `${p.name}-${i}`, province: p.name, index: i, name: [l.institution, l.city].filter(Boolean).join(" · "), at: [l.lng, l.lat] }] : []
    )
  );
  return { pins, places };
}

/**
 * What a tap at [x, y] (on the globe, at `point` on Earth) lands on among the
 * provinces: a partner place, a province's pin or the province itself, as
 * { province, place }; null when none or the globe is too far out.
 */
export function provinceAt([x, y], point, { projection, scale, marks, visible }) {
  if (!point || scale < SHOW_PROVINCES) return null;
  const near = (at, r) => {
    if (!visible(at)) return false;
    const [px, py] = projection(at);
    return Math.hypot(px - x, py - y) <= r;
  };
  if (scale >= SHOW_PLACES) {
    const place = marks.places.find((p) => near(p.at, 9));
    if (place) return { province: place.province, place: place.index };
  }
  if (scale >= SHOW_PINS) {
    const pin = marks.pins.find((p) => near(p.at, pinRadius(p.programs) + 3));
    if (pin) return { province: pin.name, place: null };
  }
  const shape = ALL_PROVINCES.find((f) => geoContains(f, point));
  return shape ? { province: shape.properties.PROVINSI, place: null } : null;
}

/** Indonesia's provinces, gold by how many programs each has; the picked one outlined, drawn last. */
export function ProvinceShapes({ path, provinces, totals, selected, hovered, theme }) {
  const [inactive, inactiveHover] = INACTIVE[theme] || INACTIVE.night;
  const fillOf = (name) => {
    const data = provinces[name];
    if (!data) return name === hovered ? inactiveHover : inactive;
    const programs = Number(data.programs) || data.locations?.length || 0;
    const ratio = totals.maxPrograms > 1 ? Math.max(0, programs - 1) / (totals.maxPrograms - 1) : 1;
    return shade(name === hovered ? Math.min(1, ratio + 0.25) : ratio);
  };
  const ordered = selected ? [...ALL_PROVINCES.filter((f) => f.properties.PROVINSI !== selected), ...ALL_PROVINCES.filter((f) => f.properties.PROVINSI === selected)] : ALL_PROVINCES;
  return (
    <g className={styles.provinces}>
      {ordered.map((f) => {
        const name = f.properties.PROVINSI;
        const d = path(f);
        return d ? <path key={name} d={d} fill={fillOf(name)} className={name === selected ? styles.provinceSelected : styles.province} /> : null;
      })}
    </g>
  );
}

/** Each province's program count on a pin, and the partner places as small dots. */
export function ProvinceMarks({ projection, scale, marks, selected, visible }) {
  return (
    <g pointerEvents="none">
      {scale >= SHOW_PLACES &&
        marks.places.map((p) => {
          if (!visible(p.at)) return null;
          const [x, y] = projection(p.at);
          return <circle key={p.key} cx={x} cy={y} r={4.2} className={`${styles.place} ${p.province === selected ? styles.placeSelected : ""}`} />;
        })}
      {scale >= SHOW_PINS &&
        marks.pins.map((p) => {
          if (!visible(p.at)) return null;
          const [x, y] = projection(p.at);
          return (
            <g key={p.name} transform={`translate(${x} ${y})`}>
              <circle r={11} className={styles.pinPulse} />
              <circle r={pinRadius(p.programs)} className={`${styles.pin} ${p.name === selected ? styles.pinSelected : ""}`} />
              <text dy="0.35em" className={styles.pinText}>
                {p.programs}
              </text>
            </g>
          );
        })}
    </g>
  );
}
