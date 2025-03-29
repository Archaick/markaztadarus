import React, { useRef } from "react";
import { Carousel } from "@mantine/carousel";
import { Button, Text } from "@mantine/core";
import Autoplay from "embla-carousel-autoplay";
import { useTranslation } from "react-i18next";
import styles from "./Programs.module.css";
import { IconExternalLink } from "@tabler/icons-react";

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
      link: "#",
    },
    {
      src: Pelatihan,
      title: t("programs.pelatihan.title"),
      description: t("programs.pelatihan.description"),
      link: "#",
    },
    {
      src: Majelis,
      title: t("programs.majelis.title"),
      description: t("programs.majelis.description"),
      link: "#",
    },
    {
      src: Karya,
      title: t("programs.karya.title"),
      description: t("programs.karya.description"),
      link: "#",
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
      <h2 className={styles.header}>{t("header")}</h2>

      <Carousel
        slideSize="100%"
        slideGap="md"
        loop
        align="start"
        plugins={[autoplay.current]}
        withControls={true}
        breakpoints={[
          { maxWidth: "sm", slideSize: "100%", slidesToScroll: 1 },
          { maxWidth: "md", slideSize: "50%", slidesToScroll: 2 },
          { minWidth: "md", slideSize: "33.33%", slidesToScroll: 3 },
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
        <div className={styles.titleOverlay}>{program.title}</div>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardDescription}>{program.description}</div>
        <Button
          component="a"
          href={program.link}
          className={`${styles.cardButton} ${
            program.link === "#" ? styles.inactiveButton : ""
          }`}
          disabled={program.link === "#"}
        >
          {program.link === "#" ? t("inDevelopment") : t("learnMore")}
          <span className={styles.iconWrapper}>
            <IconExternalLink size={16} />
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Programs;
