import React from "react";
import certificate from "../../../assets/imgs/pelatihan/certificate.png";
import styles from "./Fasilitas.module.css";

const Fasilitas = () => {
  return (
    <div className={styles.section}>
      <div className={styles.fadeTop}></div>

      <div className={styles.content}>
        <h2 className={styles.heading}>Fasilitas:</h2>
        <img src={certificate} alt="Sertifikat" className={styles.image} />
        <p className={styles.text}>Mendapatkan e-sertifikat keikutsertaan (pdf).</p>
      </div>

      <div className={styles.fadeBottom}></div>
    </div>
  );
};

export default Fasilitas;
