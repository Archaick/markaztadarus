import React, { useRef } from "react";
import { Carousel } from "@mantine/carousel";
import { Button, Text } from "@mantine/core";
import Autoplay from "embla-carousel-autoplay";
import { useTranslation } from "react-i18next";
import styles from "./Programs.module.css";
import { IconArrowRight } from "@tabler/icons-react";

import Seminar from "../../../assets/imgs/homepage/programs/seminar.jpg";
import Pelatihan from "../../../assets/imgs/homepage/programs/pelatihan.jpg";
import Majelis from "../../../assets/imgs/homepage/hero.jpg";
import Karya from "../../../assets/imgs/homepage/programs/karya.jpg";
import Umrah from "../../../assets/imgs/homepage/gallery/umrah/umrah2.jpg";

const Programs = () => {
  const { t } = useTranslation("homepage/Programs");
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));

  const programs = [
    {
      src: Seminar,
      title: t("programs.seminar.title"),
      description: t("programs.seminar.description"),
      link: "/seminar",
    },
    {
      src: Pelatihan,
      title: t("programs.pelatihan.title"),
      description: t("programs.pelatihan.description"),
      link: "/pelatihan",
    },
    {
      src: Majelis,
      title: t("programs.majelis.title"),
      description: t("programs.majelis.description"),
      link: "/majelis",
    },
    {
      src: Karya,
      title: t("programs.karya.title"),
      description: t("programs.karya.description"),
      link: "/ilmiah",
    },
    {
      src: Umrah,
      title: t("programs.umrah.title"),
      description: t("programs.umrah.description"),
      link: "/umrah",
    },
  ];

  return (
    <section className={styles.programsSection} id="programs">
      <div className={styles.headerContainer}>
        <h2 className={styles.header}>{t("header")}</h2>
      </div>

      <Carousel
        slideSize="33.33%"
        slideGap="md"
        loop
        align="start"
        plugins={[autoplay.current]}
        withControls={true}
        breakpoints={[
          { maxWidth: "md", slideSize: "50%", slidesToScroll: 1 },
          { maxWidth: "sm", slideSize: "50%", slidesToScroll: 1 },
          { maxWidth: "xs", slideSize: "80%", slidesToScroll: 1 },
        ]}
        className={styles.carousel}
      >
        {programs.map((program, index) => (
          <Carousel.Slide key={index} className={styles.slide}>
            <ProgramCard program={program} />
          </Carousel.Slide>
        ))}
      </Carousel>
    </section>
  );
};

const ProgramCard = ({ program }) => {
  const { t } = useTranslation("homepage/Programs");

  return (
    <div className={styles.card}>
      <div className={styles.cardImageWrapper}>
        <img
          src={program.src}
          alt={program.title}
          className={styles.cardImage}
        />
        {/* Floating Category Label */}
        <div className={styles.titleOverlay}>{program.title}</div>
      </div>
      
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitleMain}>{program.title}</h3>
        <p className={styles.cardDescription}>{program.description}</p>
        
        <button
          onClick={() => { if (program.link !== "#") window.location.href = program.link; }}
          className={`${styles.cardButton} ${
            program.link === "#" ? styles.inactiveButton : ""
          }`}
          disabled={program.link === "#"}
        >
          {program.link === "#" ? t("inDevelopment") : t("learnMore")}
          <span className={styles.iconWrapper}>
             <IconArrowRight size={18} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default Programs;
