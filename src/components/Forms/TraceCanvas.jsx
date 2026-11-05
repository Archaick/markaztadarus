import { useEffect, useRef, useState } from "react";
import styles from "./PublicForm.module.css";

// One word to trace, after the tracing question in Jisr. The word shows as an
// outline, and a second canvas off screen holds it in solid black: after every
// stroke the ink layer is composited against that mask, so ink outside the
// letters disappears and nothing can go over the outline. A grid of the letters
// follows how much has been traced; the dots and marks do not count towards it.

const FONT_STACK = '"Amiri", "Noto Naskh Arabic", "Traditional Arabic", "Times New Roman", serif';
export const INK = "#0b3366";
const REF = 100; // measuring size (px)
const STROKE_WIDTH = 14;
const CELL_SIZE = 6; // the coverage grid (px)
const STEP_PX = 3; // sub-stepping along a stroke
const DONE_AT = 0.9;
// a pen pass fills the letter it walks through, stopping at gaps between letters
const SEED_CELLS = 3;
const FLOOD_HOPS = 5; // these boxes are smaller than Jisr's: one stroke should not fill the bar
const FLOOD_VISITS = 700;
const BODY_RATIO = 0.2; // smaller parts than this share of the largest are dots and marks

// The word measured by its real ink, marks included, and fitted both ways.
function layoutWord(text, w, h) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${REF}px ${FONT_STACK}`;
  // measured the way it is drawn (paintWord), or the sides come out wrong
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "rtl";
  const m = ctx.measureText(text);
  const left = m.actualBoundingBoxLeft ?? m.width / 2;
  const right = m.actualBoundingBoxRight ?? m.width / 2;
  const ascent = m.actualBoundingBoxAscent ?? REF * 0.8;
  const descent = m.actualBoundingBoxDescent ?? REF * 0.3;
  const scale = Math.min((w * 0.88) / (left + right), (h * 0.84) / (ascent + descent));
  const fontSize = Math.max(14, Math.floor(REF * scale));
  const k = fontSize / REF;
  return { text, fontSize, x: w / 2 - ((right - left) / 2) * k, y: (h - (ascent + descent) * k) / 2 + ascent * k };
}

function paintWord(ctx, layout, method) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "rtl";
  ctx.font = `${layout.fontSize}px ${FONT_STACK}`;
  ctx[method](layout.text, layout.x, layout.y);
}

// The letters on a grid, with which cells count (letter bodies, not dots and marks).
function letterGrid(layout, w, h) {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000";
  paintWord(ctx, layout, "fillText");
  const img = ctx.getImageData(0, 0, w, h).data;
  const cols = Math.floor(w / CELL_SIZE);
  const rows = Math.floor(h / CELL_SIZE);
  const mask = new Uint8Array(cols * rows);
  for (let cy = 0; cy < rows; cy += 1) {
    for (let cx = 0; cx < cols; cx += 1) {
      const i = ((cy * CELL_SIZE + (CELL_SIZE >> 1)) * w + cx * CELL_SIZE + (CELL_SIZE >> 1)) * 4;
      if (img[i + 3] > 96) mask[cy * cols + cx] = 1;
    }
  }
  const labels = new Int32Array(mask.length);
  const sizes = [0];
  for (let begin = 0; begin < mask.length; begin += 1) {
    if (!mask[begin] || labels[begin]) continue;
    const label = sizes.length;
    let size = 0;
    const stack = [begin];
    while (stack.length) {
      const at = stack.pop();
      if (labels[at]) continue;
      labels[at] = label;
      size += 1;
      const cx = at % cols;
      const cy = (at - cx) / cols;
      if (cx + 1 < cols && mask[at + 1] && !labels[at + 1]) stack.push(at + 1);
      if (cx > 0 && mask[at - 1] && !labels[at - 1]) stack.push(at - 1);
      if (cy + 1 < rows && mask[at + cols] && !labels[at + cols]) stack.push(at + cols);
      if (cy > 0 && mask[at - cols] && !labels[at - cols]) stack.push(at - cols);
    }
    sizes.push(size);
  }
  const smallest = Math.max(1, Math.floor(Math.max(...sizes) * BODY_RATIO));
  const required = new Uint8Array(mask.length);
  let total = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if (labels[i] && sizes[labels[i]] >= smallest) {
      required[i] = 1;
      total += 1;
    }
  }
  return { mask, required, cols, rows, total };
}

/** `done`: already traced (the word shows in full). `onDone` runs when the bar first fills. */
export default function TraceCanvas({ word, done, disabled, onDone }) {
  const box = useRef(null);
  const guide = useRef(null);
  const ink = useRef(null);
  const maskCanvas = useRef(null);
  const grid = useRef({ mask: new Uint8Array(0), required: new Uint8Array(0), cols: 0, rows: 0, total: 0 });
  const covered = useRef(new Uint8Array(0));
  const last = useRef(null);
  const reported = useRef(done);
  const wasDone = useRef(done);
  const [percent, setPercent] = useState(done ? 100 : 0);

  useEffect(() => {
    const setup = () => {
      const el = box.current;
      if (!el) return;
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (!w || !h) return;
      const dpr = window.devicePixelRatio || 1;
      [guide.current, ink.current].forEach((c) => {
        c.width = w * dpr;
        c.height = h * dpr;
        c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
      });
      const layout = layoutWord(word, w, h);

      const guideCtx = guide.current.getContext("2d");
      guideCtx.strokeStyle = "rgba(15, 23, 42, 0.55)";
      guideCtx.lineWidth = Math.max(1, layout.fontSize * 0.012);
      guideCtx.lineJoin = "round";
      paintWord(guideCtx, layout, "strokeText");

      const off = document.createElement("canvas");
      off.width = w * dpr;
      off.height = h * dpr;
      const offCtx = off.getContext("2d");
      offCtx.scale(dpr, dpr);
      offCtx.fillStyle = "#000";
      paintWord(offCtx, layout, "fillText");
      maskCanvas.current = off;

      const inkCtx = ink.current.getContext("2d");
      inkCtx.lineCap = "round";
      inkCtx.lineJoin = "round";
      inkCtx.strokeStyle = INK;
      inkCtx.lineWidth = Math.max(STROKE_WIDTH, Math.round(layout.fontSize * 0.18));
      grid.current = letterGrid(layout, w, h);
      covered.current = new Uint8Array(grid.current.mask.length);
      // coming back to a word already traced: it stays traced
      if (wasDone.current) {
        inkCtx.fillStyle = INK;
        paintWord(inkCtx, layout, "fillText");
      }
    };
    setup();
    const watch = new ResizeObserver(setup);
    watch.observe(box.current);
    // the Arabic font may arrive after the first drawing; the canvas alone does not ask for it
    let live = true;
    document.fonts?.load?.(`40px Amiri`, word).then(() => live && setup()).catch(() => {});
    return () => {
      live = false;
      watch.disconnect();
    };
  }, [word]);

  const pointOf = (e) => {
    const r = ink.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // fills connected letter cells around the pen; gaps between letters stop it
  const coverPoint = (x, y) => {
    const { cols, rows, mask } = grid.current;
    const cx0 = Math.floor(x / CELL_SIZE);
    const cy0 = Math.floor(y / CELL_SIZE);
    if (cx0 < 0 || cx0 >= cols || cy0 < 0 || cy0 >= rows) return;
    const queue = [];
    const seen = new Uint8Array(cols * rows);
    for (let dy = -SEED_CELLS; dy <= SEED_CELLS; dy += 1) {
      for (let dx = -SEED_CELLS; dx <= SEED_CELLS; dx += 1) {
        const cx = cx0 + dx;
        const cy = cy0 + dy;
        if (cx < 0 || cx >= cols || cy < 0 || cy >= rows || dx * dx + dy * dy > SEED_CELLS * SEED_CELLS) continue;
        const at = cy * cols + cx;
        if (mask[at] && !seen[at]) {
          seen[at] = 1;
          queue.push(at, FLOOD_HOPS);
        }
      }
    }
    let visits = 0;
    for (let head = 0; head < queue.length && visits < FLOOD_VISITS; head += 2) {
      const at = queue[head];
      const hops = queue[head + 1];
      visits += 1;
      covered.current[at] = 1;
      if (!hops) continue;
      const cx = at % cols;
      const cy = (at - cx) / cols;
      [cx + 1 < cols ? at + 1 : -1, cx > 0 ? at - 1 : -1, cy + 1 < rows ? at + cols : -1, cy > 0 ? at - cols : -1].forEach((next) => {
        if (next < 0 || seen[next] || !mask[next]) return;
        seen[next] = 1;
        queue.push(next, hops - 1);
      });
    }
  };

  const stroke = (a, b) => {
    const canvas = ink.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    // anything outside the letters goes
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskCanvas.current, 0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.globalCompositeOperation = "source-over";

    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / STEP_PX));
    for (let i = 0; i <= steps; i += 1) coverPoint(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps);

    const { required, total } = grid.current;
    if (!total || reported.current) return;
    let count = 0;
    for (let i = 0; i < required.length; i += 1) if (required[i] && covered.current[i]) count += 1;
    const share = count / total;
    setPercent(Math.round(share * 100));
    if (share >= DONE_AT) {
      reported.current = true;
      setPercent(100);
      onDone();
    }
  };

  const start = (e) => {
    if (disabled) return;
    e.preventDefault();
    try {
      ink.current.setPointerCapture(e.pointerId);
    } catch {
      // the pen just has to stay on the box
    }
    last.current = pointOf(e);
    stroke(last.current, last.current);
  };
  const move = (e) => {
    if (!last.current || disabled) return;
    e.preventDefault();
    const p = pointOf(e);
    stroke(last.current, p);
    last.current = p;
  };
  const end = () => {
    last.current = null;
  };

  return (
    <div className={styles.traceCell}>
      <div ref={box} className={`${styles.traceBox} ${percent >= 100 ? styles.traceDone : ""}`}>
        <canvas ref={guide} className={styles.traceGuide} />
        <canvas ref={ink} className={styles.traceInk} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} onPointerCancel={end} aria-label={word} />
      </div>
      <div className={styles.traceBar}>
        <span style={{ width: `${percent}%` }} className={percent >= 100 ? styles.traceBarFull : ""} />
      </div>
    </div>
  );
}
