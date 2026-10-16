import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import styles from "./About.module.css";
import AboutImage from "../../../assets/imgs/homepage/about.jpg";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { Modal } from "@mantine/core";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const fadeInSide = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const About = () => {
  const { t, i18n } = useTranslation("homepage/About");
  const [opened, setOpened] = useState(false);
  const isArabic = i18n.language.startsWith("ar");

  const paragraph1 = t("paragraph1", { returnObjects: true });

  return (
    <section className={styles.about} id="about">
      <div className={styles.container} dir={isArabic ? "rtl" : "ltr"}>
        {/* Photo in an arch, with a gold frame and the Markaz badge */}
        <motion.div className={styles.imageSection} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInSide}>
          <div className={styles.imageWrapper}>
            <div className={styles.pattern} aria-hidden="true" />
            <div className={styles.frame} aria-hidden="true" />
            <div className={styles.arch}>
              <img src={AboutImage} alt={t("title")} className={styles.image} />
            </div>
            <div className={styles.badge}>
              <img src="/MTIFavicon.png" alt="" className={styles.badgeLogo} />
              <div>
                <span className={styles.badgeName} lang="ar">
                  مركز التدارس
                </span>
                <span className={styles.badgePlace}>{t("badge")}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.content} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
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
              <span className={styles.playIcon}>
                <IconPlayerPlayFilled size={16} />
              </span>
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
            <iframe src="https://www.youtube.com/embed/q8JCiONd-Ho" title="Introductory Video - Indonesian" allowFullScreen />
          ) : (
            <iframe src="https://www.youtube.com/embed/Kyab-ckEIYQ" title="Introductory Video - Arabic" allowFullScreen />
          )}
        </div>
      </Modal>
    </section>
  );
};

export default About;
