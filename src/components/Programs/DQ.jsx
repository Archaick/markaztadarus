import React from "react";
import { Button, Text, Container } from "@mantine/core";
import { IconBrandWhatsapp, IconHomeFilled } from "@tabler/icons-react";
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
