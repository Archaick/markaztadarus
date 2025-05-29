import { motion } from "framer-motion";
import styles from "./Toddlers.module.css";
import childBook from "../../../assets/imgs/ilmiah/toddlerbook.jpg";

// Animations
const imageVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
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

const Toddlers = () => {
  return (
    <div className={styles.wrapper}>
      {/* Content Block - Left to Right */}
      <motion.div
        className={styles.contentGroup}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={contentVariants}
      >
        <div className={styles.textContent}>
          <div className={styles.textHeader}>
            <h2>Pendidikan Qur'ani Anak</h2>
            <h3>Ages x–y Years</h3>
            <p>
              Description
            </p>
          </div>
        </div>

        <div className={styles.strikeBox}>
          <div className={styles.infoItem}>
            <span className={styles.number}>1</span>
            <h4>Kit Objectives</h4>
            <p>
              Reinforce selected Qur'anic values in the child's personality.
            </p>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.number}>2</span>
            <h4>Kit Objectives</h4>
            <p>Encourage creativity and innovation in children.</p>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.number}>3</span>
            <h4>Kit Objectives</h4>
            <p>Implement the curriculum in schools and educational centers.</p>
          </div>
        </div>
      </motion.div>

      {/* Book Image - Right to Left */}
      <motion.div
        className={styles.bookContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={imageVariants}
      >
        <img
          src={childBook}
          alt="Qur'anic Education Book"
          className={styles.bookImage}
        />
      </motion.div>
    </div>
  );
};

export default Toddlers;
