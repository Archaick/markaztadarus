import React from "react";
import { Tabs } from "@mantine/core";
import { useTranslation } from "react-i18next";
import styles from "./Gallery.module.css";

// Image imports remain the same
import Umrah1 from "../../../assets/imgs/homepage/gallery/umrah/umrah1.jpg";
import Umrah2 from "../../../assets/imgs/homepage/gallery/umrah/umrah2.jpg";
import Umrah3 from "../../../assets/imgs/gallery/slide3.webp";
import Kaderisasi1 from "../../../assets/imgs/programs/DQ.jpg";
import Kaderisasi2 from "../../../assets/imgs/homepage/gallery/kaderisasi/kaderisasi.jpg";
import Kaderisasi3 from "../../../assets/imgs/homepage/gallery/kaderisasi/kaderisasi3.jpg";
import Majelis1 from "../../../assets/imgs/homepage/gallery/majelis/majelis1.jpg";
import Majelis2 from "../../../assets/imgs/homepage/gallery/majelis/majelis2.jpg";
import Majelis3 from "../../../assets/imgs/homepage/gallery/majelis/majelis3.jpg";
import Seminar1 from "../../../assets/imgs/homepage/programs/seminar.jpg";
import Seminar2 from "../../../assets/imgs/homepage/gallery/seminar/seminar2.jpg";
import Seminar3 from "../../../assets/imgs/homepage/gallery/seminar/seminar3.jpg";

const galleryData = {
  umrah: [Umrah1, Umrah2, Umrah3],
  kaderisasi: [Kaderisasi1, Kaderisasi2, Kaderisasi3],
  majelis: [Majelis1, Majelis2, Majelis3],
  seminar: [Seminar1, Seminar2, Seminar3],
};

const Gallery = () => {
  const { t } = useTranslation("homepage/Gallery");

  return (
    <div className={styles.galleryContainer} id="gallery">
      <div className={styles.header}>
        <h2 className={styles.title}>{t("title")}</h2>
      </div>

      <Tabs defaultValue="kaderisasi" className={styles.tabs} color="#1a4970">
        <Tabs.List>
          <Tabs.Tab value="umrah">{t("tabs.umrah")}</Tabs.Tab>
          <Tabs.Tab value="kaderisasi">{t("tabs.kaderisasi")}</Tabs.Tab>
          <Tabs.Tab value="majelis">{t("tabs.majelis")}</Tabs.Tab>
          <Tabs.Tab value="seminar">{t("tabs.seminar")}</Tabs.Tab>
        </Tabs.List>

        {Object.entries(galleryData).map(([key, images]) => (
          <Tabs.Panel key={key} value={key} className={styles.tabContent}>
            <div className={styles.imageGrid}>
              {images.map((image, index) => (
                <div key={`${key}-${index}`} className={styles.imageWrapper}>
                  <img
                    src={image}
                    alt={t(`alt.${key}`, { number: index + 1 })}
                    className={styles.image}
                  />
                </div>
              ))}
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
};

export default Gallery;