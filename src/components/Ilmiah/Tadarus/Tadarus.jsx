import { motion } from "framer-motion";
import styles from "./Tadarus.module.css";
import tadarusBook from "../../../assets/imgs/ilmiah/tadarusbook.jpeg";

// Animations
const imageVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.2 },
  },
};

const Tadarus = () => {
  return (
    <div className={styles.wrapper}>
      {/* Book Image - Right to Left */}
      <motion.div
        className={styles.bookContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={imageVariants}
      >
        <img
          src={tadarusBook}
          alt="Tadarus Qur'ani Book"
          className={styles.bookImage}
        />
      </motion.div>

      {/* Content - Left to Right */}
      <motion.div
        className={styles.contentGroup}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={contentVariants}
      >
        <div className={styles.textContent}>
          <div className={styles.textHeader}>
            <h2>Tadarus Al Qur'an</h2>
            <h3>X–Y</h3>
            <p>
              Description
            </p>
          </div>
        </div>

        <div className={styles.strikeBox}>
          <div className={styles.infoItem}>
            <span className={styles.number}>1</span>
            <h4>Tamhid</h4>
            <p>
              An engaging introduction using thought-provoking questions to
              provide a glimpse of the verse or surah being studied.
            </p>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.number}>2</span>
            <h4>Tilawah</h4>
            <p>
              Reciting the selected verses with mindfulness to connect the heart
              with the Qur'an.
            </p>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.number}>3</span>
            <h4>Tafsir</h4>
            <p>
              Briefly explaining key words or phrases in the verse to enhance
              understanding of its meaning.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Tadarus;
