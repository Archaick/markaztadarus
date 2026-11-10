import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Sky, { FIVE, fiveNames } from "./Sky";
import styles from "./Guru.module.css";

const STEP_MS = 620;

/**
 * The sign-in scene: the five stars of the 5T light one by one while night
 * turns to dawn, above still water, with light rising from an open mushaf.
 */
export default function DawnScene() {
  const { t } = useTranslation("guru/Guru");
  const [step, setStep] = useState(() => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? FIVE.length : 0));

  useEffect(() => {
    if (step >= FIVE.length) return undefined;
    const id = setTimeout(() => setStep(step + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [step]);

  const shares = useMemo(() => Object.fromEntries(FIVE.map((k, i) => [k, i < step ? 1 : 0])), [step]);

  return <Sky mode="hero" className={styles.skyFull} shares={shares} progress={0.1 + step * 0.14} fireKey={step || null} fireT={FIVE[step - 1]} names={fiveNames(t)} />;
}
