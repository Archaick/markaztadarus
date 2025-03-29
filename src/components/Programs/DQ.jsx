import React from "react";
import {
  Button,
  Text,
  Container,
  Paper,
  SimpleGrid,
  Group,
  Box,
  Image,
  List,
} from "@mantine/core";
import { IconHomeFilled, IconCheckbox, IconCircle } from "@tabler/icons-react";
import styles from "./DQ.module.css";
import logo from "../../assets/imgs/MT-logo-white.svg";
import Whatsapp from "../../components/Whatsapp/Whatsapp";

// Facilities import
import food from "../../assets/imgs/facilities/food.png";
import learn from "../../assets/imgs/facilities/learn.png";
import learning from "../../assets/imgs/facilities/learning.png";
import prov from "../../assets/imgs/facilities/prov.png";
import room from "../../assets/imgs/facilities/room.png";
import ticket from "../../assets/imgs/facilities/ticket.png";
import tour from "../../assets/imgs/facilities/tour.png";
import transport from "../../assets/imgs/facilities/transport.png";
import visa from "../../assets/imgs/facilities/visa.png";
import visits from "../../assets/imgs/facilities/visits.png";
import certificate from "../../assets/imgs/facilities/certificate.png";
import DailyActivitiesAccordion from "./DailyActivitiesAccordion";
import { Helmet } from "react-helmet-async";

