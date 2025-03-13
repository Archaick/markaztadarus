import React from "react";
import { Button, Overlay, Text, Title, Container } from "@mantine/core";
import { IconChevronCompactDown } from "@tabler/icons-react";
import styles from "./Hero.module.css";
import HeroImage from "../../../assets/imgs/homepage/hero.jpg"; // Import image

const Hero = () => {
  return (
    <div
      id="home"
      className={styles.hero}
      style={{ backgroundImage: `url(${HeroImage})` }} // Apply background
    >
      {/* Dark Blue Overlay */}
      <Overlay
        gradient="linear-gradient(to bottom, rgba(10, 20, 50, 0.7), rgba(10, 20, 50, 0.9))"
        opacity={1}
        zIndex={1}
      />

      <Container className={styles.content}>
        <Title order={1} className={styles.title}>
          Menyatukan Hati Dengan al-Qur’an
        </Title>
        <Text className={styles.subtitle}>
          Kami membangun umat agar hidup bersama al-Qur’an, memahami,
          menghayati, dan menjadikannya pedoman kehidupan.
        </Text>
        <Button size="lg" radius="md" className={styles.button}>
          <span>Program Kami</span>
          <IconChevronCompactDown size={20} className={styles.chevron} />
        </Button>
      </Container>
    </div>
  );
};

export default Hero;
