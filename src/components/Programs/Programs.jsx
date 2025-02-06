import React from "react";
import { Carousel } from "@mantine/carousel";
import { Text } from "@mantine/core";
import styles from "./Programs.module.css";
import UT from "../../assets/imgs/UT.png";
import DS from "../../assets/imgs/DS.png";
import DQ from "../../assets/imgs/DQ.png";
import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  IconBuilding, // For hotel
  IconPlane, // For airplane
  IconToolsKitchen, // For meal
  IconCar, // For car
} from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks"; // For responsive behavior

const programs = [
  {
    src: UT,
    title: "Umrah Tadabburiyah",
    description: "Tadabbur al-Qur'an untuk masyarakat umum plus Umrah",
  },
  {
    src: DS,
    title: "Daurah Santri",
    description: "Pelatihan bahasa Arab dan al-Qur'an untuk Santri plus Umrah",
  },
  {
    src: DQ,
    title: "Duta Qur’an",
    description:
      "Pelatihan tadabbur al-Qur'an untuk Da’i dan Asatidz plus Umrah",
  },
];

const Programs = () => {
  // Configure Autoplay to resume after user interaction
  const autoplay = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false }) // Add stopOnInteraction: false
  );
  const isMobile = useMediaQuery("(max-width: 768px)"); // Check if screen is smaller than 768px

  return (
    <section className={styles.programsSection}>
      <h2 className={styles.header}>Program Kami</h2>
      <Text align="center" size="1.2rem" color="gray" mb={40}>
        "Menyatukan hati dengan al-Qur’an"
      </Text>
      {isMobile ? (
        // Carousel for smaller screens
        <Carousel
          slideSize="100%"
          slideGap="md"
          loop
          align="start"
          plugins={[autoplay.current]} // Use the Autoplay plugin
          withControls={false}
          withIndicators={false}
        >
          {programs.map((program, index) => (
            <Carousel.Slide key={index} className={styles.slide}>
              <div className={styles.card}>
                <div
                  className={styles.cardImageWrapper}
                  data-title={program.title}
                >
                  <img
                    src={program.src}
                    alt={program.title}
                    className={styles.cardImage}
                  />
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.cardTitle}>{program.title}</div>
                  <div className={styles.cardDescription}>
                    {program.description}
                  </div>
                  <div className={styles.cardIcons}>
                    <IconBuilding size={24} /> {/* Hotel */}
                    <IconPlane size={24} /> {/* Airplane */}
                    <IconToolsKitchen size={24} /> {/* Meal */}
                    <IconCar size={24} /> {/* Car */}
                  </div>
                </div>
              </div>
            </Carousel.Slide>
          ))}
        </Carousel>
      ) : (
        // Grid layout for larger screens
        <div className={styles.gridContainer}>
          {programs.map((program, index) => (
            <div key={index} className={styles.card}>
              <div
                className={styles.cardImageWrapper}
                data-title={program.title}
              >
                <img
                  src={program.src}
                  alt={program.title}
                  className={styles.cardImage}
                />
              </div>

              <div className={styles.cardContent}>
                <div className={styles.cardTitle}>{program.title}</div>
                <div className={styles.cardDescription}>
                  {program.description}
                </div>
                <div className={styles.cardIcons}>
                  <IconBuilding size={24} /> {/* Hotel */}
                  <IconPlane size={24} /> {/* Airplane */}
                  <IconToolsKitchen size={24} /> {/* Meal */}
                  <IconCar size={24} /> {/* Car */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Programs;
