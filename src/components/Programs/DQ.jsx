import React from "react";
import { Button, Text, Container, Paper, SimpleGrid, Group } from "@mantine/core";
import { IconBrandWhatsapp, IconHomeFilled, IconCircleCheck } from "@tabler/icons-react";
import styles from "./DQ.module.css";
import logo from "../../assets/imgs/MT-logo-white.svg";

const DQ = () => {
  const whatsappMessage = `Assalamu'alaikum warahmatullahi wabarakatuh, \n\nSaya ingin konsultasi dengan Anda tentang program Duta Qur'an.`;
  const whatsappUrl = `https://wa.me/6281210010733?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div className={styles.dqPage}>
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
              "Pelaksanaan program terletak di kota suci Mekah.",
              "Kunjungan lembaga-lembaga al-Qur’an di Mekah bersama Akademi an-Naba’.",
              "Mendapatkan sertifikat diakreditasi Akademi an-Naba’.",
              "Kunjungan tempat-tempat bersejarah di Mekah bersama Akademi an-Naba’.",
              "Pelaksanaan minimal satu kali umrah.",
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

        <Button
          component="a"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappButton}
        >
          <IconBrandWhatsapp size={24} style={{ marginRight: "8px" }} />
          Hubungi Kami
        </Button>
      </Container>
    </div>
  );
};

export default DQ;
