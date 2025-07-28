import {
  Button,
  Text,
  Container,
  Card,
  Image,
  Accordion,
  Box,
  List,
} from "@mantine/core";
import styles from "./Pelatihan.module.css";
import { IconHomeFilled, IconCircle, IconCheckbox } from "@tabler/icons-react";
import logo from "../../assets/imgs/MT-logo.svg";
import certificate from "../../assets/imgs/pelatihan/certificate.png";
import { motion } from "framer-motion";

// Fade-in variant from bottom
const fadeInVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const Pelatihan = () => {
  const programCards = [
    { title: "Memahami Tadarus Nabi dan Sahabat" },
    { title: "Mampu menerapkan metode 5T dalam majelis Tadarus" },
  ];

  return (
    <div className={styles.bghero}>
      <Container className={styles.topWrapper}>
        <div className={styles.header}>
          <img src={logo} alt="MT Logo" className={styles.logo} />
          <Button
            variant="filled"
            size="md"
            component="a"
            href="/"
            className={styles.homeButton}
          >
            <IconHomeFilled size={14} style={{ marginRight: "3px" }} />
            Beranda
          </Button>
        </div>

        <h2 className={styles.title}>PELATIHAN TADARUS 5T</h2>
        <Text className={styles.textContent} mt={50} p={6}>
          Merupakan kegiatan pelatihan untuk para dai dan guru Qur’an yang akan
          dikader menjadi trainer atau pengajar Tadarus metode 5T.
        </Text>
      </Container>

      <Container className={styles.contentWrapper}>
        {/* Program Cards Section */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Text
            className={styles.subtitle}
            mt={70}
            style={{ fontSize: "1.7rem" }}
          >
            Tujuan Umum Program
          </Text>
          <div className={styles.cardsContainer}>
            {programCards.map((card, index) => (
              <Card
                key={index}
                shadow="sm"
                padding="lg"
                radius="md"
                className={styles.card}
              >
                <div className={styles.cardContent}>
                  <Text size="lg" align="center" fw={700}>
                    {card.title}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Text
            className={styles.subtitle}
            mt={70}
            style={{ fontSize: "1.7rem" }}
          >
            Tujuan Khusus Program
          </Text>
          <List
            spacing="sm"
            mt="md"
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <List.Item
              icon={<IconCheckbox size={18} color="#FFD700" />}
              style={{
                fontWeight: "650",
                color: "white",
                width: "100%",
                maxWidth: "400px",
              }}
            >
              Mencetak trainer Tadarus 5T.
            </List.Item>
            <List.Item
              icon={<IconCheckbox size={18} color="#FFD700" />}
              style={{
                fontWeight: "650",
                color: "white",
                width: "100%",
                maxWidth: "400px",
              }}
            >
              Mencetak pengajar Tadarus 5T.
            </List.Item>
          </List>

          {/* 👇 Start here */}
          <Accordion
            variant="contained"
            mt={20}
            transitionDuration={1000}
            styles={{
              control: { backgroundColor: "#ffffff", color: "#0A3867" },
              item: { border: "1px solid #e0e0e0", borderRadius: "8px" },
              content: {
                backgroundColor: "#f7f7f7",
                padding: "1rem",
                fontWeight: "500",
              },
            }}
          >
            <Accordion.Item value="subtema">
              <Accordion.Control>
                <Text fw={800}>Materi Pelatihan</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ol>
                  <li>Keagungan al-Qur’an.</li>
                  <li>Landasan metode 5T dari al-Qur’an dan hadis.</li>
                  <li>Tadarus Nabi dan sahabat.</li>
                  <li>Keahlian penerapan metode 5T.</li>
                  <li>Mengenal referensi Tadarus.</li>
                  <li>Pemetaan ayat.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="durasi">
              <Accordion.Control>
                <Text fw={800}>Durasi Kegiatan</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ul
                  style={{
                    listStyleType: "none",
                    paddingLeft: 0,
                    marginLeft: 0,
                  }}
                >
                  <li>
                    Kegiatan berlangsung selama 2 hari dengan durasi 6 jam/hari.
                  </li>
                </ul>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="target">
              <Accordion.Control>
                <Text fw={800}>Target Peserta</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ol>
                  <li>Pimpinan lembaga.</li>
                  <li>Dai dan asatidz.</li>
                  <li>Guru al-Qur'an.</li>
                  <li>Praktisi dalam bidang al-Qur’an.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="peserta">
              <Accordion.Control>
                <Text fw={800}>Pola Pelatihan</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ol>
                  <li>
                    Peserta dibagi menjadi beberapa halaqah maksimal 5
                    orang/halaqah.
                  </li>
                  <li>Tanya jawab antara pemateri dan peserta.</li>
                  <li>Diskusi interaktif perhalaqah.</li>
                  <li>Praktek Tadarus perhalaqah.</li>
                  <li>Tadarus online surat al-Fatihah.</li>
                  <li>Tadarus via WhatsApp surat ad-Dhuha.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </motion.div>

        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Box
            mt={50}
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "600px",
              margin: "auto",
              color: "#0a3867",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Text fw={900} size="xl" ta="center">
              Jumlah Peserta:
            </Text>
            <List spacing="sm" mt="md">
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0a3867" }}
              >
                Minimal 20 orang dan maksimal 30 orang.
              </List.Item>
            </List>
          </Box>
        </motion.div>

        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Box mt={50} className={styles.responsiveCardContainer}>
            <Card className={`${styles.responsiveCard} ${styles.shiningCard}`}>
              <Text fw={800} align="center">
                Syarat Peserta
              </Text>
              <List spacing="sm" mt="md">
                <List.Item
                  icon={<IconCheckbox size={18} color="#FFD700" />}
                  style={{ fontWeight: "650" }}
                >
                  Ikhwan dan akhwat.
                </List.Item>
                <List.Item
                  icon={<IconCheckbox size={18} color="#FFD700" />}
                  style={{ fontWeight: "650" }}
                >
                  Pendidikan terakhir S1.
                </List.Item>
                <List.Item
                  icon={<IconCheckbox size={18} color="#FFD700" />}
                  style={{ fontWeight: "650" }}
                >
                  Pengalaman mengajar al-Qur’an.
                </List.Item>
                <List.Item
                  icon={<IconCheckbox size={18} color="#FFD700" />}
                  style={{ fontWeight: "650" }}
                >
                  Mampu berbahasa Arab (diutamakan).
                </List.Item>
                <List.Item
                  icon={<IconCheckbox size={18} color="#FFD700" />}
                  style={{ fontWeight: "650" }}
                >
                  Hafal Juz 30 mutqin (diutamakan).
                </List.Item>
              </List>
            </Card>
          </Box>
        </motion.div>

        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Box className={styles.facilitiesSection} mt={40} mb={40}>
            <Box className={styles.bookWrapper}>
              <Text fw={900} className={styles.facilitiesHeaderTitle}>
                Fasilitas:
              </Text>
              <Image
                src={certificate}
                alt="vector image of a certificate"
                className={styles.bookImage}
              />
              <Box className={styles.bookTexts}>
                <Text className={styles.bookText}>
                  Mendapatkan e-sertifikat keikutsertaan (pdf).
                </Text>
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Learning Intensity Section */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Box
            mt={50}
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "600px",
              margin: "auto",
              color: "#0a3867",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Text fw={900} size="xl" ta="center">
              Pembiayaan:
            </Text>
            <List spacing="sm" mt="md">
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0a3867" }}
              >
                Perihal yang terkait dengan transportasi, akomodasi dan modul
                pembelajaran dibebankan kepada Pihak Penyelenggara.
              </List.Item>
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0a3867" }}
              >
                Markaz Tadarus Indonesia menerima infaq dan shadaqah sebagai
                pendukung dakwah untuk penyebaran Tadarus 5T.
              </List.Item>
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0a3867" }}
              >
                Markaz Tadarus Indonesia akan mengirimkan utusan minimal 2 orang
                dan maksimal 3 orang.
              </List.Item>
            </List>
          </Box>
        </motion.div>

        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Box
            mt={50}
            style={{
              backgroundColor: "#ffffff",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "600px",
              margin: "auto",
              color: "#0a3867",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Text fw={900} size="xl" ta="center">
              Pembinaan:
            </Text>
            <List spacing="sm" mt="md">
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0a3867" }}
              >
                Pembinaan setelah pelatihan dilakukan secara online dengan
                teknis yang disepakati antara Markaz Tadarus Indonesia dan pihak
                penyelenggara sesuai kebutuhan.
              </List.Item>
            </List>
          </Box>
        </motion.div>
      </Container>
    </div>
  );
};

export default Pelatihan;
