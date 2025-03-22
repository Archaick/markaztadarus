import React from "react";
import { Tabs } from "@mantine/core";
import styles from "./Gallery.module.css";

// umrah
import Umrah1 from "../../../assets/imgs/homepage/gallery/umrah/umrah1.jpg";
import Umrah2 from "../../../assets/imgs/homepage/gallery/umrah/umrah2.jpg";
import Umrah3 from "../../../assets/imgs/gallery/slide3.webp";
// kaderisasi
import Kaderisasi1 from "../../../assets/imgs/programs/DQ.jpg";
import Kaderisasi2 from "../../../assets/imgs/homepage/gallery/kaderisasi/kaderisasi.jpg";
import Kaderisasi3 from "../../../assets/imgs/homepage/gallery/kaderisasi/kaderisasi3.jpg";
// majelis
import Majelis1 from "../../../assets/imgs/homepage/gallery/majelis/majelis1.jpg";
import Majelis2 from "../../../assets/imgs/homepage/gallery/majelis/majelis2.jpg";
import Majelis3 from "../../../assets/imgs/homepage/gallery/majelis/majelis3.jpg";
// seminar
import Seminar1 from "../../../assets/imgs/homepage/programs/seminar.jpg";
import Seminar2 from "../../../assets/imgs/homepage/gallery/seminar/seminar2.jpg";

// Define gallery data with local images
const galleryData = {
  umrah: [Umrah1, Umrah2, Umrah3],
  kaderisasi: [Kaderisasi1, Kaderisasi2, Kaderisasi3],
  majelis: [Majelis1, Majelis2, Majelis3],
  seminar: [Seminar1, Seminar2],
};

const Gallery = () => {
  return (
    <div className={styles.galleryContainer} id="gallery">
      {/* Header and Subheader */}
      <div className={styles.header}>
        <h2 className={styles.title}>Galeri</h2>
      </div>

      {/* Tabs */}
      <Tabs
        radius="xs"
        defaultValue="umrah"
        className={styles.tabs}
        variant="pills"
      >
        <Tabs.List className={styles.tabsList}>
          {/* Umrah Tadarus Tab */}
          <Tabs.Tab value="umrah">Umrah Tadarus 5T</Tabs.Tab>

          {/* Kaderisasi dan Pelatihan Tab */}
          <Tabs.Tab value="kaderisasi">Pelatihan Tadarus 5T</Tabs.Tab>

          {/* Majelis Tadarus Tab */}
          <Tabs.Tab value="majelis">Majelis Tadarus 5T</Tabs.Tab>

          {/* Seminar dan Kuliah Umum Tab */}
          <Tabs.Tab value="seminar">Seminar Tadarus 5T</Tabs.Tab>
        </Tabs.List>

        {/* Umrah Tadarus Content */}
        <Tabs.Panel value="umrah" className={styles.tabContent}>
          <div className={styles.imageGrid}>
            {galleryData.umrah.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Umrah Tadarus ${index + 1}`}
                className={styles.image}
              />
            ))}
          </div>
        </Tabs.Panel>

        {/* Kaderisasi dan Pelatihan Content */}
        <Tabs.Panel value="kaderisasi" className={styles.tabContent}>
          <div className={styles.imageGrid}>
            {galleryData.kaderisasi.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Kaderisasi ${index + 1}`}
                className={styles.image}
              />
            ))}
          </div>
        </Tabs.Panel>

        {/* Majelis Tadarus Content */}
        <Tabs.Panel value="majelis" className={styles.tabContent}>
          <div className={styles.imageGrid}>
            {galleryData.majelis.map((image, index) => (
              <div key={index} className={styles.imageWrapper}>
                <img
                  src={image}
                  alt={`Majelis ${index + 1}`}
                  className={styles.image}
                />
              </div>
            ))}
          </div>
        </Tabs.Panel>

        {/* Seminar dan Kuliah Umum Content */}
        <Tabs.Panel value="seminar" className={styles.tabContent}>
          <div className={styles.imageGrid}>
            {galleryData.seminar.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Seminar ${index + 1}`}
                className={styles.image}
              />
            ))}
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default Gallery;
