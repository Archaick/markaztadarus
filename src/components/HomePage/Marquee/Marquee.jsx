import React from "react";
import styles from "./Marquee.module.css";
import khaldon from "../../../assets/imgs/homepage/marquee/khaldon.png";
import manba from "../../../assets/imgs/homepage/marquee/manba.png";
import ubaidah from "../../../assets/imgs/homepage/marquee/ubaidah.png";
import Marquee from "react-fast-marquee";

const MarqueeComponent = () => {
  // Repeat the logos to fill the marquee
  const logos = [khaldon, manba, ubaidah, khaldon]; // Repeat logos as needed

  return (
    <div className={styles.marqueeContainer}>
      <h2 className={styles.title}>Mitra Kami</h2>
      <div className={styles.textcontainer}>
        <p className={styles.text}>
          Hingga tahun 2025, telah lebih dari 35 lembaga pendidikan yang
          tersebar di seluruh Indonesia telah bekerjasama dengan kami dalam
          penyebaran Tadarus 5T, dan ini adalah salahsatu dari mereka:
        </p>
      </div>

      <Marquee
        direction="right"
        speed={50}
        gradient={false}
        className={styles.marqueeRow}
      >
        {logos.map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt={`Logo ${index + 1}`}
            className={styles.logo}
          />
        ))}
      </Marquee>

      {/* Second Row (Left to Right) */}
      <Marquee
        direction="left"
        speed={50}
        gradient={false}
        className={styles.marqueeRow}
      >
        {logos.map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt={`Logo ${index + 1}`}
            className={styles.logo}
          />
        ))}
      </Marquee>
    </div>
  );
};

export default MarqueeComponent;
