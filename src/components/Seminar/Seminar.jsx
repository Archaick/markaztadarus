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
import styles from "./Seminar.module.css";
import { IconHomeFilled, IconCircle, IconCheckbox } from "@tabler/icons-react";
import logo from "../../assets/imgs/MT-logo.svg";
import certificate from "../../assets/imgs/pelatihan/certificate.png";
import { motion } from "framer-motion"; // Re-import motion

const fadeInVariants = {
  hidden: { opacity: 0, y: 50 }, // Starts invisible and 50px down
  visible: {
    opacity: 1,
    y: 0, // Ends fully visible at its natural position
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const Seminar = () => {
  const programCards = [
    { title: "Memahami tujuan utama dari mempelajari al-Qur’an" },
    { title: "Memahami secara sempurna arti kata “Tadarus”" },
    {
      title: "Memahami definisi 5T serta perbedaan antara Tafsir dan Tadabbur",
    },
    {
      title:
        "Mengetahui kunci-kunci tadabbur untuk memetik pelajaran dari ayat",
    },
    { title: "Memahami cara mengamalkan ayat dalam keseharian" },
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
            href="/umrah/#program"
            className={styles.homeButton}
          >
            <IconHomeFilled size={14} style={{ marginRight: "3px" }} />
            Beranda
          </Button>
        </div>

        <h2 className={styles.title}>SEMINAR TADARUS 5T</h2>
        <Text className={styles.textContent} mt={50} p={6}>
          Merupakan kegiatan berupa kuliah umum berisi pengenalan Tadarus
          al-Qur’an Metode 5T yang disampaikan secara interaktif.
        </Text>
      </Container>

      <Container className={styles.contentWrapper}>
        {/* Program Cards Section - Motion enabled */}
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

        {/* Accordion Tujuan Khusus - Motion enabled */}
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
              Seleksi peserta yang akan.
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
              mengikuti program ToT.
            </List.Item>
          </List>

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
            <Accordion.Item value="kurikulum">
              <Accordion.Control>
                <Text fw={800}>Tema Utama</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ul
                  style={{
                    listStyleType: "none",
                    paddingLeft: 0,
                    marginLeft: 0,
                  }}
                >
                  <li>Seminar Tadarus 5T</li>
                </ul>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="subtema">
              <Accordion.Control>
                <Text fw={800}>Sub Tema</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ol>
                  <li>Tadarus 5T.</li>
                  <li>Kunci-kunci tadabbur.</li>
                  <li>Praktek singkat.</li>
                  <li>Pengenalan Program Duta Qur'an di Mekah.</li>
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
                  <li>Kegiatan berlangsung selama kurang lebih 2-3 jam</li>
                </ul>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="peserta">
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

            <Accordion.Item value="gambaran">
              <Accordion.Control>
                <Text fw={800}>Gambaran Kegiatan Acara</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ol>
                  <li>Sambutan-sambutan.</li>
                  <li>Pengenalan program Duta Qur’an.</li>
                  <li>Materi 1: Tadarus Metode 5T.</li>
                  <li>Istirahat.</li>
                  <li>Kesimpulan dari peserta.</li>
                  <li>Materi 2: Kunci Tadabbur dan Praktek Tadarus 5T.</li>
                  <li>Kesan dan pesan dari peserta.</li>
                  <li>Penutup.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </motion.div>

        {/* Syarat Peserta & Jumlah Peserta - Motion enabled + Dark theme with shine */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Box mt={50} className={styles.responsiveCardContainer}>
            <Card className={`${styles.responsiveCard} ${styles.shiningCard}`}>
              <Text fw={700} align="center">
                Syarat Peserta
              </Text>
              <List spacing="sm" mt="md">
                <List.Item
                  icon={<IconCircle size={18} color="#FFD700" />}
                  style={{ fontWeight: "650" }}
                >
                  Ikhwan dan akhwat.
                </List.Item>
                <List.Item
                  icon={<IconCircle size={18} color="#FFD700" />}
                  style={{ fontWeight: "650" }}
                >
                  Berumur minimal 20 tahun.
                </List.Item>
              </List>
            </Card>

            <Card className={`${styles.responsiveCard} ${styles.shiningCard}`}>
              <Text fw={700} align="center">
                Jumlah Peserta
              </Text>
              <List spacing="sm" mt="md">
                <List.Item
                  icon={<IconCircle size={18} color="#FFD700" />}
                  style={{ fontWeight: "650" }}
                >
                  Online: 50 orang.
                </List.Item>
                <List.Item
                  icon={<IconCircle size={18} color="#FFD700" />}
                  style={{ fontWeight: "650" }}
                >
                  Offline: 100 orang.
                </List.Item>
              </List>
            </Card>
          </Box>
        </motion.div>

        {/* Pola Pembelajaran - Motion enabled + Dark theme with shine */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Box
            mt={50}
            className={styles.shiningCard}
            style={{
              backgroundColor: "white ",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "600px",
              margin: "auto",
              color: "#0A3867",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Text fw={900} size="xl" ta="center">
              Pola Pembelajaran:
            </Text>
            <List spacing="sm" mt="md">
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0A3867" }}
              >
                Peserta dibagi menjadi beberapa halaqah maksimal 10 orang per
                halaqah.
              </List.Item>
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0A3867" }}
              >
                Tanya jawab antara pemateri dan peserta.
              </List.Item>
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0A3867" }}
              >
                Diskusi interaktif per halaqah.
              </List.Item>
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0A3867" }}
              >
                Presentasi perwakilan setiap halaqah.
              </List.Item>
            </List>
          </Box>
        </motion.div>

        {/* Book Section - Motion enabled (reverting to original shine for bookWrapper) */}
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

        {/* Pembiayaan Section - Motion enabled + Dark theme with shine */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Box
            mt={50}
            className={styles.shiningCard}
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "600px",
              margin: "auto",
              color: "#0A3867",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Text fw={900} size="xl" ta="center">
              Pembiayaan:
            </Text>
            <List spacing="sm" mt="md">
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0A3867" }}
              >
                Perihal yang terkait dengan transportasi, akomodasi dan modul
                pembelajaran dibebankan kepada Pihak Penyelenggara.
              </List.Item>
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0A3867" }}
              >
                Markaz Tadarus Indonesia menerima infaq dan shadaqah sebagai
                pendukung dakwah untuk penyebaran Tadarus 5T.
              </List.Item>
            </List>
          </Box>
        </motion.div>
      </Container>
    </div>
  );
};

export default Seminar;