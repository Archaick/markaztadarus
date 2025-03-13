import React, { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import styles from "./Map.module.css";
import before from "./../../../assets/imgs/homepage/map/before.png";
import after from "./../../../assets/imgs/homepage/map/after.png";

const Map = () => {
  const controls = useAnimation(); // Animation controls
  const [isInView, setIsInView] = useState(false);

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
        <motion.div
          className={styles.afterMapContainer}
          initial={{ height: 0 }} // Start with 0 height (fully hidden)
          animate={controls} // Use animation controls
          transition={{ duration: 3, ease: "linear" }} // Adjust duration and easing
          onViewportEnter={() => {
            setIsInView(true);
            controls.start({ height: "100%" }); // Animate to full height
          }}
          onViewportLeave={() => {
            setIsInView(false);
            controls.set({ height: 0 }); // Immediately reset height to 0
          }}
          viewport={{ once: false, amount: 0.2 }}
        >
          <img src={after} alt="After Map" className={styles.afterMap} />
        </motion.div>
      </div>
    </div>
  );
};

export default Map;