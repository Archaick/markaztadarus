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
          <h2 className={styles.heading}>INTENSITAS PEMBELAJARAN:</h2>
          <p>Minimal 1 ayat per pekan.</p>
        </div>
      </div>
    </div>
  );
};

export default Participants;