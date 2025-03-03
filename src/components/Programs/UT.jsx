import React from "react";
import {
  Button,
  Text,
  Container,
  Card,
  Image,
  Accordion,
  Box,
  List,
  Paper,
  SimpleGrid,
  Group,
} from "@mantine/core";
import {
  IconBrandWhatsapp,
  IconHomeFilled,
  IconOctagon,
  IconCircleCheck
} from "@tabler/icons-react";
import styles from "./UT.module.css";
import logo from "../../assets/imgs/MT-logo-white.svg";
// program cards
import kaaba from "../../assets/imgs/cards/kaaba.png";
import hajj from "../../assets/imgs/cards/hajj.png";
import ownership from "../../assets/imgs/cards/ownership.png";
import quran from "../../assets/imgs/cards/quran.png";
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
import learning from "../../assets/imgs/facilities/learning.png";
import Whatsapp from "../../components/Whatsapp/Whatsapp"
const UT = () => {
  const whatsappMessage = `Assalamu'alaikum warahmatullahi wabarakatuh, \n\nSaya ingin konsultasi dengan Anda tentang program Umrah Tadabburiyah.`;
  const whatsappUrl = `https://wa.me/6281210010733?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const programCards = [
    {
      image: quran,
      title: "Mempelajari keagungan al-Qur’an.",
    },
    {
      image: ownership,
      title: "Mempelajari kunci-kunci mentadabburi al-Qur’an.",
    },
    {
      image: hajj,
      title: "Melaksanakan ibadah Umrah.",
    },
    {
      image: kaaba,
      title: "Beri’tikaf di Masjidil Haram dan Masjid Nabawi.",
    },
  ];

  const facilities = [
    { text: "Pembekalan sebelum keberangkatan.", icon: prov },
    { text: "Tiket Pesawat PP.", icon: ticket },
    { text: "Visa dan Bis selama di Saudi.", icon: visa },
    { text: "Tour Leader.", icon: tour },
    { text: "Transportasi Jedah-Mekah-Madinah.", icon: transport },
    { text: "Tempat tinggal Mekah & Madinah.", icon: room },
    { text: "Konsumsi 3x sehari.", icon: food },
    { text: "Kunjungan-kunjungan.", icon: visits },
    { text: "Modul Pembelajaran.", icon: learn },
    { text: "Kelas Tadarus untuk alumni.", icon: learning },
  ];

  return (
    <div className={styles.utPage}>
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
            <IconHomeFilled
              size={14}
              style={{ marginRight: "3px" }}
              className={styles.icon}
            />
            Beranda
          </Button>
        </div>

        <h2 className={styles.title}>Umrah Tadabburiyah</h2>
        <Text className={styles.subtitle}>GAMBARAN SINGKAT PROGRAM</Text>
        <Text className={styles.textContent} mt={50} p={6}>
          “Umrah Tadabburiyah” adalah program Umrah yang disertai pembelajaran
          tadabbur al-Qur’an di tempat turunnya, yaitu Mekah dan Madinah,
          disertai program i’tikaf di Masjid Nabawi dan Masjidil Haram.
        </Text>
      </Container>

      <Container className={styles.contentWrapper}>
        {/* Program Cards Section */}
        <Text
          className={styles.subtitle}
          style={{ marginTop: "2rem", fontSize: "1.7rem" }}
          mt={70}
        >
          TUJUAN PROGRAM
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
              <Card.Section>
                <Image src={card.image} alt={card.title} fit="cover" />
              </Card.Section>
              <Text size="md" weight={500} align="center" mt="md">
                {card.title}
              </Text>
            </Card>
          ))}
        </div>

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
              "Mempelajari al-Qur’an dari tafsir hingga ke amalnya.",
              "Bimbingan tata cara Umrah semi mandiri.",
              "Bimbingan intensif tadabbur sebelum dan setelah program.",
              "Akan lebih mencintai al-Qur’an sepulangnya dari Umrah.",
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
          transitionDuration={1000}
        >
          <Accordion.Item value="pembekalan">
            <Accordion.Control>
              <Text fw={600}>Pembekalan Pra Keberangkatan</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <ol>
                <li>Kisah Umrah Nabi dan Sahabat</li>
                <li>Keutamaan Mekah dan Madinah</li>
                <li>Kunci-Kunci Tadabbur al-Qur'an</li>
              </ol>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="madinah">
            <Accordion.Control>
              <Text fw={600}>Madinah</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <ol>
                <li>Tadabbur al-Qur'an</li>
                <li>I'tikaf di Masjid Nabawi</li>
                <li>Berjalan kaki ke Masjid Quba</li>
                <li>Kunjungan ke tempat bersejarah</li>
              </ol>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="mekah">
            <Accordion.Control>
              <Text fw={600}>Mekah</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <ol>
                <li>Umrah</li>
                <li>Tadabbur al-Qur'an</li>
                <li>I'tikaf di Masjidil Haram</li>
                <li>Nasehat Qur’aniyah</li>
                <li>Kunjungan ke museum</li>
              </ol>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="pasca">
            <Accordion.Control>
              <Text fw={600}>Pasca Program</Text>
            </Accordion.Control>
            <Accordion.Panel ml={20}>
              <ol>
                <li>Bimbingan tadarus al-Qur’an secara berkala online dan offline</li>
              </ol>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        {/* Facilities Section */}
        <Box className={styles.facilitiesSection} mt={40} mb={40}>
          {/* Header */}
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
            {["Paspor", "KTP"].map((item, index) => (
              <List.Item
                key={index}
                icon={<IconOctagon size={18} color="#FFD700" />}
                style={{
                  fontWeight: "650",
                }}
              >
                {item}
              </List.Item>
            ))}
          </List>
        </Box>

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

        <Whatsapp message={"Assalamu'alaikum warahmatullah wabarakatuh.\n\n Afwan, Saya ingin bertanya tentang Umrah Tadabburiyah."} />
      </Container>
    </div>
  );
};

export default UT;
