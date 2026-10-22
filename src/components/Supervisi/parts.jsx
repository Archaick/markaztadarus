import { useEffect, useState } from "react";
import { IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";

/** A white ring, gold while under way and green when complete (as in Tadarus Build). */
export function ProgressRing({ value = 0, size = 96, label }) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = Math.round(size * 0.09);
  const r = (size - stroke) / 2 - 4;
  const c = 2 * Math.PI * r;
  const done = v >= 100;
  return (
    <span className={styles.ring} style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true" className={styles.ringTrack}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6ebf0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? "#5fb58a" : "#cc9933"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(c * v) / 100} ${c}`}
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
      </svg>
      {done ? (
        <IconCheck size={size * 0.42} stroke={3} color="#5fb58a" className={styles.ringValue} />
      ) : (
        <span className={styles.ringValue} style={{ fontSize: size * 0.24 }}>
          {label ?? `${Math.round(v)}%`}
        </span>
      )}
    </span>
  );
}

export function StatusChip({ status }) {
  const { t } = useTranslation(NS);
  const cls = { draft: styles.chipDraft, observing: styles.chipObserving, done: styles.chipDone }[status] || "";
  return <span className={`${styles.chip} ${cls}`}>{t(`status.${status || "draft"}`)}</span>;
}

/** A number that counts up to `value` (eased, under a second). */
export function useCountUp(value, ms = 900) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    let frame;
    const begin = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - begin) / ms);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, ms]);
  return shown;
}

/** A key number with its icon; `decimals` for averages, which show "–" while there are none. */
export function Stat({ icon: Icon, value, label, decimals = 0 }) {
  const shown = useCountUp(value || 0);
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon}>
        <Icon size={22} />
      </span>
      <div>
        <div className={styles.statValue}>{decimals && !value ? "–" : shown.toFixed(decimals)}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

/** "12 Okt 2026" from an ISO date (yyyy-mm-dd) or a Firestore timestamp. */
export function useDateFormat() {
  const { i18n } = useTranslation();
  const locale = { id: "id-ID", en: "en-GB", ar: "ar-u-nu-latn" }[(i18n.language || "id").slice(0, 2)] || "id-ID";
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const short = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  const toDate = (v) => (!v ? null : v.toDate ? v.toDate() : typeof v === "string" ? new Date(`${v}T00:00:00`) : new Date(v));
  return {
    long: (v) => (toDate(v) ? fmt.format(toDate(v)) : ""),
    short: (v) => (toDate(v) ? short.format(toDate(v)) : ""),
  };
}