const DQ = () => {
  const facilities = [
    { text: "Pembekalan sebelum keberangkatan.", icon: prov },
    { text: "Tiket Pesawat PP.", icon: ticket },
    { text: "Visa dan Bis selama di Saudi.", icon: visa },
    { text: "Tour Leader.", icon: tour },
    { text: "Transportasi Jedah-Mekah-Madinah.", icon: transport },
    { text: "Tempat tinggal Mekah & Madinah.", icon: room },
    { text: "Konsumsi 3x sehari selama kegiatan", icon: food },
    { text: "Kunjungan-kunjungan.", icon: visits },
    { text: "Buku paket daurah.", icon: learn },
    {
      text: "Daurah bersama Akademi An-Naba’ al-‘Azhim di Mekah.",
      icon: learning,
    },
    { text: "Sertifikat pelatihan.", icon: certificate },
  ];

  const activitiesData = [
    { hari: "1", kegiatan: "Tiba di Mekah menuju hotel" },
    { hari: "2", kegiatan: "Melaksanakan Umrah" },
    {
      hari: "3",
      kegiatan:
        "Daurah “Majelis Tadarus Metode5T; Teori”. Daurah “Majelis Tadarus Metode 5T; Praktek”.",
    },
    {
      hari: "4",
      kegiatan:
        "Daurah “Hidayatul Qur’an”. Daurah “Tanzil Al-Ayaatlil Waaqi’”.",
    },
    { hari: "5", kegiatan: "Daurah “Keahlian Tadabbur”" },
    { hari: "6", kegiatan: "Daurah “Keahlian Tadabbur" },
    { hari: "7", kegiatan: "Daurah “kitab Tadabbur anak”" },
    { hari: "8", kegiatan: "Acara bebas dan penutupan" },
    { hari: "9", kegiatan: "Menuju Madinah" },
    { hari: "10", kegiatan: "Menuju Madinah" },
    { hari: "11", kegiatan: "Kunjungan-kunjungan" },
    { hari: "12", kegiatan: "Kembali ke Indonesia" },
  ];

  const columns = [
    { header: "Hari", key: "hari" },
    { header: "Kegiatan", key: "kegiatan" },
  ];

  return (
    <div className={styles.dqPage}>
      <Helmet>
        <title>Duta Qur'an</title>
        <meta
          name="description"
          content="Program eksklusif untuk pengajar: tingkatkan keahlian melalui pembelajaran mendalam dan strategi pengajaran dalam pengalaman Umrah di Mekah & Madinah."
        />
        <link rel="canonical" href="https://markaztadarus.com/dq" />
      </Helmet>

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
        <h2 className={styles.title}>DUTA QUR’AN</h2>
        <Text className={styles.subtitle}>GAMBARAN SINGKAT PROGRAM</Text>
        <Text className={styles.textContent} mt={50} p={6} fw={550}>
          Program “Duta Qur’an” ialah mengajak kader-kader pilihan dari kalangan
          ahli Qur’an dan dai yang berasal dari berbagai negara Islam untuk
          mengikuti program pelatihan khusus di Mekah al-Mukarramah selama 7
          hari seputar keahlian tadabbur, memetik nilai-nilai al-Qur’an dan
          mengaitkannya dengan realita kehidupan, juga memahami langkah-langkah
          pelaksanaan majelis tadarus al-Qur’an.
        </Text>

        <div className={styles.videoContainer}>
          <iframe
            className={styles.video}
            src="https://www.youtube.com/embed/mfzh-Y_MMio"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </Container>

      <Container className={styles.contentWrapper}>
        <Text
          className={styles.subtitle}
          style={{ marginTop: "2rem", fontSize: "1.7rem" }}
          mt={70}
        >
          TUJUAN PROGRAM
        </Text>
        <Paper
          shadow="xs"
          p="lg"
          style={{
            backgroundColor: "#F7F7F7",
            color: "#153A5F",
            fontSize: "clamp(1rem, 2vw, 1.2rem)", // Adjusts between 1rem and 1.2rem
            fontWeight: 500,
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          Mencetak duta serta perwakilan Markaz Tadarus Indonesia dan Akademi
          an-Naba’ al-‘Azhim yang mampu mentadabburi atau memetik nilai-nilai
          al-Qur’an dan menerapkannya dalam keseharian.
        </Paper>

        <Text
          style={{
            fontSize: "1.7rem",
            textAlign: "center",
            marginTop: "4rem",
          }}
          className={styles.subtitle}
        >
          KEUNGGULAN PROGRAM
        </Text>
        <Paper
          p="lg"
          style={{
            backgroundColor: "#0A3867",
            borderRadius: "8px",
            marginTop: "1rem",
          }}
        >
          <SimpleGrid cols={2} spacing="lg" className={styles.gridContainer}>
            {[
              "Pelaksanaan program di kota suci Mekah.",
              "Kunjungan lembaga-lembaga al-Qur’an dan tempat bersejarah di Mekah bersama Akademi an-Naba’.",
              "Mendapatkan sertifikat diakreditasi Akademi an-Naba’.",
              "Pelaksanaan umrah minimal satu kali.",
            ].map((item, index) => (
              <Group key={index} spacing="sm" align="center" wrap="nowrap">
                <IconCheckbox size={24} color="#FFD700" />
                <Text
                  style={{
                    color: "#F7F7F7",
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    flex: 1,
                  }}
                >
                  {item}
                </Text>
              </Group>
            ))}
          </SimpleGrid>
        </Paper>

        {/* Facilities */}
        <Box className={styles.facilitiesSection} mt={40} mb={40}>
          <Box className={styles.facilitiesHeader}>
            <Text fw={900} className={styles.facilitiesHeaderTitle}>
              FASILITAS
            </Text>
          </Box>

          {/* Content */}
          <Box className={styles.facilitiesContent}>
            {facilities.map((facility, index) => (
              <Box key={index} className={styles.facilityItem}>
                <Image
                  src={facility.icon}
                  alt={facility.text}
                  className={styles.facilityIcon}
                />
                <Text className={styles.facilitiesText}>{facility.text}</Text>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          style={{
            backgroundColor: "#362C06",
            padding: "2rem",
            borderRadius: "8px",
            maxWidth: "600px",
            margin: "auto",
            color: "white",
          }}
          mt={50}
        >
          {/* Header */}
          <Text fw={900} size="xl" ta="center">
            SYARAT KEIKUTSERTAAN
          </Text>

          {/* List */}
          <List spacing="sm" mt="md">
            {[
              "Ikhwan atau Akhwat.",
              "Memiliki minimal gelar S1 dalam ilmu syar’i.",
              "Memiliki pengaruh dalam dakwah, terutama di bidang al-Quran dan ilmu-ilmunya.",
              "Memiliki lembaga dakwah untuk dapat menerapkan program.",
              "Berumur 25-60 tahun.",
              "Fasih dan aktif berbahasa Arab.",
              "Mahir dan rutin tilawah al-Qur’an.",
              "Mampu menerjemahkan teks Arab ke dalam bahasa Indonesia.",
              "Memiliki aqidah dan pemikiran Islam yang benar (tidak sesat atau liberal).",
              "Tidak pernah mempunyai kasus kepolisian dan berbudi pekerti baik.",
              "Mendapatkan rekomendasi dari lembaga tempat berkhidmah saat ini.",
              "Komitmen hadir dan mengikuti 100% semua pelatihan, baik teori atau praktek.",
            ].map((item, index) => (
              <List.Item
                key={index}
                icon={<IconCircle size={18} color="#FFD700" />}
                style={{
                  fontWeight: "650",
                }}
              >
                {item}
              </List.Item>
            ))}
          </List>
        </Box>

        {/* SYARAT DOKUMEN */}
        <Box
          style={{
            backgroundColor: "#152D46",
            padding: "2rem",
            borderRadius: "8px",
            maxWidth: "600px",
            margin: "auto",
            color: "white",
          }}
          mt={50}
        >
          {/* Header */}
          <Text fw={900} size="xl" ta="center">
            SYARAT DOKUMEN
          </Text>

          {/* List */}
          <List spacing="sm" mt="md">
            {["Rekomendasi Lembaga.", "Paspor.", "KTP.", "CV."].map(
              (item, index) => (
                <List.Item
                  key={index}
                  icon={<IconCircle size={18} color="#FFD700" />}
                  style={{
                    fontWeight: "650",
                  }}
                >
                  {item}
                </List.Item>
              )
            )}
          </List>
        </Box>

        <DailyActivitiesAccordion columns={columns} data={activitiesData} />

        <Whatsapp
          message={
            "Assalamu'alaikum warahmatullah wabarakatuh. \n\nAfwan, Saya ingin bertanya tentang Duta Qur'an."
          }
        />
      </Container>
    </div>
  );
};

export default DQ;
