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
  const { t, i18n } = useTranslation("homepage/Programs");
  const rtl = i18n.language === "ar";
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
        slideSize={{ base: "84%", xs: "62%", sm: "50%", md: "33.333%" }}
        slideGap={{ base: "sm", md: "md" }}
        loop
        align="center"
        plugins={[autoplay.current]}
        withControls
        withIndicators
        classNames={{ indicators: styles.indicators, indicator: styles.indicator, control: styles.control }}
        className={styles.carousel}
        dir="ltr" // the carousel slides left to right; each card keeps its own direction
      >
        {programs.map((program, index) => (
          <Carousel.Slide key={index} className={styles.slide}>
            <ProgramCard program={program} rtl={rtl} />
          </Carousel.Slide>
        ))}
      </Carousel>
    </section>
  );
};

const ProgramCard = ({ program, rtl }) => {
  const { t } = useTranslation("homepage/Programs");

  return (
    <div className={styles.card} dir={rtl ? "rtl" : "ltr"}>
      <div className={styles.cardImageWrapper}>
        <img
          src={program.src}
          alt={program.title}
          className={styles.cardImage}
        />
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
            <IconArrowRight size={18} className={styles.arrow} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default Programs;
