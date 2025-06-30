import {
  IconBrandWhatsapp,
  IconBrandInstagram,
  IconBrandYoutube,
  IconMail,
  IconMapPin,
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

const Footer = () => {
  const { t } = useTranslation("common/Footer");
  const whatsappUrl =
    "https://wa.me/6281210010733?text=Assalamu%20Alaikum%20warahmatullah%20wabarakatuh.%20%0A%0Asaya%20ingin%20berkonsultasi";

  return (
    <footer className={styles.footer}>
      <div className={styles.watermark}></div>

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
              <Anchor href="/" className={styles.link}>
                {t("links.home")}
              </Anchor>
            </Stack>
          </div>

          {/* Third Column */}
          <div className={styles.column}>
            <Stack spacing="sm">
              <Text size="lg" weight={600}>
                {t("address")}
              </Text>
              <Group spacing="sm">
                <IconMapPin size={20} />
                <Text color="white">
                  Jl. Belimbing 1 No.32 2, RT.2/RW.1, Srengseng, Kec. Kembangan,
                  Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11630
                </Text>
              </Group>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d247.90546088526807!2d106.75978070333016!3d-6.199249358822371!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xab0a011bc11d515d%3A0x787e75220eaca7e6!2sMarkaz%20Tadarus%20Indonesia!5e0!3m2!1sen!2sid!4v1740981015725!5m2!1sen!2sid"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title="Markaz Tadarus Location"
              ></iframe>
            </Stack>
          </div>
        </div>

        {/* Subfooter */}
        <Divider my="md" color="white" mt={50} size="md" />
        <Text className={styles.subfooter}>
          © 2025 Markaz Tadarus. All rights reserved
        </Text>
      </Container>
    </footer>
  );
};

export default Footer;
