import React from "react";
import {
  IconBrandWhatsapp,
  IconBrandInstagram,
  IconBrandYoutube,
  IconMail,
  IconPhoneFilled,
} from "@tabler/icons-react";
import {
  Container,
  Text,
  Group,
  Divider,
  Anchor,
  Image,
  Stack,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import styles from "./Footer.module.css";
import whiteLogo from "../../assets/imgs/MT-logo.svg";
import yayasan from "../../assets/imgs/AHU.png";

const Footer = () => {
  const { t, i18n } = useTranslation("common/Footer");
  const isArabic = i18n.language.startsWith("ar");
  const whatsappUrl =
    "https://wa.me/6281210010733?text=Assalamu%20Alaikum%20warahmatullah%20wabarakatuh.%20%0A%0Asaya%20ingin%20berkonsultasi";

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          {/* First Column */}
          <div className={styles.column}>
            <Stack spacing="sm">
              <Image
                src={whiteLogo}
                alt="Markaz Tadarus Logo"
                width={100}
                className={styles.footerLogo}
              />
              <Text size="sm" mb={20}>
                {t("tagline")}
              </Text>
              <Text size="lg" weight={600} mt="md">
                {t("contactUs")}
              </Text>
              <Group spacing="sm">
                <IconMail size={20} />
                <Anchor
                  href="mailto:markaztadarus@gmail.com"
                  className={styles.email}
                >
                  markaztadarus@gmail.com
                </Anchor>
              </Group>
              <Group spacing="sm">
                <IconPhoneFilled size={20} />
                <Text className={styles.phone}>0812-1001-0733</Text>
              </Group>
              <Divider my="sm" color="white" size="md" />
              <Group spacing="sm" style={{ justifyContent: "center" }}>
                <Anchor
                  className={styles.socialIcon}
                  component="a"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBrandWhatsapp size={30} />
                </Anchor>
                <Anchor
                  href="https://www.instagram.com/markaz_tadarus.id/#"
                  target="_blank"
                  className={styles.socialIcon}
                >
                  <IconBrandInstagram size={30} />
                </Anchor>
                <Anchor
                  href="https://www.youtube.com/@markaztadarusindonesia"
                  target="_blank"
                  className={styles.socialIcon}
                >
                  <IconBrandYoutube size={30} />
                </Anchor>
              </Group>
            </Stack>
          </div>

          {/* Second Column */}
          <div className={styles.column}>
            <Stack spacing="sm" className={styles.infoLinks}>
              <Text size="lg" weight={600}>
                {t("information")}
              </Text>
              <Anchor href="#home" className={styles.link}>
                {t("links.home")}
              </Anchor>
              <Anchor href="#program" className={styles.link}>
                {t("links.program")}
              </Anchor>
              <Anchor href="#about" className={styles.link}>
                {t("links.about")}
              </Anchor>
              <Anchor href="#gallery" className={styles.link}>
                {t("links.gallery")}
              </Anchor>
            </Stack>
          </div>

          {/* Third Column - Legal/Registration */}
          <div className={styles.column}>
            <Stack spacing="sm">
              <Image
                src={yayasan}
                alt="Kemenkumham Registration"
                fit="contain"
                draggable={false}
                className={styles.ahuLogo}
              />

              <Text
                size="sm"
                color="#d4d4d4"
                style={{
                  lineHeight: 1.6,
                  textAlign: isArabic ? "right" : "left",
                  direction: isArabic ? "rtl" : "ltr",
                }}
              >
                {t("description")}
              </Text>

              <div style={{
                borderLeft: '3px solid #b37d08',
                paddingLeft: '12px',
                marginTop: '8px'
              }}>
                <Text size="xs" color="#c8c8c8" style={{ marginBottom: '4px' }}>
                  Registered under
                </Text>
                <Text size="sm" weight={600} color="#ffffff">
                  Yayasan Madinatul Hijaz Jakarta
                </Text>
                <Text size="xs" color="#a8a8a8" style={{ marginTop: '6px', lineHeight: 1.4 }}>
                  Ministry of Law and Human Rights of the Republic of Indonesia
                </Text>
              </div>
            </Stack>
          </div>
        </div>

        {/* Subfooter */}
        <Divider my="md" color="white" mt={50} size="md" />
        <Text className={styles.subfooter}>
          © 2026 Markaz Tadarus. All rights reserved
        </Text>
      </Container>
    </footer>
  );
};

export default Footer;