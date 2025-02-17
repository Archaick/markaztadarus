import React from "react";
import { Button, Text, Container } from "@mantine/core";
import { IconBrandWhatsapp, IconHomeFilled } from "@tabler/icons-react";
import styles from "./DQ.module.css";
import logo from "../../assets/imgs/MT-logo.svg";

const DQ = () => {
  const whatsappMessage = `Assalamu'alaikum warahmatullahi wabarakatuh, \n\nSaya ingin konsultasi dengan Anda tentang program Duta Qur'an.`;
  const whatsappUrl = `https://wa.me/6281210010733?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div className={styles.dqPage}>
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

        <h1 className={styles.title}>Duta Qur'an</h1>
        <Text className={styles.textContent}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit sit
          quas aliquid quis, non similique, eius, repellendus id perspiciatis
          quae dicta odio. Repellendus non, dolorum atque optio et animi totam!
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

export default DQ;
