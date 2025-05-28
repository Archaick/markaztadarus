import React from 'react';
import styles from './Khusus.module.css';
import background from '../../../assets/imgs/pelatihan/pelatihannewsec3.jpg';

const Khusus = () => {
  return (
    <div
      className={styles.section}
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h2 className={styles.heading}>TUJUAN KHUSUS PROGRAM</h2>
          <ul className={styles.list}>
            <li>Mencetak trainer Tadarus 5T.</li>
            <li>Mencetak pengajar Tadarus 5T.</li>
          </ul>

          <h3 className={styles.subheading}>Materi Pelatihan:</h3>
          <ul className={styles.materiList}>
            <li>1. Keagungan al-Qur’an.</li>
            <li>2. Landasan metode 5T dari al-Qur’an dan hadis.</li>
            <li>3. Tadarus Nabi dan sahabat.</li>
            <li>4. Keahlian penerapan metode 5T.</li>
            <li>5. Mengenal referensi Tadarus.</li>
            <li>6. Pemetaan ayat.</li>
          </ul>

          <h3 className={styles.subheading}>DURASI KEGIATAN:</h3>
          <p className={styles.duration}>
            Kegiatan berlangsung selama 2 hari dengan durasi 6 jam/hari.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Khusus;
