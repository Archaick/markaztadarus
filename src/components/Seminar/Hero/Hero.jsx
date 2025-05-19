import { Overlay, Text, Title, Container } from "@mantine/core";
import styles from "./Hero.module.css";
import HeroImage from "../../../assets/imgs/homepage/hero.jpg";

const Hero = () => {
  return (
    <div
      id="home"
      className={styles.hero}
      style={{ backgroundImage: `url(${HeroImage})` }}
    >
      <Overlay
        gradient="linear-gradient(to bottom, rgba(13, 11, 4, 0.56), rgba(22, 16, 1, 0.55))"
        opacity={1}
        zIndex={1}
      />

      <Container className={styles.content}>
        <Title order={1} className={styles.title}>
          SEMINAR TADARUS 5T
        </Title>
        <Text className={styles.subtitle}>
          Merupakan kegiatan berupa kuliah umum berisi pengenalan Tadarus
          al-Qur’an Metode 5T yang disampaikan secara interaktif.
        </Text>
      </Container>
    </div>
  );
};

export default Hero;
