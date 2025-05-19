import React from "react";
import background from "../../../assets/imgs/pelatihan/pelatihansec6.jpg";
import styles from "./Participants.module.css";

const Participants = () => {
  return (
    <div className={styles.section}>
      {/* Background image with flip */}
      <div 
        className={styles.backgroundImage} 
        style={{ backgroundImage: `url(${background})` }}
      />
      
      {/* Content container (not flipped) */}
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h2 className={styles.heading}>Pola pembelajaran:</h2>
          <ol className={styles.list}>
            <li>Peserta dibagi menjadi beberapa halaqah maksimal 10 orang per halaqah.</li>
            <li>Tanya jawab antara pemateri dan peserta.</li>
            <li>Diskusi interaktif per halaqah.</li>
            <li>Presentasi perwakilan setiap halaqah.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Participants;