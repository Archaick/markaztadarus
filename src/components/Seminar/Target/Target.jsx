import React from "react";
import background from "../../../assets/imgs/pelatihan/pelatihansec4.jpg";
import styles from "./Target.module.css";

const Target = () => {
  return (
    <div
      className={styles.section}
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h2 className={styles.heading}>TARGET PESERTA:</h2>
          <ul className={styles.list}>
            <li>Pimpinan lembaga.</li>
            <li>Dai dan asatidz.</li>
            <li>Guru al-Qur'an.</li>
            <li>Praktisi dalam bidang al-Qur’an.</li>
          </ul>

          <h3 className={styles.subheading}>Gambaran Kegiatan Acara:</h3>
          <ul className={styles.polaList}>
            <li>1. Sambutan-sambutan.</li>
            <li>2. Pengenalan program Duta Qur’an.</li>
            <li>3. Materi 1: Tadarus Metode 5T.</li>
            <li>4. Istirahat.</li>
            <li>5. Kesimpulan dari peserta.</li>
            <li>6. Materi 2: Kunci Tadabbur dan Praktek Tadarus 5T.</li>
            <li>7. Kesan dan pesan dari peserta.</li>
            <li>8. Penutup.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Target;
