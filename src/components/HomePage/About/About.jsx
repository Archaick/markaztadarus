import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import styles from "./About.module.css";
import AboutImage from "../../../assets/imgs/homepage/about.jpg";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { Modal } from "@mantine/core";

const About = () => {
  const { t, i18n } = useTranslation("homepage/About");
  const [opened, setOpened] = useState(false);

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const paragraph1 = t("paragraph1", { returnObjects: true });

  return (
    <section className={styles.about} id="about">
      <div 
        className={styles.container}
        dir={i18n.language === "ar" ? "rtl" : "ltr"}
      >
        {/* Left: Image Section */}
        <motion.div 
          className={styles.imageSection}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInLeft}
        >
          <div className={styles.imageWrapper}>
            <div className={styles.imageBackdrop}></div>
            <img src={AboutImage} alt={t("title")} className={styles.image} />
            <div className={styles.glassElement}>
               {/* Small decorative icon or year */}
               <div style={{ color: "#ab8b2b", fontWeight: 800, fontSize: "1.5rem" }}>
                 MT
               </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Content Section */}
        <motion.div 
          className={styles.content}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className={styles.title}>{t("title")}</h2>
          <div className={styles.textContent}>
            <p className={styles.text}>
              <span className={styles.highlight}>{paragraph1.highlight}</span>
              {paragraph1.text}
            </p>
            <p className={styles.text}>{t("paragraph2")}</p>
          </div>

          <div className={styles.ctaContainer}>
            <button className={styles.modalButton} onClick={() => setOpened(true)}>
              <IconPlayerPlayFilled size={20} />
              {t("modalButtonTitle")}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Video Modal */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={<div className={styles.modalTitle}>{t("modalTitle")}</div>}
        centered
        size="lg"
        classNames={{
          header: styles.modalHeader,
          content: styles.modalContent,
        }}
      >
        <div className={styles.videoContainer}>
          {["id", "en"].includes(i18n.language) ? (
            <iframe
              src="https://www.youtube.com/embed/q8JCiONd-Ho"
              title="Introductory Video - Indonesian"
              allowFullScreen
            />
          ) : (
            <iframe
              src="https://www.youtube.com/embed/Kyab-ckEIYQ"
              title="Introductory Video - Arabic"
              allowFullScreen
            />
          )}
        </div>
      </Modal>
    </section>
  );
};

export default About;
