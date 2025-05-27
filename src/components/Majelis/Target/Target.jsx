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
          <h2 className={styles.heading}>Pola pelatihan:</h2>
          <ul className={styles.list}>
            <li>Tanya jawab antara pemateri dan peserta.</li>
            <li>Diskusi interaktif sesama peserta.</li>
          </ul>

          <h3 className={styles.subheading}>Syarat peserta:</h3>
          <ul className={styles.polaList}>
            <li>1. Ikhwan dan Akhwat.</li>
            <li>2. Berkomitmen dalam belajar.</li>
          </ul>

          <h3 className={styles.subheading}>JUMLAH PESERTA:</h3>
          <ul className={styles.polaList}>
            <li> 5-10 Orang perhalaqah.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Target;
