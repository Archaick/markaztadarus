import React from 'react';
import background from "../../../assets/imgs/pelatihan/pelatihansec8.jpg";
import styles from "./Pembiayaan.module.css";

const Pembiayaan = () => {
  return (
    <div className={styles.section} style={{ backgroundImage: `url(${background})` }}>
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h2 className={styles.heading}>Pembiayaan:</h2>
          <ul className={styles.list}>
            <li>
              Perihal yang terkait dengan transportasi, akomodasi dan modul pembelajaran dibebankan kepada Pihak Penyelenggara.
            </li>
            <li>
              Markaz Tadarus Indonesia menerima infaq dan shadaqah sebagai pendukung dakwah untuk penyebaran Tadarus 5T.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Pembiayaan;
