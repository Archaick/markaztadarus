import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FIVE, TINT, star } from "../Guru/Sky";
import styles from "./GlobalPage.module.css";

const STEP_MS = 620;
// scattered in the two upper corners, clear of the globe: Tamhid and Tilawah on one side,
// Tafsir, Tadabbur and Tazkiyah on the other (x within that side's open sky, y down the stage)
const SCATTER = [
  { side: 0, x: 0.3, y: 0.3 },
  { side: 0, x: 0.75, y: 0.1 },
  { side: 1, x: 0.22, y: 0.08 },
  { side: 1, x: 0.62, y: 0.2 },
  { side: 1, x: 0.4, y: 0.38 },
];

/** Where the globe's disc is on the stage right now, measured from the globe itself. */
function discOf(el, W, H) {
  const sphere = el.parentElement?.querySelector('path[fill^="url(#wg-ocean"]');
  const box = sphere?.getBoundingClientRect();
  if (!box?.width) return { cx: W / 2, cy: H / 2, r: Math.min(W, H) * 0.42 };
  const at = el.getBoundingClientRect();
  return { cx: box.left - at.left + box.width / 2, cy: box.top - at.top + box.height / 2, r: box.width / 2 };
}

/**
 * The five stars of the 5T in the sky behind the globe, the same stars as Tadarus Guru:
 * they light one by one when the page opens (from the right in Arabic), then
 * keep twinkling quietly. Only over the whole world; they fade when a country
 * is open, so the map stays clear.
 */
export default function FiveStars({ hidden = false }) {
  const { t } = useTranslation("global/Global");
  const canvas = useRef(null);
  const names = useRef([]);
  names.current = FIVE.map((k) => t(`fiveT.${k}`));

  useEffect(() => {
    const el = canvas.current;
    const c = el.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const shares = FIVE.map(() => (still ? 1 : 0));
    let id;
    let last = 0;
    const draw = (now) => {
      id = requestAnimationFrame(draw);
      if (now - last < 40) return;
      last = now;
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
      const ratio = Math.min(1.5, window.devicePixelRatio || 1);
      if (el.width !== Math.round(W * ratio) || el.height !== Math.round(H * ratio)) {
        el.width = Math.round(W * ratio);
        el.height = Math.round(H * ratio);
      }
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      c.clearRect(0, 0, W, H);
      const rtl = getComputedStyle(el).direction === "rtl";
      const phone = W < 700;
      // small and quiet: background stars, the globe stays the main thing
      const scale = phone ? 0.34 : 0.4;
      const { cx, cy, r } = discOf(el, W, H);
      const edge = phone ? 30 : 40;
      // the open sky on each side of the globe
      const gap = r * 1.12;
      const sides = [
        [edge, cx - gap],
        [cx + gap, W - edge],
      ];
      const roomy = sides.every(([a, b]) => b - a > 110);
      // a phone has no room beside the globe: a low arc above it instead
      const phoneAt = [0.1, 0.3, 0.5, 0.7, 0.9].map((f, i) => [rtl ? W * (1 - f) : W * f, Math.max(34, cy - r - [50, 62, 68, 62, 50][i])]);
      const at =
        phone || !roomy
          ? phoneAt
          : SCATTER.map((s) => {
              const [a, b] = sides[s.side];
              const x = a + (b - a) * s.x;
              // mirrored in Arabic, so Tamhid is on the right
              return [rtl ? 2 * cx - x : x, Math.max(34, H * s.y + 20)];
            });
      const lit = Math.floor((now - start) / STEP_MS);
      c.globalCompositeOperation = "lighter";
      at.forEach(([x, y], i) => {
        if (!still && i < lit) shares[i] += (1 - shares[i]) * 0.12;
        const size = (shares[i] > 0.01 ? 0.4 + 0.6 * shares[i] : 0.12) * scale;
        star(c, x, y, size, TINT[i], still ? 1 : 0.9 + 0.1 * Math.sin((now / 1000) * 2.1 + i * 1.3));
      });
      c.globalCompositeOperation = "source-over";
      c.font = `500 ${phone ? 9 : 10.5}px Inter, system-ui, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "bottom";
      at.forEach(([x, y], i) => {
        c.fillStyle = `rgba(255,255,255,${0.18 + 0.27 * shares[i]})`;
        // above the star, so the globe never covers the name
        c.fillText(names.current[i], x, y - (phone ? 10 : 13));
      });
      if (still) cancelAnimationFrame(id);
    };
    id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, []);

  return <canvas ref={canvas} className={`${styles.fiveStars} ${hidden ? styles.fiveStarsHidden : ""}`} aria-hidden="true" />;
}
