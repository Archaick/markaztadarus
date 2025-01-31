import React from "react";
import styles from "./Marquee.module.css";
import Naba from "../../assets/imgs/marquee/naba.png";
import Sabda from "../../assets/imgs/marquee/sabda.png";
import Hijaz from "../../assets/imgs/marquee/hijaz.png";
import Marquee from "react-fast-marquee";

const PartnersMarquee = () => {
  return (
    <section className={styles.marqueeSection} aria-label="Our Partners">
      <h2 className={styles.heading}>Our Partners</h2>
      <Marquee speed={150} className={styles.marquee}>
        <img
          src={Naba}
          alt="Naba Saudi Partner Logo"
          className={styles.partnerLogo}
        />
        <img
          src={Sabda}
          alt="Sabda Partner Logo"
          className={styles.partnerLogo}
        />
        <img
          src={Hijaz}
          alt="Hijaz Partner Logo"
          className={styles.partnerLogo}
        />
      </Marquee>
    </section>
  );
};

export default PartnersMarquee;
