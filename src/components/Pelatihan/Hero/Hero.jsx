import React, { useState, useEffect } from "react";
import { Overlay, Text, Title, Container } from "@mantine/core";
import { useTranslation } from "react-i18next";
import styles from "./Hero.module.css";
import HeroImage from "../../../assets/imgs/pelatihan/pelatihannewhero.jpg";

const Hero = () => {
  const { t, i18n } = useTranslation("homepage/Hero");
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const subtitle = t("subtitle");

  return (
    <div
      id="home"
      className={styles.hero}
      style={{ backgroundImage: `url(${HeroImage})` }}
    >
      <Container className={styles.content}>
        <Title order={1} className={styles.title}>
          PELATIHAN TADARUS 5T
        </Title>
        <Text className={styles.subtitle}>
          Merupakan kegiatan pelatihan untuk para dai dan guru Qur’an yang akan dikader menjadi trainer atau pengajar Tadarus metode 5T.
        </Text>

      </Container>
    </div>
  );
};

export default Hero;
