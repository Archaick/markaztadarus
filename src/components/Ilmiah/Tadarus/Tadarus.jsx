import { useState } from "react";
import { motion } from "framer-motion";
import { Modal, Button, Image } from "@mantine/core";
import { IconBrandWhatsapp, IconChecklist } from "@tabler/icons-react";

import styles from "./Tadarus.module.css";
import tadarusBook from "../../../assets/imgs/ilmiah/tadarusbook.jpeg";
import brochure from "../../../assets/imgs/ilmiah/brochure.jpg"; // Add your real image

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
          <h2 className={styles.title}>Tadarus Al-Qur'an</h2>
          <h3 className={styles.subtitle}>Untuk Segala Usia</h3>
          <p className={styles.description}>
            Buku Tadarus al-Qur’an merupakan panduan pelaksanaan Majelis Tadarus
            yang memuat surat-surat Mufassal dan Qishar Mufassal — mulai dari
            surat Qaf hingga An-Nas. Buku ini bertujuan membimbing peserta
            memahami, menghayati, dan mengamalkan ayat-ayat al-Qur’an secara
            bertahap.
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
                <p>Mencakup surat Qaf, Juz Adz-Dzariyat, dan Juz Qad Sami‘a.</p>
              </div>
            </div>

            <div className={styles.glassCard}>
              <span className={styles.icon}>
                <IconChecklist size={28} stroke={2} />
              </span>
              <div>
                <h4>Buku 2</h4>
                <p>
                  Fokus pada Juz Tabarak dengan penekanan nilai-nilai hikmah.
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
                  Berisi al-Fatihah dan Juz Amma untuk pendalaman surat pendek.
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
