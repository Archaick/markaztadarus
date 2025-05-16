import React from "react";
import background from "../../../assets/imgs/pelatihan/pelatihansec6.jpg";
import styles from "./Participants.module.css";

const Participants = () => {
  return (
    <div
      className={styles.section}
      style={{
        backgroundImage: `url(${background})`,
      }}
    >
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h2 className={styles.heading}>JUMLAH PESERTA:</h2>
          <p className={styles.text}>Minimal 20 orang dan maksimal 30 orang.</p>
        </div>
      </div>
    </div>
  );
};

export default Participants;
