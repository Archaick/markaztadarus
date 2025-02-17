import React from "react";
import { Button, Text, Container } from "@mantine/core";
import { IconBrandWhatsapp, IconHomeFilled } from "@tabler/icons-react";
import styles from "./UT.module.css";
import logo from "../../assets/imgs/MT-logo-white.svg";

const UT = () => {
  const whatsappMessage = `Assalamu'alaikum warahmatullahi wabarakatuh, \n\nSaya ingin konsultasi dengan Anda tentang program Umrah Tadabburiyah.`;
  const whatsappUrl = `https://wa.me/6281210010733?text=${encodeURIComponent(
    whatsappMessage
  )}`;

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

        <h1 className={styles.title}>Umrah Tadabburiyah</h1>
        <Text className={styles.textContent}>
        “Umrah Tadabburiyah” adalah program Umrah yang disertai pembelajaran tadabbur al-Qur’an di tempat turunnya, yaitu Mekah dan Madinah, disertai program i’tikaf di Masjid  Nabawi dan Masjidil Haram.
        </Text>


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

export default UT;
