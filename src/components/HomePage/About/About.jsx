import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import styles from "./About.module.css";
import AboutImage from "../../../assets/imgs/homepage/about.jpg";
import { IconExternalLink } from "@tabler/icons-react";
import { Modal, Button } from "@mantine/core"; // Assuming you are using Mantine for modals

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
  const { i18n } = useTranslation();
  const [opened, setOpened] = useState(false);

  const openModal = () => setModalOpened(true);
  const closeModal = () => setModalOpened(false);

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
        <div
          className={styles.container}
          dir={i18n.language === "ar" ? "rtl" : "ltr"}
          lang={i18n.language}
        >
          <h2 className={styles.title}>{t("title")}</h2>
          <p className={styles.text}>
            <span className={styles.highlight}>{paragraph1.highlight}</span>
            {paragraph1.text}
          </p>
          <p className={styles.text}>{t("paragraph2")}</p>
        </div>

        <button className={styles.modalButton} onClick={() => setOpened(true)}>
          {t("modalButtonTitle")}
        </button>

        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title={
            <div className={styles.modalTitle}>
              <span>{t("modalTitle")}</span>
            </div>
          }
          centered
          size="lg"
          classNames={{
            header: styles.modalHeader,
            content: styles.modalContent,
            body: styles.modalBody,
          }}
        >
          <div className={styles.modalContentWrapper}>
            <div className={styles.videoContainer}>
              {/* the default website is indonesia language */}

              {/* run the following only when the arabic version is selected */}
              {["id", "en"].includes(i18n.language) ? (
                <iframe
                  src="https://www.youtube.com/embed/q8JCiONd-Ho"
                  title="Introductory Video - Indonesian"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                />
              ) : (
                <iframe
                  src="https://www.youtube.com/embed/Kyab-ckEIYQ"
                  title="Introductory Video - Arabic"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                />
              )}
            </div>
          </div>
        </Modal>
      </motion.div>

      {/* Divider */}
      <div className={styles.divider}></div>
    </div>
  );
};

export default About;
