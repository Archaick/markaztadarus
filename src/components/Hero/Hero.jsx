import { Button, Container, Text, Overlay } from "@mantine/core";
import classes from "./Hero.module.css";
import heroVideo from "../../assets/video/hero.mp4";

const Hero = () => {
  return (
    <div className={classes.hero}>
      <video autoPlay loop muted className={classes.videoBg}>
        <source src={heroVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <Overlay
        gradient="linear-gradient(180deg, rgba(4, 14, 24, 0.2) 0%,rgba(0, 51, 102, 0.7) 100%)"
        opacity={1}
        zIndex={1}
        className={classes.overlay}
      />

      <Container size="lg" className={classes.content}>
        <h1 className={classes.title}>
          Belajar al-Qur’an dan Bahasa Arab di Mekah
        </h1>
        <Text size="lg" className={classes.subtitle}>
          “Menyatukan hati dengan al-Qur’an”
        </Text>
        <Button size="lg" className={classes.button}>
          Konsultasi dengan kami
        </Button>
      </Container>
    </div>
  );
};

export default Hero;
