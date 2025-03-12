import React from "react";
import styles from "./Methods.module.css";
import Tamhid from "../../../assets/imgs/homepage/methods/tamhid.png";
import Tilawah from "../../../assets/imgs/homepage/methods/tilawah.png";
import Tafsir from "../../../assets/imgs/homepage/methods/tafsir.png";
import Tadabbur from "../../../assets/imgs/homepage/methods/tadabbur.png";
import Tazkiyah from "../../../assets/imgs/homepage/methods/tazkiyah.png";

const methods = [
  { title: "Tamhid", image: Tamhid },
  { title: "Tilawah", image: Tilawah },
  { title: "Tafsir", image: Tafsir },
  { title: "Tadabbur", image: Tadabbur },
  { title: "Tazkiyah", image: Tazkiyah },
];

const Methods = () => {
  return (
    <div className={styles.methods}>
      <div className={styles.container}>
        <h2 className={styles.header}>Tadarus al-Qur’an metode 5T</h2>
        <div className={styles.grid}>
          {methods.map((method, index) => (
            <div key={index} className={styles.methodItem}>
              <img
                src={method.image}
                alt={method.title}
                className={styles.image}
              />
              <p className={styles.title}>{method.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Methods;
