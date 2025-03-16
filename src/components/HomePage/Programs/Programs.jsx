import React, { useRef } from "react";
import { Carousel } from "@mantine/carousel";
import { Button, Text } from "@mantine/core";
import Autoplay from "embla-carousel-autoplay";
import styles from "./Programs.module.css";
import { IconExternalLink } from "@tabler/icons-react";

import Seminar from "../../../assets/imgs/homepage/programs/seminar.jpg";
import Pelatihan from "../../../assets/imgs/homepage/programs/pelatihan.jpg";
import Majelis from "../../../assets/imgs/homepage/hero.jpg";
import Karya from "../../../assets/imgs/homepage/programs/karya.jpg";
import Umrah from "../../../assets/imgs/homepage/programs/umrah.jpg";

const programs = [
  {
    src: Seminar,
    title: "Seminar Tadarus 5T",
    description:
      "Program pengenalan Tadarus 5T, Contoh Tadarus Sahabat, dan praktik penerapan Tadarus 5T.",
    link: "#", // Inactive link
  },
  {
    src: Pelatihan,
    title: "Pelatihan Tadarus 5T",
    description:
      "Program khusus kader lembaga pendidikan yang siap berkomitmen dalam menyebarkan Tadarus 5T di lembaganya.",
    link: "#", // Inactive link
  },
  {
    src: Majelis,
    title: "Majelis Tadarus 5T",
    description:
      "Pembelajaran Tadarus 5T kepada masyarakat umum, lembaga pendidikan, institusi perkantoran, ataupun korporasi.",
    link: "#", // Inactive link
  },
  {
    src: Karya,
    title: "Karya Terjemah",
    description:
      "Buku buku lembaga An Naba Al Azhim yang diterjemahkan ke dalam bahasa Indonesia untuk memenuhi setiap lingkup pendidikan.",
    link: "#", // Inactive link
  },
  {
    src: Umrah,
    title: "Umrah Tadarus",
    description:
      "Program Umrah yang diselingi dengan Tadarus 5T di tanah Haram.",
    link: "/", // Active link
  },
];

const Programs = () => {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));

  return (
    <section className={styles.programsSection} id="programs">
      <h2 className={styles.header}>Program Kami</h2>
      <Text align="center" size="1.2rem" color="#003366" mb={40} fw={500}>
        Dalam membangun kehidupan bersama al-Qur’an, Markaz Tadarus Indonesia
        menjalankan 5 program utama
      </Text>

      <Carousel
        slideSize="100%"
        slideGap="md"
        loop
        align="start"
        plugins={[autoplay.current]}
        withControls={true}
        breakpoints={[
          { maxWidth: "sm", slideSize: "100%", slidesToScroll: 1 }, // 1 card on small screens
          { maxWidth: "md", slideSize: "50%", slidesToScroll: 2 }, // 2 cards on medium screens
          { minWidth: "md", slideSize: "33.33%", slidesToScroll: 3 }, // 3 cards on large screens
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

const ProgramCard = ({ program }) => (
  <div className={styles.card}>
    <div className={styles.cardImageWrapper}>
      <img src={program.src} alt={program.title} className={styles.cardImage} />
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
        {program.link === "#" ? "Dalam Pengembangan" : "Selengkapnya"}
        <span className={styles.iconWrapper}>
          <IconExternalLink size={16} />
        </span>
      </Button>
    </div>
  </div>
);

export default Programs;