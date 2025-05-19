import React from "react";
import background from "../../../assets/imgs/pelatihan/pelatihansec4.jpg";
import styles from "./Target.module.css";

const Target = () => {
  return (
    <div className={styles.section}>
      {/* Background image with flip */}
      <div 
        className={styles.backgroundImage} 
        style={{ backgroundImage: `url(${background})` }}
      />
      
      {/* Content container */}
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h2 className={styles.heading}>TARGET PESERTA:</h2>
          <ul className={styles.list}>
            <li>Pimpinan lembaga.</li>
            <li>Dai dan asatidz.</li>
            <li>Guru al-Qur'an.</li>
            <li>Praktisi bidang al-Qur'an.</li>
          </ul>

          <h3 className={styles.subheading}>Pola pelatihan:</h3>
          <ul className={styles.polaList}>
            <li>Peserta dibagi menjadi beberapa halaqah maksimal 5 orang/halaqah.</li>
            <li>Tanya jawab antara pemateri dan peserta.</li>
            <li>Diskusi interaktif perhalaqah.</li>
            <li>Praktek Tadarus perhalaqah.</li>
            <li>Tadarus online surat al-Fatihah.</li>
            <li>Tadarus via WhatsApp surat ad-Dhuha.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Target;