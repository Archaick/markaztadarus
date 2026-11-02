import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@mantine/core";
import { IconEraser, IconUpload } from "@tabler/icons-react";
import { loadImage, pngWithin } from "../Internal/images";
import { useTranslation } from "react-i18next";
import styles from "./Supervisi.module.css";

const MAX_CHARS = 150000;

const NS = "internal/Supervisi";

/**
 * A signature drawn with a finger, pen or mouse, or uploaded as a picture
 * (a photo of a signature on paper: the paper is made transparent, so only
 * the ink stays). `ref.current.toDataUrl()` gives a trimmed PNG (or "" when
 * empty); `value` shows a saved one. `note` is a line under the pad.
 */
const SignaturePad = forwardRef(function SignaturePad({ label, name, value, onChange, note }, ref) {
  const { t } = useTranslation(NS);
  const canvas = useRef(null);
  const drawing = useRef(false);
  const file = useRef(null);
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
    try {
      canvas.current.setPointerCapture(e.pointerId);
    } catch {
      // a pointer the browser no longer tracks; drawing still works
    }
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

  // a picture of a signature: fitted into the pad, the light paper made see-through
  const upload = async (e) => {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!f) return;
    try {
      const img = await loadImage(f);
      const scale = Math.min(1, 900 / img.naturalWidth);
      const tmp = document.createElement("canvas");
      tmp.width = Math.max(1, Math.round(img.naturalWidth * scale));
      tmp.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const tctx = tmp.getContext("2d");
      tctx.drawImage(img, 0, 0, tmp.width, tmp.height);
      const pixels = tctx.getImageData(0, 0, tmp.width, tmp.height);
      const d = pixels.data;
      for (let i = 0; i < d.length; i += 4) {
        const light = (d[i] + d[i + 1] + d[i + 2]) / 3;
        // paper fades out, ink stays (and gets a little darker)
        const alpha = light > 200 ? 0 : light > 150 ? Math.round(((200 - light) / 50) * 255) : 255;
        d[i + 3] = Math.min(d[i + 3], alpha);
        d[i] = Math.round(d[i] * 0.7);
        d[i + 1] = Math.round(d[i + 1] * 0.7);
        d[i + 2] = Math.round(d[i + 2] * 0.75);
      }
      tctx.putImageData(pixels, 0, 0);
      const c = canvas.current;
      const ctx = c.getContext("2d");
      const { width, height } = c.getBoundingClientRect();
      ctx.clearRect(0, 0, c.width, c.height);
      const s = Math.min((width * 0.9) / tmp.width, (height * 0.85) / tmp.height);
      ctx.drawImage(tmp, (width - tmp.width * s) / 2, (height - tmp.height * s) / 2, tmp.width * s, tmp.height * s);
      setEmpty(false);
      onChange?.();
    } catch (err) {
      console.error("Could not read the signature picture:", err);
    }
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
      return pngWithin(out, MAX_CHARS);
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
        <span style={{ display: "inline-flex", gap: 2 }}>
          <Button size="xs" variant="subtle" color="gray" leftSection={<IconUpload size={14} />} onClick={() => file.current?.click()}>
            {t("sign.upload")}
          </Button>
          <Button size="xs" variant="subtle" color="gray" leftSection={<IconEraser size={14} />} onClick={clear}>
            {t("sign.clear")}
          </Button>
        </span>
        <input ref={file} type="file" accept="image/*" hidden onChange={upload} />
      </div>
      {note && <span className={styles.padNote}>{note}</span>}
    </div>
  );
});

export default SignaturePad;
