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
            <li>Mampu menghayati dan menikmati al-Qur’an secara mandiri.</li>
          </ul>

          <h2 className={styles.heading}>Kurikulum:</h2>
          <ul className={styles.materiList}>
            <li>1. Ad-Dhuha s/d an-Nas.</li>
            <li>2. Al-lail s/d an-Naba.</li>
            <li>3. Al-Mulk s/d al-Mursalat.</li>
            <li>4. Al-Mujadilah s/d at-Tahrim.</li>
            <li>5. Qaf s/d al-Hadid.</li>
            <li>6. Ayat-ayat atau surat-surat pilihan.</li>
          </ul>

          <h3 className={styles.subheading}>DURASI KEGIATAN:</h3>
          <ul className={styles.materiList}>
            <li>45-60 menit.</li>
          </ul>

          <h3 className={styles.subheading}>TARGET PESERTA:</h3>
          <p className={styles.duration}>
            1. Pelajar <br /> 2. Masyarakat umum.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Khusus;
