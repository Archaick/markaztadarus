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
import { IconCheckbox } from "@tabler/icons-react";
import styles from "./DS.module.css";
import logo from "../../../assets/imgs/MT-logo-white.svg";
import { IconHomeFilled, IconCircle } from "@tabler/icons-react";

import DailyActivitiesAccordion from "./DailyActivitiesAccordion";
import Whatsapp from "../../../components/Whatsapp/Whatsapp";
// facilities
import food from "../../../assets/imgs/facilities/food.png";
import learn from "../../../assets/imgs/facilities/learn.png";
import prov from "../../../assets/imgs/facilities/prov.png";
import room from "../../../assets/imgs/facilities/room.png";
import ticket from "../../../assets/imgs/facilities/ticket.png";
import tour from "../../../assets/imgs/facilities/tour.png";
import transport from "../../../assets/imgs/facilities/transport.png";
import visa from "../../../assets/imgs/facilities/visa.png";
import visits from "../../../assets/imgs/facilities/visits.png";
import friend from "../../../assets/imgs/facilities/friend.png";
import certificate from "../../../assets/imgs/facilities/certificate.png";
import time from "../../../assets/imgs/facilities/time.png";
import language from "../../../assets/imgs/facilities/language.png";
import learning from "../../../assets/imgs/facilities/learning.png";
import { Helmet } from "react-helmet-async";

