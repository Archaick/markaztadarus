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
            <h3>6-10</h3>
            <p>
              Merupakan buku panduan program pendidikan al-Qur'an untuk anak
              yang bertujuan untuk membangun kepribadian Qur'ani yang dipetik
              dari surat adh-Dhuha sampai an-Nas.
            </p>
          </div>
        </div>

        <div className={styles.strikeBox}>
          <div className={styles.infoItem}>
            <span className={styles.number}>1</span>
            <h4>Target Kompetensi</h4>
            <p>
              Menanamkan keimanan pada hati dan jiwa anak-anak dari pembelajaran
              setiap ayat atau surat.
            </p>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.number}>2</span>
            <h4>Keistimewaan</h4>
            <p>
              Terdapat latihan tugas yang mengokohkan pengamalan nilai-nilai
              Al-Qur’an.
            </p>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.number}>3</span>
            <h4>Peruntukan</h4>
            <p>Sekolah TK dan SD, TPA, lembaga tahfiz dan keluarga di rumah.</p>
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
