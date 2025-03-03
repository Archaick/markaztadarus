import {
  Container,
  Button,
  Text,
  Paper,
  Group,
  SimpleGrid,
  Accordion,
  Box,
  Image,
  List,
} from "@mantine/core";
import React, { useState } from "react";
import { IconCheckbox } from "@tabler/icons-react";
import styles from "./DS.module.css";
import logo from "../../assets/imgs/MT-logo-white.svg";
import {
  IconBrandWhatsapp,
  IconHomeFilled,
  IconCircle,
} from "@tabler/icons-react";

import DailyActivitiesAccordion from "./DailyActivitiesAccordion";
import Whatsapp from "../../components/Whatsapp/Whatsapp";
// facilities
import food from "../../assets/imgs/facilities/food.png";
import learn from "../../assets/imgs/facilities/learn.png";
import prov from "../../assets/imgs/facilities/prov.png";
import room from "../../assets/imgs/facilities/room.png";
import ticket from "../../assets/imgs/facilities/ticket.png";
import tour from "../../assets/imgs/facilities/tour.png";
import transport from "../../assets/imgs/facilities/transport.png";
import visa from "../../assets/imgs/facilities/visa.png";
import visits from "../../assets/imgs/facilities/visits.png";
import friend from "../../assets/imgs/facilities/friend.png";
import certificate from "../../assets/imgs/facilities/certificate.png";
import time from "../../assets/imgs/facilities/time.png";
import language from "../../assets/imgs/facilities/language.png";
import learning from "../../assets/imgs/facilities/learning.png";

