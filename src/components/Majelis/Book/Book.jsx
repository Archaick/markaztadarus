import React from 'react';
import styles from "./Book.module.css";
import bookImage from "../../../assets/imgs/majelis/book.png";

const Book = () => {
  return (
    <div className={styles.section}>
      <div className={styles.inner}>
        <img src={bookImage} alt="Book" className={styles.bookImage} />
        <div className={styles.content}>
          <h2 className={styles.heading}>MODUL</h2>
          <ul className={styles.text}>
            <li>Kitab Tadarus Mubtadi.</li>
            <li>Kitab Pendidikan Qur’ani Anak.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Book;
