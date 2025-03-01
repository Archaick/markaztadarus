import { Container, Overlay } from "@mantine/core";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { Typewriter } from "react-simple-typewriter";
import classes from "./Hero.module.css";
import heroVideo from "../../assets/video/hero.mp4";
import ScrollDownArrow from "./ScrollDownArrow"; // Import the arrow component

const Hero = () => {
  const whatsappUrl =
    "https://wa.me/6281210010733?text=Halo,%20saya%20ingin%20konsultasi%20dengan%20Anda.";

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
          <span className={classes.bold}>Markaz Tadarus:</span>
          <br />
          <span className={classes.typewriter}>
            <span className="typewriter">
              <Typewriter
                words={["Umrah Daurah", "Umrah Tadabburiyah"]}
                loop={0}
                cursor
                cursorStyle="|"
                typeSpeed={100}
                deleteSpeed={50}
                delaySpeed={1000}
              />
            </span>
          </span>
        </h1>
      </Container>

      {/* Add the animated arrow */}
      <ScrollDownArrow />

      <a
        className={classes.whatsappButton}
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconBrandWhatsapp size={32} />
      </a>
    </div>
  );
};

export default Hero;
