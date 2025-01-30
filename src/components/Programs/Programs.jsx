import React, { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Fade from "embla-carousel-fade";
import styles from "./Programs.module.css";
import UT from "../../assets/imgs/UT.png";
import DS from "../../assets/imgs/DS.png";
import DQ from "../../assets/imgs/DQ.png";
import { DotButton, useDotButton } from "./EmblaCarouselDotButton";

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Fade()]);
  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (emblaApi) emblaApi.scrollNext();
    }, 6000);

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [emblaApi]);

  return (
    <div className={styles.programsSection}>
      <div className={styles.embla} ref={emblaRef}>
        <div className={styles.embla__container}>
          {programs.map(({ src, title, description, overlay }, index) => (
            <div className={`${styles.embla__slide} ${overlay}`} key={index}>
              <img src={src} alt={title} className={styles.image} />
              <div className={styles.textContent}>
                <h2 className={styles.title}>{title}</h2>
                <p className={styles.description}>{description}</p>
                <button className={styles.button}>Pelajari Lebih Lanjut</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Outside the Carousel */}
      <div className={styles.embla__dots}>
        {scrollSnaps.map((_, index) => (
          <DotButton
            key={index}
            onClick={() => onDotButtonClick(index)}
            className={
              index === selectedIndex
                ? styles.embla__dotSelected
                : styles.embla__dot
            }
          />
        ))}
      </div>
    </div>
  );
};

export default Programs;
