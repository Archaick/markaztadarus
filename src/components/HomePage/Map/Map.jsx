import React from "react";
import { motion } from "framer-motion";
import styles from "./Map.module.css";
import before from "./../../../assets/imgs/homepage/map/before.png";
import after from "./../../../assets/imgs/homepage/map/after.png";

const Map = () => {
  return (
    <div className={styles.mapContainer}>
      {/* Header and Subheader */}
      <div className={styles.header}>
        <h2 className={styles.title}>Markaz Tadarus Indonesia</h2>
        <p className={styles.subtitle}>Tahun 1446 H | 2025 M</p>
      </div>

      {/* Map Animation */}
      <div className={styles.mapWrapper}>
        {/* Before Map (Static) */}
        <img src={before} alt="Before Map" className={styles.beforeMap} />

        {/* After Map (Animated Markers) */}
        <motion.img
          src={after}
          alt="After Map"
          className={styles.afterMap}
          initial={{ opacity: 0, x: -50 }} // Start slightly to the left
          whileInView={{ opacity: 1, x: 0 }} // Move into place from left to right
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 2.5, delay: 0.5, ease: "easeOut" }} // Smoother appearance
        />
      </div>
    </div>
  );
};

export default Map;
