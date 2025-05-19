import React from "react";
import { Card, Text, Title, Container, Box, Image } from "@mantine/core";
import card1 from "../../../assets/imgs/seminar/seminarsec2-1.png";
import card2 from "../../../assets/imgs/pelatihan/pelatihansec2-1.png";
import card3 from "../../../assets/imgs/seminar/seminarsec2-3.png";
import card4 from "../../../assets/imgs/seminar/seminarsec2-4.png";
import card5 from "../../../assets/imgs/pelatihan/pelatihansec2-2.png";
import styles from "./Tujuan.module.css";

const programCards = [
  {
    image: card1,
    title: "Memahami tujuan utama dari mempelajari al-Qur’an.",
    alt: "Tujuan al-Qur’an",
  },
  {
    image: card2,
    title: "Memahami secara sempurna arti kata “Tadarus”.",
    alt: "Makna Tadarus",
  },
  {
    image: card3,
    title: "Memahami definisi 5T serta perbedaan antara Tafsir dan Tadabbur.",
    alt: "Definisi 5T",
  },
  {
    image: card4,
    title: "Mengetahui kunci-kunci tadabbur untuk memetik pelajaran dari ayat.",
    alt: "Kunci Tadabbur",
  },
  {
    image: card5,
    title: "Memahami cara mengamalkan ayat dalam keseharian.",
    alt: "Amalan Ayat",
  },
];

const Tujuan = () => {
  return (
    <Box style={{ backgroundColor: "#0d1b2a", padding: "2rem 0" }}>
      <Container size="lg">
        <Title
          order={2}
          align="center"
          style={{
            color: "white",
            marginBottom: "1.75rem",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          TUJUAN UMUM PROGRAM
        </Title>

        <Box
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          {programCards.map((card, index) => (
            <Card
              key={index}
              className={styles.cardShine}
              shadow="sm"
              padding="md"
              radius="md"
              style={{
                backgroundColor: "#0d1b2a",
                border: "1px solid #ffffff22",
                color: "white",
                width: "min(200px, 100%)",
                height: 230,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                textAlign: "center",
              }}
            >
              <Card.Section>
                <Image
                  src={card.image}
                  alt={card.alt}
                  height={60}
                  width={60}
                  fit="contain"
                  style={{ margin: "1rem auto 0.75rem" }}
                />
              </Card.Section>
              <Text size="sm" style={{ lineHeight: 1.35 }}>
                {card.title}
              </Text>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Tujuan;
