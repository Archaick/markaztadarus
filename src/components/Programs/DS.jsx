import { Container, Button, Text } from "@mantine/core";
import React from "react";
import styles from "./DS.module.css";
import logo from "../../assets/imgs/MT-logo-white.svg";
import {
  IconBrandWhatsapp,
  IconHomeFilled,
  IconOctagon,
} from "@tabler/icons-react";

const DS = () => {
  const whatsappMessage = `Assalamu'alaikum warahmatullahi wabarakatuh, \n\nSaya ingin konsultasi dengan Anda tentang program Daurah Santri.`;
  const whatsappUrl = `https://wa.me/6281210010733?text=${encodeURIComponent(
    whatsappMessage
  )}`;

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
        <Text className={styles.textContent} mt={50} p={6}>
          Placeholder
        </Text>
      </Container>

      <Container className={styles.contentWrapper}>
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
