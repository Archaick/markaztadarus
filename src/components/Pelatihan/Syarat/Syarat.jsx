import React from "react";
import styles from "./Syarat.module.css";

const Syarat = () => {
  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h2 className={styles.heading}>SYARAT PESERTA:</h2>
        <ol className={styles.list}>
          <li>Ikhwan dan akhwat.</li>
          <li>Pendidikan terakhir S1.</li>
          <li>Pengalaman mengajar al-Qur’an.</li>
          <li>Mampu berbahasa Arab (diutamakan).</li>
          <li>Hafal Juz 30 mutqin (diutamakan).</li>
        </ol>
      </div>
    </div>
  );
};

export default Syarat;
