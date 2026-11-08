import { useState, useEffect } from "react";
import { Button, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import styles from "./Hero.module.css";

// The 5T steps around the logo; descriptions live in homepage/Methods.
const PILLARS = ["tamhid", "tilawah", "tafsir", "tadabbur", "tazkiyah"];
const STEP_MS = 4200; // each step stays lit this long
// The orbit path as an SVG circle (viewBox 0 0 100 100), for the gold trail.
const RADIUS = 49.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const Hero = () => {
  const { t, i18n } = useTranslation("homepage/Hero");
  const { t: tMethods } = useTranslation("homepage/Methods");
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const subtitle = t("subtitle");

  // 5T journey: the steps light up in turn; a visitor pointing at one takes over.
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    // A hold ends by itself too: on phones a tap never sends "mouse leave".
    const timer = held
      ? setTimeout(() => setHeld(false), 12000)
      : setTimeout(() => setActive((a) => (a + 1) % PILLARS.length), STEP_MS);
    return () => clearTimeout(timer);
  }, [active, held]);

  // Reset typewriter effect when language changes
  useEffect(() => {
    setDisplayedSubtitle("");
    setCurrentIndex(0);
  }, [i18n.language]);

  // Typewriter effect
  useEffect(() => {
    if (currentIndex < subtitle.length) {
      const timeout = setTimeout(() => {
        setDisplayedSubtitle((prev) => prev + subtitle[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 60);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, subtitle, i18n.language]);

  // The trail runs from step 1 to the active step (each step is a fifth of the orbit).
  const trail = (CIRCUMFERENCE * active) / PILLARS.length;
  const key = PILLARS[active];
  const rtl = i18n.language === "ar";

  const point = (index) => {
    setActive(index);
    setHeld(true);
  };

  const steps = (
    <div className={styles.stage}>
      <div className={styles.disk} />
      <div className={styles.stageGlow} />
      <img src="/MTIFavicon.png" alt="" className={styles.centerMark} />

      {/* 5T Methodology Sacred Orbit */}
      <div className={`${styles.orbitContainer} ${held ? styles.orbitHeld : ""}`}>
        <div className={styles.orbitPath}></div>
        <svg className={styles.trail} viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            pathLength={CIRCUMFERENCE}
            strokeDasharray={`${trail} ${CIRCUMFERENCE}`}
          />
        </svg>

        {PILLARS.map((pillar, index) => (
          <div key={pillar} className={`${styles.nodeWrapper} ${styles[`wrapper${index + 1}`]}`}>
            <button
              type="button"
              className={`${styles.node} ${index === active ? styles.nodeActive : ""} ${index < active ? styles.nodeDone : ""}`}
              aria-pressed={index === active}
              aria-label={t(`pillars.t${index + 1}`)}
              onMouseEnter={() => point(index)}
              onMouseLeave={() => setHeld(false)}
              onFocus={() => point(index)}
              onBlur={() => setHeld(false)}
              onClick={() => point(index)}
            >
              <span className={styles.number}>{index + 1}</span>
              <span className={styles.label} data-lang={i18n.language}>
                {t(`pillars.t${index + 1}`)}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div id="home" className={styles.hero}>

      <div className={styles.inner} dir={rtl ? "rtl" : "ltr"}>
        <div className={styles.content}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            {t("tagline")}
          </span>
          <Title order={1} className={styles.title}>
            {t("title")}
          </Title>
          <Text className={styles.subtitle}>{displayedSubtitle}</Text>

          {/* What the lit step means; re-keyed so each step animates in. */}
          <div className={styles.stepCard} aria-live="polite">
            <div key={`${key}-${i18n.language}`} className={styles.stepCardInner}>
              <span className={styles.stepBadge}>
                {active + 1}
                <small>/5</small>
              </span>
              <span className={styles.stepText}>
                <strong>{t(`pillars.t${active + 1}`)}</strong>
                {tMethods(`methods.${key}.description`)}
              </span>
            </div>
            <div className={styles.stepDots} dir="ltr">
              {PILLARS.map((pillar, index) => (
                <button
                  type="button"
                  key={pillar}
                  className={index === active ? styles.dotOn : ""}
                  aria-label={t(`pillars.t${index + 1}`)}
                  onClick={() => setActive(index)}
                />
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <Button size="lg" className={styles.button} component="a" href="#programs">
              {t("cta_button")}
            </Button>
            <a className={styles.ghost} href="#about">
              {t("about_button")}
            </a>
          </div>
        </div>

        {steps}
      </div>
    </div>
  );
};

export default Hero;
