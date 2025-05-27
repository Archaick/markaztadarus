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
        gradient="linear-gradient(to bottom, rgba(0, 85, 80, 0.5), rgba(0, 50, 45, 0.75))"
        opacity={1}
        zIndex={1}
      />

      <Container className={styles.content}>
        <Title order={1} className={styles.title}>
          MAJELIS TADARUS 5T
        </Title>
        <Text className={styles.subtitle}>
          Pembelajaran Tadarus al-Qur’an metode 5T untuk para santri atau masyarakat umum.
        </Text>
      </Container>
    </div>
  );
};

export default Hero;
