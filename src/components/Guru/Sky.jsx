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
// the sign-in scene: where the sky meets the water, leaving room below for the card
const horizonOf = (W, H) => Math.max(H * 0.4, Math.min(H * 0.58, H - 410));

const SHAPES = {
  hero: (W, H) => {
    const span = Math.min(W * 0.84, 760);
    const hz = horizonOf(W, H);
    const top = Math.max(96, hz * 0.2);
    const drop = Math.min(hz * 0.3, 64);
    return { scale: W < 600 ? 0.66 : 0.86, words: W < 600 ? 10 : 11.5, at: STAR_X.map((f, i) => [W / 2 + (f - 0.5) * span, top + [1, 0.45, 0, 0.45, 1][i] * drop]) };
  },
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

/** A soft pool of light. Stretched rather than stacked, so long beams keep smooth edges. */
function glow(c, x, y, rx, ry, color, alpha) {
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.45, rgba(color, alpha * 0.35));
  g.addColorStop(1, rgba(color, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, 1, 0, 7);
  c.fill();
  c.restore();
}

function ridge(c, W, base, height, seed, top, foot) {
  const g = c.createLinearGradient(0, base - height, 0, base);
  g.addColorStop(0, top);
  g.addColorStop(1, foot);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, base);
  for (let x = 0; x <= W + 8; x += 8) {
    const u = x / W;
    c.lineTo(x, base - height * (0.5 + 0.32 * Math.sin(u * 5.2 + seed) + 0.18 * Math.sin(u * 13 + seed * 2.3)));
  }
  c.lineTo(W, base);
  c.closePath();
  c.fill();
}

/** An open mushaf on its rehal, standing where the sky meets the water. Blank pages, on purpose. */
function mushaf(c, x, y, u, light) {
  c.save();
  c.translate(x, y);
  c.scale(u, u);
  c.lineCap = "round";
  c.strokeStyle = "#20140e";
  c.lineWidth = 4.5;
  c.beginPath();
  c.moveTo(-36, 2);
  c.lineTo(28, -30);
  c.moveTo(36, 2);
  c.lineTo(-28, -30);
  c.stroke();
  const page = (dir, dy, fill) => {
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(0, -24 + dy);
    c.bezierCurveTo(dir * 16, -38 + dy, dir * 42, -40 + dy, dir * 62, -31 + dy);
    c.lineTo(dir * 62, -23 + dy);
    c.bezierCurveTo(dir * 42, -32 + dy, dir * 16, -30 + dy, 0, -16 + dy);
    c.closePath();
    c.fill();
  };
  [-1, 1].forEach((dir) => {
    page(dir, 3, "#7a5a1e");
    page(dir, 0, mix("#6f7f99", "#fff3d2", light));
  });
  c.restore();
}

function scene(c, W, H, state, shape, t) {
  const p = state.progress;
  const hz = horizonOf(W, H);
  const cx = W / 2;
  const u = Math.max(0.72, Math.min(1.1, W / 820));
  const light = clamp(0.2 + p * 1.05);
  const breath = 0.9 + 0.1 * Math.sin(t * 1.1);
  const GOLD = "#ffd98a";

  c.globalCompositeOperation = "lighter";
  glow(c, cx, hz, W * 0.75, H * 0.34, "#f3b98a", 0.5 * clamp(p * 1.3));
  c.globalCompositeOperation = "source-over";

  ridge(c, W, hz + 2, Math.min(90, H * 0.11), 1.2, mix("#17335d", "#8fa7c4", p), mix("#1c3b69", "#c9b8ad", p));
  ridge(c, W, hz + 2, Math.min(52, H * 0.07), 3.9, mix("#0d2343", "#5f7da3", p), mix("#132c52", "#9aa6b6", p));

  const water = c.createLinearGradient(0, hz, 0, H);
  water.addColorStop(0, mix("#17335d", "#e3c7a8", p));
  water.addColorStop(0.35, mix("#102850", "#9fb4cd", p));
  water.addColorStop(1, mix("#081a35", "#3f6291", p));
  c.fillStyle = water;
  c.fillRect(0, hz, W, H - hz);

  c.globalCompositeOperation = "lighter";
  // the light rises from the open pages to the middle star, and lies on the water below
  const starY = shape.at[2][1];
  const rise = (hz - 28 * u - starY) / 2;
  glow(c, cx, starY + rise, 30 * u, rise * 1.2, GOLD, 0.24 * light * breath);
  glow(c, cx, starY + rise, 8 * u, rise * 1.15, "#fff4d6", 0.26 * light * breath);
  glow(c, cx, hz - 28 * u, 130 * u, 70 * u, GOLD, 0.26 * light * breath);
  glow(c, cx, hz + (H - hz) * 0.34, 46 * u, (H - hz) * 0.5, GOLD, 0.3 * light * breath);

  // shimmer on the water, wider as it comes nearer
  c.lineCap = "round";
  for (let i = 0; i < 16; i++) {
    const k = i / 15;
    const y = hz + 8 + k * k * (H - hz - 12);
    const half = (14 + k * 62) * u * (0.6 + 0.4 * Math.sin(t * 0.9 + i * 2.1));
    const drift = Math.sin(t * 0.6 + i * 1.3) * 7 * u;
    c.strokeStyle = rgba("#fff0c8", (0.34 - k * 0.2) * light);
    c.lineWidth = 1 + k * 1.4;
    c.beginPath();
    c.moveTo(cx - half + drift, y);
    c.lineTo(cx + half + drift, y);
    c.stroke();
  }

  // slow rings spreading from the foot of the stand
  for (let i = 0; i < 3; i++) {
    const a = (t * 0.1 + i / 3) % 1;
    c.strokeStyle = `rgba(255,255,255,${0.26 * (1 - a) * clamp(a * 6)})`;
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(cx, hz + 10, (46 + a * 190) * u, (5 + a * 22) * u, 0, 0, 7);
    c.stroke();
  }
  c.globalCompositeOperation = "source-over";

  glow(c, cx, hz + 7, 74 * u, 8 * u, "#0a1a30", 0.75);
  mushaf(c, cx, hz + 4, u, light);
  c.globalCompositeOperation = "lighter";
  glow(c, cx, hz - 40 * u, 26 * u, 18 * u, "#fff4d6", 0.34 * light * breath);
  c.globalCompositeOperation = "source-over";
}

function paint(c, W, H, mode, state, names, t, now) {
  const layout = SHAPES[mode](W, H);
  // in Arabic the 5T read from the right, so Tamhid lights first on that side
  const shape = getComputedStyle(c.canvas).direction === "rtl" ? { ...layout, at: layout.at.map(([x, y]) => [W - x, y]) } : layout;
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

  if (mode === "hero") scene(c, W, H, state, shape, t);
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
      const ratio = Math.min(mode === "full" || mode === "hero" ? 1.5 : 2, window.devicePixelRatio || 1);
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
