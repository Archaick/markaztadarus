import React from "react";
import { motion } from "framer-motion";
import styles from "./About.module.css";
import AboutImage from "../../../assets/imgs/homepage/about.jpg"; // Import image
import { IconExternalLink } from "@tabler/icons-react"; // Import arrow icon

const imageVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const contentVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut", delay: 0.2 },
  },
};

const About = () => {
  return (
    <div className={styles.about} id="about">
      {/* Animated Image Card */}
      <motion.div
        className={styles.imageCard}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={imageVariants}
      >
        <img
          src={AboutImage}
          alt="About Markaz Tadarus"
          className={styles.image}
        />
      </motion.div>

      {/* Animated Content */}
      <motion.div
        className={styles.content}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={contentVariants}
      >
        <h2 className={styles.title}>Tentang Kami</h2>
        <p className={styles.text}>
          <span className={styles.highlight}>MARKAZ TADARUS INDONESIA</span>{" "}
          adalah perpanjangan dakwah dari Yayasan An-Naba Al-Azhim di Mekah,
          yang fokus kepada penyebaran nilai-nilai al-Qur’an.
        </p>
        <p className={styles.text}>
          Ide pendirian Markaz di Indonesia bermula karena adanya kebutuhan
          mendesak untuk mengembalikan umat Islam kepada al-Qur’an secara
          pemahaman dan amalan, bukan sekedar tajwid dan hafalan.
        </p>
        <a href="/about" className={styles.link}>
          <span>Selengkapnya</span>
          <span>
            <IconExternalLink size={20} />
          </span>
        </a>
      </motion.div>

      {/* Divider */}
      <div className={styles.divider}></div>
    </div>
  );
};

export default About;
