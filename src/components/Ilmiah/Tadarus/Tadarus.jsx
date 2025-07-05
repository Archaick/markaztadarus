import { useState } from "react";
import { motion } from "framer-motion";
import { Modal, Button, Image } from "@mantine/core";
import { IconBrandWhatsapp, IconChecklist } from "@tabler/icons-react";

import styles from "./Tadarus.module.css";
import tadarusBook from "../../../assets/imgs/ilmiah/tadarusbook.jpg";
// import brochure from "../../../assets/imgs/ilmiah/brochure.jpg";

const Tadarus = () => {
  const [opened, setOpened] = useState(false);

  const waMessage =
    "Assalamu Alaikum warahmatullah wabarakatuh. \n\nSaya ingin berkonsultasi dengan buku Tadarus Al-Qur'an";
  const waNumber = "6282113324807";
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    waMessage
  )}`;

  return (
    <div className={styles.fullWidthBg}>
      <div className={styles.wrapper}>
        {/* Image on Left */}
        <motion.div
          className={styles.left}
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <img
            src={tadarusBook}
            alt="Tadarus Qur'ani Book"
            className={styles.bookImage}
          />
        </motion.div>

        {/* Text + Features on Right */}
        <motion.div
          className={styles.right}
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.title}>Buku Tadarus al-Quran</h2>
          <h3 className={styles.subtitle}>Untuk Dewasa dan Umum</h3>
          <p className={styles.description}>
            Buku ini berisikan panduan bertadarus yang disusun secara sistematis
            melalui pendekatan metode 5T. Materi yang terdapat di buku ini
            berisikan pembahasan surat-surat dalam al-Quran yang dimulai dari
            surat Qaf hingga surat an-Nas dan ditambahkan surat al-Fatihah.
            Secara keseluruhan terbagi menjadi 4 buku berdasarkan pembagian juz
            dalam al-Qur'an yang dimulai dari juz 27 sampai juz 30.
          </p>

          <div className={styles.buttonWrap}>
            <Button
              onClick={() => setOpened(true)}
              className={styles.customButton}
            >
              Selengkapnya
            </Button>
          </div>

          <div className={styles.infoBox}>
            <div className={styles.glassCard}>
              <span className={styles.icon}>
                <IconChecklist size={28} stroke={2} />
              </span>
              <div>
                <h4>Buku 1</h4>
                <p>
                  Mencakup surat-surat yang terdapat di juz 27 yaitu dari surat
                  adz-Dzariyat hingga surat al-Hadid dengan ditambahkan surat
                  Qaf sebagai materi pertama.
                </p>
              </div>
            </div>

            <div className={styles.glassCard}>
              <span className={styles.icon}>
                <IconChecklist size={28} stroke={2} />
              </span>
              <div>
                <h4>Buku 2</h4>
                <p>
                  Mencakup surat-surat yang terdapat di juz 28 yaitu dari surat
                  al-Mujadilah hingga surat at-Tahrim.
                </p>
              </div>
            </div>

            <div className={styles.glassCard}>
              <span className={styles.icon}>
                <IconChecklist size={28} stroke={2} />
              </span>
              <div>
                <h4>Buku 3</h4>
                <p>
                  Mencakup surat-surat yang ada di juz 29 yaitu dari surat
                  al-Mulk hingga surat al-Mursalat.
                </p>
              </div>
            </div>
            <div className={styles.glassCard}>
              <span className={styles.icon}>
                <IconChecklist size={28} stroke={2} />
              </span>
              <div>
                <h4>Buku 4</h4>
                <p>
                  Mencakup surat-surat yang ada di juz 30 yaitu dari surat
                  an-Naba hingga surat an-Nas.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modal */}
        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title="Tadarus Al-Qur'an"
          size="lg"
          centered
          styles={{
            title: {
              textAlign: "center",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "#fff", // White title
              width: "100%", // Ensures center alignment is respected
            },
            header: {
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              color: "#fff",
            },
            content: {
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
              color: "#fff",
              padding: 0,
            },
            body: {
              padding: "1rem",
              maxHeight: "70vh",
              overflowY: "auto",
              scrollbarColor: "#999 transparent",
              scrollbarWidth: "thin",
            },
          }}
        >
          {/* <Image src={brochure} alt="Brochure" radius="md" mb="md" /> */}
          <h4 className={styles.previewTitle}>Lihat Contoh Halaman</h4>
          <iframe
            src="https://drive.google.com/file/d/YOUR_FILE_ID/preview"
            width="100%"
            height="400px"
            allow="autoplay"
            title="PDF Preview"
            style={{ border: "none", borderRadius: "12px" }}
          ></iframe>

          <Button
            fullWidth
            mt="md"
            color="green"
            leftSection={<IconBrandWhatsapp size={18} />}
            component="a"
            href={waLink}
            target="_blank"
          >
            Hubungi via WhatsApp
          </Button>
        </Modal>
      </div>
    </div>
  );
};

export default Tadarus;
