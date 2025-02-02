import React from "react";
import Carousel from "react-bootstrap/Carousel";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./Programs.module.css";
import UT from "../../assets/imgs/UT.png";
import DS from "../../assets/imgs/DS.png";
import DQ from "../../assets/imgs/DQ.png";

const programs = [
  {
    src: UT,
    title: "Umrah Tadabburiyah",
    description:
      "Program umrah khusus untuk masyarakat umum yang disertai pembelajaran tadabbur al-Qur’an di tempat turunnya, yaitu Mekah dan Madinah, disertai program i’tikaf di Masjid Nabawi dan Masjidil Haram.",
    overlay: styles.goldOverlay,
  },
  {
    src: DS,
    title: "Daurah Santri",
    description:
      "Program pembelajaran singkat untuk Santri dan Mahasantri yang dirancang khusus untuk memperdalam ilmu pengetahuan di kota Mekah al-Mukarramah dalam bidang bahasa Arab dan al-Qur’an, sekaligus melaksanakan ibadah umrah dan kunjungan tempat-tempat bersejarah dan berbudaya Arab.",
    overlay: styles.greenOverlay,
  },
  {
    src: DQ,
    title: "Duta Qur’an",
    description:
      "Program pelatihan khusus Da’i dan Asatidz atau Kader-kader pilihan di Mekah al-Mukarramah seputar keahlian tadabbur, memetik nilai-nilai al-Qur’an dan mengaitkannya dengan realita kehidupan, juga memahami langkah-langkah pelaksanaan majelis tadarus al-Qur’an.",
    overlay: styles.purpleOverlay,
  },
];

const Programs = () => {
  return (
    <Carousel fade indicators={true} controls={false}>
      {programs.map((program, index) => (
        <Carousel.Item key={index}>
          <div
            className={styles.carouselItem}
            style={{ backgroundImage: `url(${program.src})` }}
          >
            <div className={`${styles.overlay} ${program.overlay}`}>
              <div className={styles.textColumn}>
                <h2 className={styles.title}>{program.title}</h2>
                <p className={styles.description}>{program.description}</p>
                <button className={styles.detailButton}>Lebih Detail</button>
              </div>
            </div>
          </div>
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default Programs;