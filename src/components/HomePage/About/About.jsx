import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import styles from "./About.module.css";
import AboutImage from "../../../assets/imgs/homepage/about.jpg";
import { IconExternalLink } from "@tabler/icons-react";

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
  const { t } = useTranslation("homepage/About");

  // Get paragraph1 as an object
  const paragraph1 = t("paragraph1", { returnObjects: true });

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
        <img src={AboutImage} alt={t("title")} className={styles.image} />
      </motion.div>

      {/* Animated Content */}
      <motion.div
        className={styles.content}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={contentVariants}
      >
        <h2 className={styles.title}>{t("title")}</h2>
        <p className={styles.text}>
          <span className={styles.highlight}>{paragraph1.highlight}</span>
          {paragraph1.text}
        </p>
        <p className={styles.text}>{t("paragraph2")}</p>
        {/* Uncomment if needed
        <a href="/about" className={styles.link}>
          <span>{t('learn_more')}</span>
          <span>
            <IconExternalLink size={20} />
          </span>
        </a>
        */}
      </motion.div>

      {/* Divider */}
      <div className={styles.divider}></div>
    </div>
  );
};

export default About;
