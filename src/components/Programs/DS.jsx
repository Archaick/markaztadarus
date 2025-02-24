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
} from "@mantine/core";
import React from "react";
import { IconCircleCheck } from "@tabler/icons-react";
import styles from "./DS.module.css";
import logo from "../../assets/imgs/MT-logo-white.svg";
import {
  IconBrandWhatsapp,
  IconHomeFilled,
  IconOctagon,
} from "@tabler/icons-react";

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

const DS = () => {
  const whatsappMessage = `Assalamu'alaikum warahmatullahi wabarakatuh, \n\nSaya ingin konsultasi dengan Anda tentang program Daurah Santri.`;
  const whatsappUrl = `https://wa.me/6281210010733?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const facilities = [
    { text: "Pembekalan sebelum keberangkatan.", icon: learn },
    { text: "Tiket Pesawat PP.", icon: ticket },
    { text: "Visa dan Bis selama di Saudi.", icon: visa },
    { text: "Tour Leader.", icon: tour },
    { text: "Transportasi Jedah-Mekah-Madinah", icon: transport },
    { text: "Tempat tinggal Mekah selama 8 malam.", icon: room },
    { text: "Tempat tinggal Madinah selama 2 malam.", icon: room },
    { text: "Konsumsi 3x sehari selama kegiatan", icon: food },
    { text: "Kunjungan-kunjungan.", icon: visits },
    { text: "Modul Pembelajaran.", icon: prov },
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
        <h2 className={styles.title}>Daurah Santri</h2>
        <Text className={styles.subtitle}>GAMBARAN SINGKAT PROGRAM</Text>
        <Text className={styles.textContent} mt={50} p={6} fw={550}>
          Program Daurah Santri ialah program pembelajaran singkat yang
          dirancang khusus untuk memperdalam ilmu pengetahuan di kota Mekah
          al-Mukarramah dalam bidang bahasa Arab dan al-Qur’an, sekaligus
          melaksanakan ibadah umrah dan kunjungan tempat-tempat bersejarah dan
          berbudaya Arab.
        </Text>
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
          Menambah pengetahuan bahasa Arab, al-Qur’an dan kebudayaan Arab.
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
              "Pelaksanaan program terletak di kota suci Mekah.",
              "Melaksanakan ibadah umrah dan kunjungan ke Madinah al-Munawwarah.",
              "Mengenal budaya Arab.",
              "Terdapat majelis Tadarus al-Qur’an.",
              "Program mencakup: linguistik, komunikatif, edukatif dan self development.",
              "Berteman dengan santri Arab.",
            ].map((item, index) => (
              <Group key={index} spacing="sm" align="center" wrap="nowrap">
                <IconCircleCheck size={20} color="#BAF6AD" />
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
        >
          <Accordion.Item value="pembekalan">
            <Accordion.Control>
              <Text fw={600}>Kelas al-Qur'an</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <p>Mempelajari al-Qur'an meliputi ilmu tajwid dan tadabur.</p>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="madinah">
            <Accordion.Control>
              <Text fw={600}>Kelas Bahasa Arab</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <p>
                Siswa diajarkan keterampilan bahasa yang mencakup: Istima'
                (mendengar), kalam (berbicara), Qira'ah (membaca) dan Kitabah
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
                Dalam rangka menguatkan dan mendalami bahasa secara langsung di
                lingkungan aslinya dilakukan beberapa kegiatan diantaranya:
              </Text>
              <ol>
                <li>Praktek langsung di pasar dan tempat umum lainnya.</li>
                <li>
                  Praktek bahasa di lingkungan Masjidil Haram dibimbing oleh
                  pengajar langsung.
                </li>
                <li>
                  Ziarah ke lembaga pendidikan seperti sekolah dan kampus.
                </li>
                <li>Praktek di hadiqah (taman umum).</li>
                <li>Tugas meringkas materi dari video maupun rekaman.</li>
                <li>Melaporkan kegiatan sehari-hari secara singkat.</li>
              </ol>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="pasca">
            <Accordion.Control>
              <Text fw={600}>Rihlah</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <p>
                Kunjungan kota Madinah, padang pasir, museum dan tempat
                bersejarah lainnya.
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

        {/* Whatsapp */}
        <Button
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
        </Button>
      </Container>
    </div>
  );
};

export default DS;