const DS = () => {
  const facilities = [
    { text: "Pembekalan sebelum keberangkatan.", icon: prov },
    { text: "Tiket Pesawat PP.", icon: ticket },
    { text: "Visa dan Bis selama di Saudi.", icon: visa },
    { text: "Tour Leader.", icon: tour },
    { text: "Transportasi Jedah-Mekah-Madinah.", icon: transport },
    { text: "Tempat tinggal Mekah & Madinah.", icon: room },
    { text: "Konsumsi 3x sehari", icon: food },
    {
      text: "Kunjungan ke tempat bersejarah di Mekah maupun Madinah.",
      icon: visits,
    },
    { text: "Modul Pembelajaran.", icon: learn },
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

  // table
  const activitiesData = [
    {
      time: "05:00",
      activity: "Shalat Subuh",
      location: "Masjidil Haram",
    },
    {
      time: "09.00",
      activity: "Tadarus Dhuha",
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
      activity: "Pendalaman al-Qur’an",
      location: "Ruang kelas hotel",
    },
    {
      time: "17.00",
      activity: "Shalat Maghrib",
      location: "Masjidil Haram",
    },
    {
      time: "18.30",
      activity: "I’tikaf dan tilawah al-Qur’an",
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
      <Helmet>
        <title>Tadarus Santri</title>
        <meta
          name="description"
          content="Program Umrah & Kursus Pelajar dirancang khusus untuk pelajar, menggabungkan ibadah Umrah dengan pembelajaran interaktif di Mekah & Madinah."
        />
        <link rel="canonical" href="https://markaztadarus.com/ds" />
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
        <h2 className={styles.title}>TADARUS SANTRI</h2>
        <Text className={styles.subtitle}>GAMBARAN SINGKAT PROGRAM</Text>
        <Text className={styles.textContent} mt={50} p={6} fw={550}>
          Program Tadarus Santri ialah program pembelajaran singkat yang
          dirancang khusus untuk memperdalam pemahaman, penghayatan dan
          pengamalan al-Qur’an yang dilaksanakan di kota Mekah al-Mukarramah,
          sekaligus melaksanakan ibadah umrah dan kunjungan tempat-tempat
          bersejarah dan berbudaya Arab.
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

      {/* Tujuan Program  */}
      <Container className={styles.contentWrapper}>
        <Text
          className={styles.subtitle}
          style={{ marginTop: "2rem", fontSize: "1.7rem", textAlign: "center" }}
          mt={70}
        >
          TUJUAN PROGRAM
        </Text>

        <Box
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <List
            type="ordered"
            size="lg"
            spacing="sm"
            styles={{
              root: {
                backgroundColor: "#F7F7F7",
                color: "#000",
                fontSize: "clamp(1rem, 2vw, 1.1rem)",
                fontWeight: 500,
                padding: "2rem",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                width: "100%",
                maxWidth: "800px",
              },
              item: {
                marginBottom: "0.5rem",
                "&::marker": {
                  fontWeight: "bold",
                },
              },
              itemWrapper: {
                textAlign: "left",
                paddingLeft: "1rem",
              },
            }}
          >
            <List.Item>
              Memahami tujuan utama dari mempelajari al-Qur'an.
            </List.Item>
            <List.Item>Memahami secara sempurna arti kata "Tadarus".</List.Item>
            <List.Item>Memahami Tadarus Nabi dan Sahabat.</List.Item>
            <List.Item>Mampu menerapkan metode 5T dalam bertadarus.</List.Item>
            <List.Item>Mengamalkan sunnah bertadarus al-Qur'an.</List.Item>
            <List.Item>Menyatukan hati dengan al-Qur'an.</List.Item>
            <List.Item>Mengamalkan nilai al-Qur'an dalam keseharian.</List.Item>
            <List.Item>
              Mampu menghayati dan menikmati al-Qur'an secara mandiri.
            </List.Item>
          </List>
        </Box>

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
              "Pelaksanaan program terletak di kota suci Mekah.",
              "Program tambahan berupa mengenal napak tilas jejak Nabi di sekitar Masjidil Haram.",
              "Melaksanakan ibadah Umrah.",
              "Mendapatkan nasehat Qur’aniyyah dari salah satu syeikh di Mekah.",
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
              color: "#3E2E0D", // Dark blue text color
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
              <Text fw={600}>Kelas al-Qur’an</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <ol style={{ color: "#152D46" }}>
                <li>Mentadarusi al-Qur’an menggunakan metode 5T.</li>
              </ol>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="madinah">
            <Accordion.Control>
              <Text fw={600}>Pendalaman al-Qur’an</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <Text fw={700} p={10} c="#152D46">
                Dalam rangka memaksimalkan interaksi dengan al-Qur’an dilakukan
                kegiatan berikut:
              </Text>
              <ol style={{ color: "#152D46" }}>
                <li>
                  Membahas ayat-ayat yang berkaitan dengan suasana di mana kita
                  berada.
                </li>
                <li>Tahfiz dan Khatmul Qur’an.</li>
                <li>Mempresentasikan ayat.</li>
                <li>Membuat kartu Tadarus.</li>
                <li>Menyaksikan film-film sejarah Islam.</li>
                <li>Games Tadarus.</li>
                <li>Ayat menyentuh hatiku.</li>
                <li>Pemetaan ayat.</li>
              </ol>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="mekah">
            <Accordion.Control>
              <Text fw={600}>Kegiatan Outdoor</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <ol style={{ color: "#152D46" }}>
                <li>Thawaf sunnah dan Qiyamullail.</li>
                <li>Mengenal jejak Nabi sekitar Masjidil Haram.</li>
                <li>Kegiatan di Goa Hira.</li>
                <li>Menginap di Villa Mekah.</li>
                <li>Olahraga futsal atau lainnya.</li>
                <li>Kunjungan ke padang pasir atau museum.</li>
                <li>Kunjungan kota Madinah.</li>
                <li>Kunjungan ke lembaga pendidikan di Mekah atau Madinah.</li>
              </ol>
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
              "Siswa siswi SMP kelas 8 dan 9.",
              "Sehat jasamani dan rohani.",
              "Izin orangtua atau wali.",
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

        {/* Syarat Dokumen */}
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
            SYARAT DOKUMEN
          </Text>

          {/* List */}
          <List spacing="sm" mt="md">
            {[
              "Rekomendasi Lembaga.",
              "Paspor.",
              "Kartu Keluarga / KTP.",
              "CV.",
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

        {/* SYARAT PERJALANAN */}
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
            SYARAT PERJALANAN
          </Text>

          {/* List */}
          <List spacing="sm" mt="md">
            {[
              "Menyiapkan pasport pribadi.",
              "Mengurus vaksin meningitis pribadi.",
              "Menyiapkan ihram pribadi.",
              "Menyiapkan koper pribadi.",
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

        {/* SYARAT PENDAFTARAN */}
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
            SYARAT PERJALANAN
          </Text>

          {/* List */}
          <List spacing="sm" mt="md">
            {[
              "Pendaftaran dilakukan 90 hari sebelum keberangkatan dengan memberikan data peserta secara lengkap, yaitu tanggal 1 Juli 2025.",
              "Pembayaran dilakukan dalam 2 tahap: 50% untuk 90 hari sebelum keberangkatan dan sisanya paling lambat 30 hari sebelum keberangkatan.",
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
