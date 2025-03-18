import React from "react";
import styles from "./Marquee.module.css";
// left
import khaldon from "../../../assets/imgs/homepage/marquee/khaldon.png";
import manba from "../../../assets/imgs/homepage/marquee/manba.png";
import ubaidah from "../../../assets/imgs/homepage/marquee/ubaidah.png";
import wafa from "../../../assets/imgs/homepage/marquee/wafa.png";
import azhari from "../../../assets/imgs/homepage/marquee/azhari.png";
// right
import falah from "../../../assets/imgs/homepage/marquee/falah.png";
import kaaffah from "../../../assets/imgs/homepage/marquee/kaaffah.png";
import lampu from "../../../assets/imgs/homepage/marquee/lampu.png";
import muhammadiyah from "../../../assets/imgs/homepage/marquee/muhammadiyah.png";
import pondok from "../../../assets/imgs/homepage/marquee/pondok.png";

import Marquee from "react-fast-marquee";

const MarqueeComponent = () => {
  // Repeat the logos to fill the marquee
  const logosLeft = [khaldon, manba, ubaidah, wafa, azhari]; // Repeat logos as needed
  const logosRight = [falah, muhammadiyah, kaaffah, lampu, pondok]; // Repeat logos as needed

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
          speed={30}
          gradient={false} // Disable default gradient
          className={styles.marqueeRow}
        >
          {logosLeft.map((logo, index) => (
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
          speed={30}
          gradient={false} // Disable default gradient
          className={styles.marqueeRow}
        >
          {logosRight.map((logo, index) => (
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
