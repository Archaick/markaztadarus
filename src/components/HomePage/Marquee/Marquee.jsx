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
import shifa from "../../../assets/imgs/homepage/marquee/shifa.png";
import lampu from "../../../assets/imgs/homepage/marquee/lampu.png";
import muhammadiyah from "../../../assets/imgs/homepage/marquee/muhammadiyah.png";
import pondok from "../../../assets/imgs/homepage/marquee/pondok.png";
// left bottom
import darda from "../../../assets/imgs/homepage/marquee/darda.png";
import furqan from "../../../assets/imgs/homepage/marquee/furqan.png";
import ashabul from "../../../assets/imgs/homepage/marquee/ashabul.png";
import rayan from "../../../assets/imgs/homepage/marquee/rayan.png";
import hidayah from "../../../assets/imgs/homepage/marquee/hidayah.png";
// right bottom
import hubul from "../../../assets/imgs/homepage/marquee/hubul.png";
import huda from "../../../assets/imgs/homepage/marquee/huda.png";
import huram from "../../../assets/imgs/homepage/marquee/huram.png";
import yasmin from "../../../assets/imgs/homepage/marquee/yasmin.png";
import ybi from "../../../assets/imgs/homepage/marquee/ybi.png";


import Marquee from "react-fast-marquee";

const MarqueeComponent = () => {
  // Repeat the logos to fill the marquee
  const logosLeft = [khaldon, manba, ubaidah, wafa, azhari]; 
  const logosRight = [falah, muhammadiyah, shifa, lampu, pondok]; 
  const logosLeftBtm = [darda, furqan, ashabul, rayan, hidayah]; 
  const logosRightBtm = [hubul, huda, huram, yasmin, ybi]; 



  return (
    <div className={styles.marqueeContainer}>
      <h2 className={styles.title}>Mitra Kami</h2>
      <div className={styles.textcontainer}>
        <p className={styles.text}>
          Lebih dari 35 Lembaga Pendidikan di Seluruh Indonesia Telah
          bekerjasama dengan kami dalam penerapan Tadarus 5T
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

      <Marquee
        direction="left"
        speed={30}
        gradient={false} // Disable default gradient
        className={styles.marqueeRow}
      >
        {logosLeftBtm.map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt={`Logo ${index + 1}`}
            className={styles.logo}
          />
        ))}
      </Marquee>

      <Marquee
        direction="right"
        speed={30}
        gradient={false} // Disable default gradient
        className={styles.marqueeRow}
      >
        {logosRightBtm.map((logo, index) => (
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
