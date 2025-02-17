import React from "react";
import { Button, Text, Container, Card, Image, Grid } from "@mantine/core";
import {
  IconBrandWhatsapp,
  IconHomeFilled,
  IconCheckbox,
} from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";
import styles from "./UT.module.css";
import logo from "../../assets/imgs/MT-logo-white.svg";
// program cards
import kaaba from "../../assets/imgs/cards/kaaba.png";
import hajj from "../../assets/imgs/cards/hajj.png";
import ownership from "../../assets/imgs/cards/ownership.png";
import quran from "../../assets/imgs/cards/quran.png";

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

  const advantages = [
    {
      text: "Mempelajari ayat suci al-Qur’an di tempat turunnya.",
      position: "left",
    },
    {
      text: "Melaksanakan ibadah Umrah.",
      position: "right",
    },
    {
      text: "Mempelajari kunci-kunci mentadabburi al-Qur’an.",
      position: "left",
    },
    {
      text: "Beri’tikaf di Masjidil Haram dan Masjid Nabawi.",
      position: "right",
    },
  ];

  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  return (
    <div className={styles.utPage}>
      <Container className={styles.contentWrapper}>
        <div className={styles.header}>
          <img src={logo} alt="MT Logo" className={styles.logo} />
          <Button
            variant="filled"
            size="md"
            component="a"
            href="/"
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

        {/* Program Cards Section */}
        <Text className={styles.subtitle} style={{ marginTop: "2rem", fontSize: "1.7rem" }} mt={70}>
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

        <Text className={styles.subtitle} style={{ marginTop: "2rem", fontSize: "1.7rem" }} mt={70}>
          KEUNGGULAN PROGRAM
        </Text>
        <div className={styles.advantagesContainer}>
          <Grid gutter="lg">
            {advantages.map((advantage, index) => (
              <Grid.Col key={index} span={isSmallScreen ? 12 : 6}>
                <div className={styles.advantageItem}>
                  <IconCheckbox 
                    size={24}
                    color="white"
                    style={{ marginRight: "4px" }}
                  />
                  <Text size="md" color="white">
                    {advantage.text}
                  </Text>
                </div>
              </Grid.Col>
            ))}
          </Grid>
        </div>

        {/* WhatsApp Button */}
        <Button
          component="a"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappButton}
          style={{ marginTop: "2rem" }}
          mt={200}
        >
          <IconBrandWhatsapp size={24} style={{ marginRight: "8px" }} />
          Hubungi Kami
        </Button>
      </Container>
    </div>
  );
};

export default UT;
