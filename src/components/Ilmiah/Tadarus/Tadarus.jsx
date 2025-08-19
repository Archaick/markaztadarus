import { useState } from "react";
import { motion } from "framer-motion";
import { Modal, Button, Image } from "@mantine/core";
import { IconBrandWhatsapp, IconChecklist } from "@tabler/icons-react";
import { Carousel } from "@mantine/carousel";
import styles from "./Tadarus.module.css";
import tadarusBook from "../../../assets/imgs/ilmiah/tadarusbook.jpg";
// import brochure from "../../../assets/imgs/ilmiah/brochure.jpg";
import Whatsapp from "../../Whatsapp/Whatsapp";
import TadarusBookAr from "../../../assets/imgs/ilmiah/tadarusbook-ar.jpg";
import Autoplay from "embla-carousel-autoplay";
const Tadarus = () => {
  const [opened, setOpened] = useState(false);
  const autoplay = Autoplay({ delay: 3000, stopOnInteraction: false });

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
          <Carousel
            withIndicators
            loop
            withControls={false}
            plugins={[autoplay]}
            height="100%"
            slideSize="100%"
            slideGap="0"
            align="start"
            styles={{
              root: {
                width: "100%",
                maxWidth: "400px",
                margin: "0 auto",
              },
              viewport: {
                borderRadius: "1rem",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
              },
              indicator: {
                width: 10,
                height: 10,
                transition: "width 250ms ease",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                "&[data-active]": {
                  width: 20,
                  backgroundColor: "#f7c04a",
                },
              },
              indicators: {
                bottom: -30,
              },
            }}
            sx={{
              ".mantine-Carousel-slide": {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              },
            }}
          >
            <Carousel.Slide>
              <img
                src={tadarusBook}
                alt="Tadarus Qur'ani Book (Indonesian) cover"
                className={styles.bookImage}
              />
            </Carousel.Slide>
            <Carousel.Slide>
              <img
                src={TadarusBookAr}
                alt="Tadarus Qur'ani Book (Arabic) cover"
                className={styles.bookImage}
              />
            </Carousel.Slide>
          </Carousel>
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
            Buku ini merupakan <strong>Rujukan</strong> bagi Guru dan Peserta
            yang akan melaksanakan majelis Tadarus, namun dapat juga digunakan
            untuk bacaan mandiri. Buku disusun berdasarkan Metode 5T, dimulai
            dengan
            <strong> Tamhid</strong> berupa pertanyaan sekitar surat. Kemudian{" "}
            <strong>Tilawah</strong> berupa teks Ayat. Kemudian{" "}
            <strong>Tafsir</strong> berupa makna ayat secara singkat. Kemudian
            <strong> Tadabbur</strong> berupa pelajaran dari ayat. Diakhiri
            dengan <strong>Tazkiyah</strong> berupa pengamalan ayat, baik amalan
            hati atau perbuatan. Kandungan surat pada buku mencakup surat-surat{" "}
            <strong>mufashshal</strong> yaitu Qaf sampai an-Nas, dibagi
            ke dalam 4 buku.
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
                <h4>Buku Juz 30</h4>
                <p>
                  Mencakup surat an-Naba sampai an-Nas ditambah dengan surat
                  al-Fatihah di bagian depan. Buku ini adalah sebagai materi
                  pertama.
                </p>
              </div>
            </div>

            <div className={styles.glassCard}>
              <span className={styles.icon}>
                <IconChecklist size={28} stroke={2} />
              </span>
              <div>
                <h4>Buku Juz 29</h4>
                <p>Mencakup surat al-Mulk sampai al-Mursalat.</p>
              </div>
            </div>

            <div className={styles.glassCard}>
              <span className={styles.icon}>
                <IconChecklist size={28} stroke={2} />
              </span>
              <div>
                <h4>Buku Juz 28</h4>
                <p>Mencakup surat al-Mujadilah sampai at-Tahrim.</p>
              </div>
            </div>
            <div className={styles.glassCard}>
              <span className={styles.icon}>
                <IconChecklist size={28} stroke={2} />
              </span>
              <div>
                <h4>Buku Juz 27</h4>
                <p>
                  Mencakup surat adz-Dzariyat sampai al-Hadid, ditambah
                  dengan surat Qaf.
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
      <Whatsapp />
    </div>
  );
};

export default Tadarus;
