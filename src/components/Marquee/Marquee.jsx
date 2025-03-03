import React from "react";
import styles from "./Marquee.module.css";
import Naba from "../../assets/imgs/marquee/naba.png";
import Hijaz from "../../assets/imgs/marquee/hijaz.png";
import Marquee from "react-fast-marquee";

const PartnersMarquee = () => {
  return (
    <section className={styles.marqueeSection} aria-label="Our Partners">
      <h2 className={styles.heading}>Our Partners</h2>
      <Marquee 
        speed={50} 
        className={styles.marquee}
        gradient={false}
        loop={0}
      >
        {/* First set of logos */}
        <div className={styles.logoContainer}>
          <img
            src={Naba}
            alt="Naba Saudi Partner Logo"
            className={styles.partnerLogo}
          />
        </div>
        <div className={styles.logoContainer}>
          <img
            src={Hijaz}
            alt="Hijaz Partner Logo"
            className={styles.partnerLogo}
          />
        </div>
        
        {/* Second set of logos (duplicate) to ensure continuous flow */}
        <div className={styles.logoContainer}>
          <img
            src={Naba}
            alt="Naba Saudi Partner Logo"
            className={styles.partnerLogo}
          />
        </div>
        <div className={styles.logoContainer}>
          <img
            src={Hijaz}
            alt="Hijaz Partner Logo"
            className={styles.partnerLogo}
          />
        </div>
      </Marquee>
    </section>
  );
};

export default PartnersMarquee;
