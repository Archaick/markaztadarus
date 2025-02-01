import { Button, Container, Text, Overlay } from "@mantine/core";
import classes from "./Hero.module.css";
import heroVideo from "../../assets/video/hero.mp4";

const Hero = () => {
  const whatsappUrl =
    "https://wa.me/000000000?text=Halo,%20saya%20ingin%20konsultasi%20dengan%20Anda.";
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
        <Button
          size="lg"
          className={classes.button}
          component="a"
          // href={whatsappUrl}
          target="_blank" // Open in a new tab
          rel="noopener noreferrer" // Security best practice
        >
          Konsultasi dengan kami
        </Button>
      </Container>
    </div>
  );
};

export default Hero;
