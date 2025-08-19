import { useState } from "react";
import { motion } from "framer-motion";
import { Modal, Button, Image } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import {
  IconTarget,
  IconStar,
  IconUsersGroup,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import styles from "./Toddlers.module.css";
import childBook from "../../../assets/imgs/ilmiah/toddlerbook.jpg";
import childBookAr from "../../../assets/imgs/ilmiah/toddlerbook-ar.jpg";
import Autoplay from "embla-carousel-autoplay";
// import brochure from "../../../assets/imgs/ilmiah/brochure.jpg";

const Toddlers = () => {
  const [opened, setOpened] = useState(false);
  const autoplay = Autoplay({ delay: 3000, stopOnInteraction: false  });

  return (
    <div className={styles.fullWidthBg}>
      <div className={styles.wrapper}>
        {/* Left Section */}
        <motion.div
          className={styles.left}
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.title}>Pendidikan Qur'ani Anak</h2>
          <h3 className={styles.subtitle}>Usia 6 — 10 Tahun</h3>
          <p className={styles.description}>
            Buku panduan pendidikan al-Qur'an yang membentuk kepribadian Qur'ani
            melalui surat adh-Dhuha sampai an-Nas.
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
              <IconTarget size={28} className={styles.icon} />
              <div>
                <h4>Target Kompetensi</h4>
                <p>Menanamkan keimanan melalui pembelajaran ayat/surat.</p>
              </div>
            </div>
            <div className={styles.glassCard}>
              <IconStar size={28} className={styles.icon} />
              <div>
                <h4>Keistimewaan</h4>
                <p>Latihan tugas yang menguatkan pengamalan nilai Qur'ani.</p>
              </div>
            </div>
            <div className={styles.glassCard}>
              <IconUsersGroup size={28} className={styles.icon} />
              <div>
                <h4>Peruntukan</h4>
                <p>TK/SD, TPA, lembaga tahfiz, dan keluarga di rumah.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Section - Now with Carousel */}
        <motion.div
          className={styles.right}
          initial={{ opacity: 0, x: 50 }}
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
                src={childBook}
                alt="Buku Qur'ani Anak (Indonesian)"
                className={styles.bookImage}
              />
            </Carousel.Slide>
            <Carousel.Slide>
              <img
                src={childBookAr}
                alt="Buku Qur'ani Anak (Arabic)"
                className={styles.bookImage}
              />
            </Carousel.Slide>
          </Carousel>
        </motion.div>

        {/* Modal */}
        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title="Pendidikan Qur'ani Anak"
          size="lg"
          centered
          scrollAreaComponent="div"
          styles={{
            title: {
              textAlign: "center",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "#fff",
              flex: 1,
            },
            header: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
            },
            close: {
              position: "absolute",
              right: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
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
              overflowY: "auto",
              scrollbarColor: "rgba(255,255,255,0.4) transparent",
              scrollbarWidth: "thin",
            },
            body: {
              paddingTop: "0.5rem",
              paddingBottom: "1.5rem",
            },
          }}
        >
          <h4 className={styles.previewTitle}>Lihat Contoh Halaman</h4>
          <iframe
            src="https://drive.google.com/file/d/1QgBMDZw0Rx5zJbZQOxJoVPuiU3RxbNFb/preview"
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
            href="https://wa.me/+6287875764426"
            target="_blank"
          >
            Hubungi via WhatsApp
          </Button>
        </Modal>
      </div>
    </div>
  );
};

export default Toddlers;
