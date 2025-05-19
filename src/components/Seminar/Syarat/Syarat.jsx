import React from "react";
import styles from "./Syarat.module.css";

const Syarat = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.box}>
        <h2 className={styles.heading}>SYARAT PESERTA:</h2>
        <ol className={styles.list}>
          <li>Ikhwan dan akhwat.</li>
          <li>Berumur minimal 20 tahun.</li>
        </ol>
      </div>

      <div className={styles.box}>
        <h2 className={styles.heading}>JUMLAH PESERTA:</h2>
        <ol className={styles.list}>
          <li>Online: 50 orang.</li>
          <li>Offline: 100 orang.</li>
        </ol>
      </div>
    </div>
  );
};

export default Syarat;
