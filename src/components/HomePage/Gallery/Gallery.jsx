import React from "react";
import { Tabs } from "@mantine/core";
import styles from "./Gallery.module.css";

const Gallery = () => {
  return (
    <div className={styles.galleryContainer}>
      {/* Header and Subheader */}
      <div className={styles.header}>
        <h2 className={styles.title}>Galeri Kegiatan</h2>
        <p className={styles.subtitle}>
          Galeri ini adalah rangkuman dari berbagai program dan kegiatan yang
          berjalan hingga tahun 2025.
        </p>
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
          <Tabs.Tab value="umrah">Umrah Tadarus</Tabs.Tab>

          {/* Kaderisasi dan Pelatihan Tab */}
          <Tabs.Tab value="kaderisasi">Kaderisasi dan Pelatihan</Tabs.Tab>

          {/* Majelis Tadarus Tab */}
          <Tabs.Tab value="majelis">Majelis Tadarus</Tabs.Tab>

          {/* Seminar dan Kuliah Umum Tab */}
          <Tabs.Tab value="seminar">Seminar dan Kuliah Umum</Tabs.Tab>
        </Tabs.List>

        {/* Umrah Tadarus Content */}
        <Tabs.Panel value="umrah" className={styles.tabContent}>
          <div className={styles.imageGrid}>
            <img
              src="https://via.placeholder.com/300"
              alt="Umrah Tadarus 1"
              className={styles.image}
            />
          </div>
        </Tabs.Panel>

        {/* Kaderisasi dan Pelatihan Content */}
        <Tabs.Panel value="kaderisasi" className={styles.tabContent}>
          <div className={styles.imageGrid}>
            <img
              src="https://via.placeholder.com/300"
              alt="Kaderisasi 1"
              className={styles.image}
            />
          </div>
        </Tabs.Panel>

        {/* Majelis Tadarus Content */}
        <Tabs.Panel value="majelis" className={styles.tabContent}>
          <div className={styles.imageGrid}>
            <img
              src="https://via.placeholder.com/300"
              alt="Majelis 1"
              className={styles.image}
            />
          </div>
        </Tabs.Panel>

        {/* Seminar dan Kuliah Umum Content */}
        <Tabs.Panel value="seminar" className={styles.tabContent}>
          <div className={styles.imageGrid}>
            <img
              src="https://via.placeholder.com/300"
              alt="Seminar 1"
              className={styles.image}
            />
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default Gallery;
