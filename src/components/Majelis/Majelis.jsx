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
import styles from "./Majelis.module.css";
import { IconHomeFilled, IconCircle } from "@tabler/icons-react";
import logo from "../../assets/imgs/MT-logo.svg";
import bookcover from "../../assets/imgs/majelis/book.png";
import { motion } from "framer-motion";
import Whatsapp from "../Whatsapp/Whatsapp"

// Fade-in variant from bottom
const fadeInVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const Majelis = () => {
  const programCards = [
    { title: "Mengamalkan sunnah bertadarus al-Qur’an" },
    { title: "Mengamalkan nilai al-Qur’an dalam keseharian." },
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

        <h2 className={styles.title}>MAJELIS TADARUS 5T</h2>
        <Text className={styles.textContent} mt={50} p={6}>
          Pembelajaran Tadarus al-Qur’an metode 5T untuk para santri atau
          masyarakat umum.
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
                  <Text size="lg" align="center">
                    {card.title}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Accordion Tujuan Khusus */}
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
          <Text
            className={styles.subtitle}
            mt="md"
            style={{ fontSize: "1.1rem" }}
          >
            Mampu menghayati dan menikmati al-Qur’an secara mandiri.
          </Text>
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
                <Text fw={800}>Kurikulum</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ol>
                  <li>Ad-Dhuha s/d an-Nas.</li>
                  <li>Al-lail s/d an-Naba.</li>
                  <li>Al-Mulk s/d al-Mursalat.</li>
                  <li>Al-Mujadilah s/d at-Tahrim.</li>
                  <li>Qaf s/d al-Hadid.</li>
                  <li>Ayat-ayat atau surat-surat pilihan.</li>
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
                  <li>30 sampai 60 menit per pertemuan</li>
                </ul>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="peserta">
              <Accordion.Control>
                <Text fw={800}>Target Peserta</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ol>
                  <li>Pelajar.</li>
                  <li>Masyarakat umum.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </motion.div>

        {/* Book Section */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <Box className={styles.facilitiesSection} mt={40} mb={40}>
            <Box className={styles.bookWrapper}>
              <Text fw={900} className={styles.facilitiesHeaderTitle}>
                Modul
              </Text>
              <Image
                src={bookcover}
                alt="Modul Book Cover"
                className={styles.bookImage}
              />
              <Box className={styles.bookTexts}>
                <Text className={styles.bookText}>Kitab Tadarus Mubtadi</Text>
                <Text className={styles.bookText}>
                  Kitab Pendidikan Qur’ani Anak
                </Text>
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Accordion Pola Pelatihan */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
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
            <Accordion.Item value="pelatihan">
              <Accordion.Control>
                <Text fw={800}>Pola Pelatihan</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ol>
                  <li>Tanya jawab antara pemateri dan peserta.</li>
                  <li>Diskusi interaktif sesama peserta.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="syarat">
              <Accordion.Control>
                <Text fw={800}>Syarat Peserta</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ol>
                  <li>Ikhwan dan Akhwat.</li>
                  <li>Berkomitmen dalam belajar.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="jumlah">
              <Accordion.Control>
                <Text fw={800}>Jumlah Peserta</Text>
              </Accordion.Control>
              <Accordion.Panel ml={20}>
                <ul
                  style={{
                    listStyleType: "none",
                    paddingLeft: 0,
                    marginLeft: 0,
                  }}
                >
                  <li>5-10 Orang per halaqah</li>
                </ul>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
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
              Intensitas Pembelajaran
            </Text>
            <List spacing="sm" mt="md">
              <List.Item
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{ fontWeight: "650", color: "#0a3867" }}
              >
                Minimal 1 ayat per pekan.
              </List.Item>
            </List>
          </Box>
        </motion.div>

        <Whatsapp message="test new massage"/>
      </Container>
    </div>
  );
};

export default Majelis;
