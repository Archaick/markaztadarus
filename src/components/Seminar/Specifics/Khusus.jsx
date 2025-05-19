import React from "react";
import styles from "./Khusus.module.css";
import background from "../../../assets/imgs/pelatihan/pelatihansec3.jpg";

const Khusus = () => {
  return (
    <div
      className={styles.section}
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h2 className={styles.heading}>TUJUAN KHUSUS PROGRAM</h2>
          <ul className={styles.list}>
            <li>Seleksi peserta yang akan.</li>
            <li>mengikuti program ToT.</li>
          </ul>

          <h2 className={styles.heading}>TEMA UTAMA:</h2>
          <ul className={styles.materiList}>
            <li>Seminar Tadarus 5T.</li>
          </ul>

          <h3 className={styles.subheading}>SUB TEMA:</h3>
          <ul className={styles.materiList}>
            <li>1. Tadarus 5T.</li>
            <li>2. Kunci-kunci tadabbur.</li>
            <li>3. Praktek singkat.</li>
            <li>4. Pengenalan Program Duta Qur'an di Mekah.</li>
          </ul>

          <h3 className={styles.subheading}>DURASI KEGIATAN:</h3>
          <p className={styles.duration}>
            Kegiatan berlangsung selama kurang lebih 2-3 jam.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Khusus;
