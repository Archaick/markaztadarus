import React from "react";
import { Button, Overlay, Text, Title, Container } from "@mantine/core";
import { IconChevronCompactDown } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Hero.module.css";
import HeroImage from "../../../assets/imgs/homepage/hero.jpg";

const Hero = () => {
  const { t } = useTranslation("homepage/Hero");

  return (
    <div
      id="home"
      className={styles.hero}
      style={{ backgroundImage: `url(${HeroImage})` }}
    >
      <Overlay
        gradient="linear-gradient(to bottom, rgba(10, 20, 50, 0.7), rgba(10, 20, 50, 0.9))"
        opacity={1}
        zIndex={1}
      />

      <Container className={styles.content}>
        <Title order={1} className={styles.title}>
          {t("title")}
        </Title>
        <Text className={styles.subtitle}>{t("subtitle")}</Text>

        <Button
          size="lg"
          radius="md"
          className={styles.button}
          component="a"
          href="#programs"
        >
          <span>{t("cta_button")}</span>
          <IconChevronCompactDown size={20} className={styles.chevron} />
        </Button>
      </Container>
    </div>
  );
};

export default Hero;
