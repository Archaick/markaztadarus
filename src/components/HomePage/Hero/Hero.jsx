import { useState, useEffect } from "react";
import { Button, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import Sky, { FIVE, fiveNames } from "../../Guru/Sky";
import styles from "./Hero.module.css";

// The 5T steps around the logo; descriptions live in homepage/Methods.
const PILLARS = ["tamhid", "tilawah", "tafsir", "tadabbur", "tazkiyah"];
const STEP_MS = 4200; // each step stays lit this long
const Hero = () => {
  const { t, i18n } = useTranslation("homepage/Hero");
  const { t: tMethods } = useTranslation("homepage/Methods");
  const { t: tGuru } = useTranslation("guru/Guru");
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

  const key = PILLARS[active];
  const rtl = i18n.language === "ar";

  const point = (index) => {
    setActive(index);
    setHeld(true);
  };

  // The 5T steps in the /guru sign-in sky: the same five real stars over the open mushaf;
  // each step lights its star (with its wave of light), and the sky turns from night
  // towards dawn as the steps go on.
  const shares = Object.fromEntries(FIVE.map((k, i) => [k, i <= active ? 1 : 0.32]));
  return (
    <div id="home" className={`${styles.hero} ${styles.heroWide}`}>
      {/* the /guru sign-in sky behind the whole hero: the five stars over the mushaf, beside the words */}
      <div className={styles.wideSky} dir={rtl ? "rtl" : "ltr"} aria-hidden="true">
        <Sky mode="wide" className={styles.dawnCanvas} shares={shares} progress={0.16 + active * 0.16} fireKey={active + 1} fireT={FIVE[active]} names={fiveNames(tGuru)} />
      </div>

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
                  onClick={() => point(index)}
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

      </div>
    </div>
  );
};

export default Hero;
