import { useEffect, useRef } from "react";
import { fiveTOf } from "../Belajar/belajarSchema";

export const FIVE = ["tamhid", "tilawah", "tafsir", "tadabbur", "tazkiyah"];
export const FIVE_COLOR = { tamhid: "#f08a3c", tilawah: "#f4ad3a", tafsir: "#fbc94f", tadabbur: "#f2725b", tazkiyah: "#e8577e" };
const TINT = ["#bcd4ff", "#aef0e6", "#b8f5c4", "#ffe0a0", "#ffc4b8"];

/** The 5T names written faintly under the stars, in the reader's language. */
export const fiveNames = (t) => FIVE.map((k) => t(`fiveT.${k}`));

/** How far each T has come, 0 to 1, from anything tagged with a T and done or not. */
export const sharesOf = (items) =>
  Object.fromEntries(
    FIVE.map((t) => {
      const of = items.filter((x) => x.t === t);
      return [t, of.length ? of.filter((x) => x.done).length / of.length : 0];
    })
  );

/** A surah's steps as the sky needs them. */
export const stepItems = (steps) => steps.map((s) => ({ t: fiveTOf(s.section), done: s.state === "done" }));

/** The same, while a section is being answered (`frac` of it so far). */
export const quizShares = (steps, sectionId, frac) =>
  Object.fromEntries(
    FIVE.map((t) => {
      const of = steps.filter((s) => fiveTOf(s.section) === t);
      if (!of.length) return [t, 0];
      const sum = of.reduce((n, s) => n + (s.state === "done" ? 1 : s.section.id === sectionId ? frac : 0), 0);
      return [t, sum / of.length];
    })
  );

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const toRgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const mix = (a, b, t) => {
  const A = toRgb(a);
  const B = toRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};
const rgba = (h, a) => `rgba(${toRgb(h).join(",")},${a})`;

// the small background stars, fixed so they do not jump between frames
const DUST = Array.from({ length: 110 }, (_, k) => ({ x: (k * 0.6180339) % 1, y: ((k * 0.7548776) % 1) ** 1.3, r: 0.5 + (k % 4) * 0.32, p: k * 1.7 }));

const STAR_X = [0.1, 0.27, 0.5, 0.73, 0.9];
const SHAPES = {
  full: (W) => {
    const span = Math.min(W * 0.9, 860);
    const scale = W < 600 ? 0.72 : 1;
    return { scale, words: W < 600 ? 10 : 11.5, at: STAR_X.map((f, i) => [W / 2 + (f - 0.5) * span, [96, 86, 80, 86, 96][i]]) };
  },
  card: (W, H) => ({ scale: 0.72, words: 10.5, at: STAR_X.map((f, i) => [W / 2 + (f - 0.5) * Math.min(W * 0.92, 420), H * [0.5, 0.36, 0.28, 0.36, 0.5][i]]) }),
  thumb: (W, H) => ({ scale: 0.2, words: 0, at: STAR_X.map((f, i) => [W * f, H * [0.62, 0.42, 0.3, 0.42, 0.62][i]]) }),
};

function spike(c, x, y, angle, len, width, color, alpha) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  const g = c.createLinearGradient(-len, 0, len, 0);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(0.5, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  c.fillStyle = g;
  c.fillRect(-len, -width / 2, len * 2, width);
  c.restore();
}

/** One star: a soft halo, long cross-shaped glints and a white-hot centre. */
function star(c, x, y, s, color, twinkle) {
  const R = 46 * s;
  const halo = c.createRadialGradient(x, y, 0, x, y, R);
  halo.addColorStop(0, rgba(color, 0.75));
  halo.addColorStop(0.18, rgba(color, 0.26));
  halo.addColorStop(0.55, rgba(color, 0.06));
  halo.addColorStop(1, rgba(color, 0));
  c.fillStyle = halo;
  c.beginPath();
  c.arc(x, y, R, 0, 7);
  c.fill();
  const L = 62 * s * twinkle;
  spike(c, x, y, 0, L, 1.3, "#ffffff", 0.95);
  spike(c, x, y, Math.PI / 2, L, 1.3, "#ffffff", 0.95);
  spike(c, x, y, 0, L * 0.7, 4, color, 0.3);
  spike(c, x, y, Math.PI / 2, L * 0.7, 4, color, 0.3);
  spike(c, x, y, Math.PI / 4, L * 0.34, 1, "#ffffff", 0.55);
  spike(c, x, y, -Math.PI / 4, L * 0.34, 1, "#ffffff", 0.55);
  const r = 7 * s + 1.5;
  const core = c.createRadialGradient(x, y, 0, x, y, r);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(0.5, "rgba(255,255,255,0.75)");
  core.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = core;
  c.beginPath();
  c.arc(x, y, r, 0, 7);
  c.fill();
}

