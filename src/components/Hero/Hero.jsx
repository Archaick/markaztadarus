import { Container, Overlay } from "@mantine/core";
import TextTransition, { presets } from "react-text-transition";
import classes from "./Hero.module.css";
import heroVideo from "../../assets/video/hero.mp4";
import ScrollDownArrow from "./ScrollDownArrow";
import Whatsapp from "../../components/Whatsapp/Whatsapp";
import React from "react";

const Hero = () => {
  const TEXTS = ["Duta Qur'an", "Daurah Santri", "Umrah Tadabburiyah"];
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex((index) => index + 1);
    }, 2000); // Change text every 2 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={classes.hero} id="home">
      <video autoPlay loop muted className={classes.videoBg}>
        <source src={heroVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <Overlay
        gradient="linear-gradient(180deg, rgba(4, 14, 24, 0.2) 0%,rgba(0, 51, 102, 0.9) 100%)"
        opacity={1}
        zIndex={1}
        className={classes.overlay}
      />

      <Container size="lg" className={classes.content}>
        <h1 className={classes.title}>
          <span className={classes.bold}>Umrah Tadarus</span>
          <br />
          <span className={classes.typewriter}>
            <TextTransition
              springConfig={{
                stiffness: 120, // Less bouncy
                damping: 20, // Slower animation
              }}
              className={classes.transitions}
            >
              {TEXTS[index % TEXTS.length]}
            </TextTransition>
          </span>
        </h1>
      </Container>

      {/* Add the animated arrow */}
      <ScrollDownArrow />

      <Whatsapp
        message={
          "Assalamu'alaikum warahmatullah wabarakatuh. \n\nAfwan, saya ingin nertanya tentang program Umrah Markaz Tadarus Indonesia."
        }
      />
    </div>
  );
};

export default Hero;
