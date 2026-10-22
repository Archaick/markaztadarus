import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@mantine/core";
import { IconEraser } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";

/**
 * A signature drawn with a finger, pen or mouse. `ref.current.toDataUrl()`
 * gives a trimmed PNG (or "" when empty); `value` shows a saved one.
 */
const SignaturePad = forwardRef(function SignaturePad({ label, name, value, onChange }, ref) {
  const { t } = useTranslation(NS);
  const canvas = useRef(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(!value);

  // size the canvas to its box (sharp on high-density screens) and draw any saved signature
  useEffect(() => {
    const c = canvas.current;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = c.getBoundingClientRect();
    c.width = Math.round(width * ratio);
    c.height = Math.round(height * ratio);
    const ctx = c.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f1f33";
    if (value) {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(width / img.width, height / img.height, 1);
        ctx.drawImage(img, (width - img.width * s) / 2, (height - img.height * s) / 2, img.width * s, img.height * s);
      };
      img.src = value;
    }
    // drawn once per mount; a saved value only seeds it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const point = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const down = (e) => {
    e.preventDefault();
    canvas.current.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvas.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(...point(e));
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvas.current.getContext("2d");
    ctx.lineTo(...point(e));
    ctx.stroke();
    if (empty) setEmpty(false);
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange?.();
  };
  const clear = () => {
    const c = canvas.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange?.();
  };

  useImperativeHandle(ref, () => ({
    isEmpty: () => empty,
    // the ink only, trimmed and at most 600 px wide, as a PNG
    toDataUrl: () => {
      if (empty) return "";
      const c = canvas.current;
      const ctx = c.getContext("2d");
      const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
      let [x0, y0, x1, y1] = [width, height, 0, 0];
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (data[(y * width + x) * 4 + 3] > 10) {
            if (x < x0) x0 = x;
            if (y < y0) y0 = y;
            if (x > x1) x1 = x;
            if (y > y1) y1 = y;
          }
        }
      }
      if (x1 <= x0 || y1 <= y0) return "";
      const pad = 8;
      const w = x1 - x0 + pad * 2;
      const h = y1 - y0 + pad * 2;
      const scale = Math.min(1, 600 / w);
      const out = document.createElement("canvas");
      out.width = Math.round(w * scale);
      out.height = Math.round(h * scale);
      out.getContext("2d").drawImage(c, x0 - pad, y0 - pad, w, h, 0, 0, out.width, out.height);
      return out.toDataURL("image/png");
    },
  }));

  return (
    <div className={styles.pad}>
      <span className={styles.padLabel}>{label}</span>
      <div className={styles.padBox}>
        <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
        {empty && <span className={styles.padHint}>{t("sign.hint")}</span>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span className={styles.padName} dir="auto">
          {name}
        </span>
        <Button size="xs" variant="subtle" color="gray" leftSection={<IconEraser size={14} />} onClick={clear}>
          {t("sign.clear")}
        </Button>
      </div>
    </div>
  );
});

export default SignaturePad;