function paint(c, W, H, mode, state, names, t, now) {
  const shape = SHAPES[mode](W, H);
  const p = state.progress;
  const night = p < 0.6 ? p / 0.6 : 1;
  const day = p < 0.6 ? 0 : (p - 0.6) / 0.4;
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, day ? mix("#2c5f94", "#7fb0e0", day) : mix("#081a35", "#2c5f94", night));
  sky.addColorStop(1, day ? mix("#b9a39a", "#f3c9a2", day) : mix("#122a4e", "#b9a39a", night));
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);

  c.globalCompositeOperation = "lighter";
  const seen = clamp(0.3 + p * 2.5) * (1 - clamp((p - 0.55) * 2.2));
  DUST.forEach((d, i) => {
    if (mode === "thumb" && i % 5) return; // a tiny sky needs only a few
    c.fillStyle = `rgba(255,255,255,${seen * (0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.4 + d.p)))})`;
    c.beginPath();
    c.arc(d.x * W, d.y * H, mode === "thumb" ? d.r * 0.5 : d.r, 0, 7);
    c.fill();
  });

  // each new light sends a wave across the whole page
  state.bursts.forEach((b) => {
    const a = (now - b.t) / 1300;
    if (a < 0 || a > 1) return;
    const [x, y] = shape.at[b.i];
    const R = a * Math.hypot(W, H) * 1.05 + 1;
    const fade = (1 - a) * (1 - a);
    const g = c.createRadialGradient(x, y, R * 0.1, x, y, R);
    g.addColorStop(0, rgba(TINT[b.i], 0.42 * fade));
    g.addColorStop(0.75, rgba(TINT[b.i], 0.16 * fade));
    g.addColorStop(1, rgba(TINT[b.i], 0));
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  });

  FIVE.forEach((k, i) => {
    const f = state.shares[k] || 0;
    const swell = state.bursts.filter((b) => b.i === i).reduce((m, b) => Math.max(m, 1 - (now - b.t) / 700), 0);
    const size = (f > 0.004 ? 0.42 + 0.58 * f + clamp(swell) * 0.7 : 0.1) * shape.scale;
    star(c, shape.at[i][0], shape.at[i][1], size, TINT[i], 0.86 + 0.14 * Math.sin(t * 2.1 + i * 1.3));
  });
  c.globalCompositeOperation = "source-over";

  // the small see-through names under the stars
  if (names && shape.words) {
    c.font = `500 ${shape.words}px Inter, system-ui, sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "top";
    FIVE.forEach((k, i) => {
      c.fillStyle = `rgba(255,255,255,${(state.shares[k] || 0) > 0.004 ? 0.66 : 0.36})`;
      c.fillText(names[i], shape.at[i][0], shape.at[i][1] + 28 * shape.scale + 4);
    });
  }
}

/**
 * The teacher's sky: five real stars, one per T, on a page that moves from
 * night to dawn as the surah is finished. A star ignites and grows with its T,
 * and each correct answer (`fireKey`, for the T in `fireT`) sends a wave of
 * light across the whole page. `shares` is how far each T has come, `progress`
 * the whole surah, 0 to 1. `mode`: full (the whole screen), card or thumb.
 */
export default function Sky({ shares, progress, fireKey, fireT, names, celebrate, mode = "full", className, label }) {
  const canvas = useRef(null);
  const state = useRef({ shares: { ...shares }, progress, bursts: [] });
  const latest = useRef(null);
  latest.current = { shares, progress, names };

  useEffect(() => {
    const i = FIVE.indexOf(fireT);
    if (fireKey && i >= 0) state.current.bursts.push({ t: performance.now(), i });
  }, [fireKey, fireT]);

  useEffect(() => {
    if (!celebrate) return;
    const now = performance.now();
    FIVE.forEach((_, i) => state.current.bursts.push({ t: now + i * 180, i }));
  }, [celebrate]);

  useEffect(() => {
    const el = canvas.current;
    const c = el.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = (now) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
      const ratio = Math.min(mode === "full" ? 1.5 : 2, window.devicePixelRatio || 1);
      if (el.width !== Math.round(W * ratio) || el.height !== Math.round(H * ratio)) {
        el.width = Math.round(W * ratio);
        el.height = Math.round(H * ratio);
      }
      const s = state.current;
      const target = latest.current;
      FIVE.forEach((k) => (s.shares[k] = (s.shares[k] || 0) + ((target.shares[k] || 0) - (s.shares[k] || 0)) * 0.08));
      s.progress += (target.progress - s.progress) * 0.05;
      s.bursts = s.bursts.filter((b) => now - b.t < 1400);
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint(c, W, H, mode, s, target.names, still ? 1 : now / 1000, now);
    };
    // the small sky in a list is drawn once; the others keep moving, at a pace kind to phones
    if (mode === "thumb") {
      Object.assign(state.current, { shares: { ...latest.current.shares }, progress: latest.current.progress });
      draw(performance.now());
      return undefined;
    }
    let id;
    let last = 0;
    const loop = (now) => {
      id = requestAnimationFrame(loop);
      if (now - last < 32) return;
      last = now;
      draw(now);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [mode, shares, progress]);

  return <canvas ref={canvas} className={className} role="img" aria-label={label} />;
}