const DS = () => {
  const facilities = [
    { text: "Pembekalan sebelum keberangkatan.", icon: prov },
    { text: "Tiket Pesawat PP.", icon: ticket },
    { text: "Visa dan Bis selama di Saudi.", icon: visa },
    { text: "Tour Leader.", icon: tour },
    { text: "Transportasi Jedah-Mekah-Madinah.", icon: transport },
    { text: "Tempat tinggal Mekah & Madinah.", icon: room },
    { text: "Konsumsi 3x sehari selama kegiatan.", icon: food },
    {
      text: "Kunjungan ke tempat bersejarah di Mekah maupun Madinah.",
      icon: visits,
    },
    { text: "Modul Pembelajaran.", icon: learn },
    {
      text: "Kegiatan belajar klasikal di hari Ahad sampe Kamis.",
      icon: learning,
    },
    {
      text: "Pendalaman bahasa non klasikal di hari Jum’at dan Sabtu.",
      icon: language,
    },
    {
      text: "Durasi belajar 5 jam terbagi menjadi waktu pagi dan sore.",
      icon: time,
    },
    { text: "Mendapatkan sertifikat.", icon: certificate },
    { text: "Berteman dengan santri Mekah.", icon: friend },
  ];

  const [isOpen, setIsOpen] = useState(false);

  const handleAccordionToggle = () => {
    setIsOpen(!isOpen);
  };
  // table
  const activitiesData = [
    {
      time: "05:00",
      activity: "Shalat Subuh",
      location: "Masjidil Haram",
    },
    {
      time: "06.30",
      activity: "Sarapan dan bersiap",
      location: "Restoran hotel",
    },
    {
      time: "08.30",
      activity: "Bahasa Arab Sesi 1",
      location: "Ruang kelas hotel",
    },
    { time: "09.45", activity: "Istirahat", location: "Ruang kelas hotel" },
    {
      time: "10.00",
      activity: "Bahasa Arab Sesi 2",
      location: "Ruang kelas hotel",
    },
    {
      time: "11.30",
      activity: "Shalat Zuhur, makan siang dan istirahat",
      location: "Masjid Sekitar Hotel",
    },
    { time: "15.00", activity: "Shalat Ashar", location: "Masjid Hotel" },
    {
      time: "16.00",
      activity: "Kelas Tajwid dan Tadabbur",
      location: "Ruang kelas hotel",
    },
    { time: "17.00", activity: "Shalat Maghrib", location: "Masjidil Haram" },
    {
      time: "18.30",
      activity: "I’tikaf dan menghafal al-Qur’an",
      location: "Masjidil Haram",
    },
    { time: "19.30", activity: "Shalat Isya", location: "Masjidil Haram" },
    { time: "20.00", activity: "Makan malam", location: "Restoran hotel" },
    { time: "21.30", activity: "Istirahat", location: "Kamar Hotel" },
  ];

  const columns = [
    { header: "Jam", key: "time" },
    { header: "Kegiatan", key: "activity" },
    { header: "Lokasi", key: "location" },
  ];

  return (
    <div className={styles.dsPage}>
      <Container className={styles.topWrapper}>
        <div className={styles.header}>
          <img src={logo} alt="MT Logo" className={styles.logo} />
          <Button
            variant="filled"
            size="md"
            component="a"
            href="/#program"
            className={styles.homeButton}
          >
            <IconHomeFilled size={14} style={{ marginRight: "3px" }} />
            Beranda
          </Button>
        </div>
        <h2 className={styles.title}>DAURAH SANTRI</h2>
        <Text className={styles.subtitle}>GAMBARAN SINGKAT PROGRAM</Text>
        <Text className={styles.textContent} mt={50} p={6} fw={550}>
          Program Daurah Santri ialah program pembelajaran singkat yang
          dirancang khusus untuk memperdalam ilmu pengetahuan di kota Mekah
          al-Mukarramah dalam bidang bahasa Arab dan al-Qur’an. Peserta akan
          melaksanakan ibadah umrah, dan kunjungan tempat-tempat bersejarah,
          serta merasakan kekayaan budaya Arab.
        </Text>

        <div className={styles.videoContainer}>
          <iframe
            className={styles.video}
            src="https://www.youtube.com/embed/SkS0H-ImbtI"
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
          Mempelajari bahasa Arab dan kebudayaannya, memperbaiki bacaan dan
          hafalan al-Qur’an, serta mentadabburinya.
        </Paper>
        <Paper
          shadow="xs"
          p="lg"
          style={{
            backgroundColor: "#F7F7F7",
            color: "#153A5F",
            fontSize: "clamp(1rem, 2vw, 1.2rem)", // Same as above
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          Peningkatan skill berbahasa Arab: Istima’, Muhadatsah, Qira’ah dan
          Kitabah.
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
              "Bimbingan tadabbur al-Qur’an.",
              "Melaksanakan ibadah umrah dan kunjungan ke Madinah al-Munawwarah.",
              "Program fokus dalam perbaikan linguistik yang komunikatif dan aplikatif.",
              "Mengenal budaya Arab.",
              "Belajar dan berteman dengan penutur asli bahasa Arab.",
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

        {/* Accordion Section */}
        <Text
          className={styles.subtitle}
          style={{ marginTop: "2rem", fontSize: "1.7rem" }}
          mt={70}
        >
          CAKUPAN PROGRAM
        </Text>
        <Accordion
          variant="contained"
          mt={20}
          styles={{
            control: {
              backgroundColor: "#ffffff", // White background for the control
              color: "#0A3867", // Dark blue text color
            },
            item: {
              border: "1px solid #e0e0e0", // Light border for each item
              borderRadius: "8px", // Rounded corners
            },
            content: {
              backgroundColor: "#f7f7f7", // Light gray background for the content
              padding: "1rem", // Padding inside the content
              fontWeight: "500",
            },
          }}
          transitionDuration={1000}
        >
          <Accordion.Item value="pembekalan">
            <Accordion.Control>
              <Text fw={600}>Kelas al-Qur'an</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <p>Mempelajari al-Qur’an meliputi ilmu tajwid dan tadabur.</p>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="madinah">
            <Accordion.Control>
              <Text fw={600}>Kelas Bahasa Arab</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <p>
                Siswa diajarkan keterampilan bahasa yang mencakup: Istima’
                (mendengar), kalam (berbicara), Qira’ah (membaca) dan Kitabah
                (menulis).
              </p>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="mekah">
            <Accordion.Control>
              <Text fw={600}>Pendalaman Bahasa</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <Text fw={650} mb={10}>
                Menguatkan dan mendalami bahasa Arab secara langsung:
              </Text>
              <ol>
                <li>
                  Praktek langsung di tempat umum (Masjid, arena olahraga,
                  taman, sahara, pusat perbelanjaan, dan transportasi umum).
                </li>
                <li>Ziarah ke sekolah dan Universitas.</li>
                <li>Tugas meringkas materi dari video maupun rekaman.</li>
                <li>Mempresentasikan tugas dalam bahasa Arab.</li>
              </ol>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="pasca">
            <Accordion.Control>
              <Text fw={600}>Rihlah</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <p>
                Kunjungan kota Madinah, sahara, museum dan tempat bersejarah
                lainnya.
              </p>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

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

        {/* SYARAT KEIKUTSERTAAN */}
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
              "Siswa siswi kelas 3 SMP dan SMA",
              "Sehat jasamani dan rohani",
              "Izin orangtua atau wali",
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
            {["Rekomendasi Lembaga", "Paspor", "Kartu Keluarga / KTP."].map(
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

        {/* Table */}
        <DailyActivitiesAccordion data={activitiesData} columns={columns} />

        {/* <Button
          component="a"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappButton}
          style={{ marginTop: "2rem" }}
          mt={80}
        >
          <IconBrandWhatsapp size={24} style={{ marginRight: "8px" }} />
          Hubungi Kami
        </Button> */}

        {/* Whatsapp */}
        <Whatsapp
          message={
            "Assalamu'alaikum warahmatullah wabarakatuh. \n\n Afwan, Saya ingin bertanya tentang Daurah Santri."
          }
        />
      </Container>
    </div>
  );
};

export default DS;
