import React, { useRef } from "react";
import { Carousel } from "@mantine/carousel";
import { Button, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import Autoplay from "embla-carousel-autoplay";
import styles from "./Programs.module.css";
import {
  IconBuilding,
  IconPlane,
  IconToolsKitchen,
  IconCar,
} from "@tabler/icons-react";

import UT from "../../assets/imgs/programs/UT.jpg";
import DS from "../../assets/imgs/programs/DS.jpg";
import DQ from "../../assets/imgs/programs/DQ.jpg";

const programs = [
  {
    src: UT,
    title: "Umrah Tadabburiyah",
    description: "Tadabbur al-Qur'an untuk masyarakat umum plus Umrah",
    link: "/ut",
  },
  {
    src: DS,
    title: "Daurah Santri",
    description: "Pelatihan bahasa Arab dan al-Qur'an untuk Santri plus Umrah",
    link: "/ds",
  },
  {
    src: DQ,
    title: "Duta Qur’an",
    description:
      "Pelatihan tadabbur al-Qur'an untuk Da’i dan Asatidz plus Umrah",
    link: "/dq",
  },
];

const Programs = () => {
  const autoplay = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <section className={styles.programsSection} id="program">
      <h2 className={styles.header}>Program Kami</h2>
      <Text align="center" size="1.2rem" color="gray" mb={40}>
        "Menyatukan hati dengan al-Qur’an"
      </Text>

      {isMobile ? (
        <Carousel
          slideSize="100%"
          slideGap="md"
          loop
          align="start"
          plugins={[autoplay.current]}
          withControls={false}
        >
          {programs.map((program, index) => (
            <Carousel.Slide key={index} className={styles.slide}>
              <ProgramCard program={program} />
            </Carousel.Slide>
          ))}
        </Carousel>
      ) : (
        <div className={styles.gridContainer}>
          {programs.map((program, index) => (
            <ProgramCard key={index} program={program} />
          ))}
        </div>
      )}
    </section>
  );
};

const ProgramCard = ({ program }) => (
  <div className={styles.card}>
    <div className={styles.cardImageWrapper}>
      <img src={program.src} alt={program.title} className={styles.cardImage} />
      <div className={styles.titleOverlay}>{program.title}</div>
    </div>
    <div className={styles.cardContent}>
      <div className={styles.cardDescription}>{program.description}</div>
      <div className={styles.cardIcons}>
        <IconBuilding size={24} />
        <IconPlane size={24} />
        <IconToolsKitchen size={24} />
        <IconCar size={24} />
      </div>
      <Button component="a" href={program.link} className={styles.cardButton}>
        Lihat Detail Program
      </Button>
    </div>
  </div>
);

export default Programs;
