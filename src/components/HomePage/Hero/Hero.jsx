import React, { useState, useEffect } from "react";
import { Button, Overlay, Text, Title, Container } from "@mantine/core";
import { IconChevronCompactDown } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Hero.module.css";
import HeroImage from "../../../assets/imgs/homepage/hero.jpg";

const Hero = () => {
  const { t, i18n } = useTranslation("homepage/Hero");
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const subtitle = t("subtitle");

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

  return (
    <div id="home" className={styles.hero}>
      {/* 5T Methodology Sacred Orbit */}
      <div className={styles.orbitContainer}>
        <div className={styles.orbitPath}></div>
        
        <div className={`${styles.nodeWrapper} ${styles.wrapper1}`}>
          <div className={styles.node}>
            <span className={styles.number}>1</span>
            <span className={styles.label}>{t("pillars.t1")}</span>
          </div>
        </div>

        <div className={`${styles.nodeWrapper} ${styles.wrapper2}`}>
          <div className={styles.node}>
            <span className={styles.number}>2</span>
            <span className={styles.label}>{t("pillars.t2")}</span>
          </div>
        </div>

        <div className={`${styles.nodeWrapper} ${styles.wrapper3}`}>
          <div className={styles.node}>
            <span className={styles.number}>3</span>
            <span className={styles.label}>{t("pillars.t3")}</span>
          </div>
        </div>

        <div className={`${styles.nodeWrapper} ${styles.wrapper4}`}>
          <div className={styles.node}>
            <span className={styles.number}>4</span>
            <span className={styles.label}>{t("pillars.t4")}</span>
          </div>
        </div>

        <div className={`${styles.nodeWrapper} ${styles.wrapper5}`}>
          <div className={styles.node}>
            <span className={styles.number}>5</span>
            <span className={styles.label}>{t("pillars.t5")}</span>
          </div>
        </div>
      </div>

      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>

      <Container className={styles.content}>
        <span className={styles.tagline}>{t("tagline") || "Markaz Tadarus"}</span>
        <Title order={1} className={styles.title}>
          {t("title")}
        </Title>
        <Text
          className={styles.subtitle}
          dir={i18n.language === "ar" ? "rtl" : "ltr"}
        >
          {displayedSubtitle}
        </Text>
        
        <Button
          size="lg"
          className={styles.button}
          component="a"
          href="#programs"
        >
          {t("cta_button")}
        </Button>
      </Container>
    </div>
  );
};

export default Hero;
