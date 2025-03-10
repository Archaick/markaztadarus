import { Container, Overlay } from "@mantine/core";
import { Typewriter } from "react-simple-typewriter";
import classes from "./Hero.module.css";
import heroVideo from "../../assets/video/hero.mp4";
import ScrollDownArrow from "./ScrollDownArrow"; // Import the arrow component
import Whatsapp from "../../components/Whatsapp/Whatsapp";

const Hero = () => {
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
            <span className="typewriter">
              <Typewriter
                words={["Duta Qur'an", "Daurah Santri", "Umrah Tadabburiyah"]}
                loop={0}
                cursor
                cursorStyle="|"
                typeSpeed={70}
                deleteSpeed={50}
                delaySpeed={500}
              />
            </span>
          </span>
        </h1>
      </Container>

      {/* Add the animated arrow */}
      <ScrollDownArrow />

      <Whatsapp
        message={
          "Assalamu'alaikum warahmatullah wabarakatuh. \n\nAfwan, saya ingin nertanya tentang program Umrah Markaz Tadarus Indonesia."
        }
      />
    </div>
  );
};

export default Hero;
