// The globe's three acts, as a function of progress 0–1:
//   1. a close-up of the Haramain and Al-Aqsa (held for a moment),
//   2. the camera pulls back to the whole Earth while the line from Makkah
//      draws itself to Indonesia,
//   3. the flight down to Indonesia, ending exactly on the flat map's view.
// A view is { lambda, phi, scale } (orthographic rotate + scale).

export const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const span = (p, from, to) => clamp01((p - from) / (to - from));

const HOLD = 0.12; // end of act 1
const OUT = 0.42; // end of act 2

// Between Makkah, Madinah and Al-Quds.
export const HARAMAIN_CENTRE = [38.6, 26];

const mix = (a, b, t) => ({
  lambda: a.lambda + (b.lambda - a.lambda) * t,
  phi: a.phi + (b.phi - a.phi) * t,
  // zooming feels even when the scale changes geometrically
  scale: a.scale * Math.pow(b.scale / a.scale, t),
});

/** The close-up that opens the story, for a globe whose whole-Earth view is `globe`. */
export const closeUpOf = (globe, zoom = 3.4) => ({
  lambda: -HARAMAIN_CENTRE[0],
  phi: -HARAMAIN_CENTRE[1],
  scale: globe.scale * zoom,
});

/**
 * Where the camera is at `p`, how far the Makkah line is drawn (`reveal`),
 * how big the landmark icons are relative to normal (`iconScale`), and how
 * visible they still are (`holyOpacity`, fading out near the landing).
 */
export function flightAt(p, { close, globe, end }) {
  const zoomOut = ease(span(p, HOLD, OUT));
  const fly = ease(span(p, OUT, 1));
  const view = p < OUT ? mix(close, globe, zoomOut) : mix(globe, end, fly);
  return {
    view,
    fly,
    reveal: ease(span(p, HOLD + 0.04, OUT + 0.08)),
    // large and detailed in the close-up, normal once the whole Earth shows
    iconScale: p < OUT ? Math.min(2.6, Math.max(1, Math.pow(view.scale / globe.scale, 0.55))) : 1,
    holyOpacity: clamp01((0.9 - fly) / 0.3),
  };
}
