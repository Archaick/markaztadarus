import React from "react";
import { Button, Text, Container } from "@mantine/core";
import { IconBrandWhatsapp, IconHomeFilled } from "@tabler/icons-react";
import styles from "./DS.module.css";
import logo from "../../assets/imgs/MT-logo.svg";

const DS = () => {
  const whatsappMessage = `Assalamu'alaikum warahmatullahi wabarakatuh, \n\nSaya ingin konsultasi dengan Anda tentang program Daurah Santri.`;
  const whatsappUrl = `https://wa.me/6281210010733?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div className={styles.dsPage}>
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

        <h1 className={styles.title}>Daurah Santri</h1>
        <Text className={styles.textContent}>
          <p>
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Libero,
            aliquam vitae. Rerum consequuntur inventore quam adipisci a maxime,
            sapiente, nulla tempora omnis quisquam quis labore cum architecto
            vitae praesentium dignissimos!
          </p>
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

export default DS;
