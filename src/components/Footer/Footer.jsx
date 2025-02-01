import React from "react";
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
import styles from "./Footer.module.css";
import whiteLogo from "../../assets/imgs/MT-logo.svg";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          {/* First Column */}
          <div className={styles.column}>
            <Stack spacing="sm">
              <Image src={whiteLogo} alt="Logo" width={100} />
              <Text size="sm" mb={20}>Belajar al-Qur’an dan Bahasa Arab di Mekah</Text>
              <Text size="lg" weight={600} mt="md">
                Hubungi Kami
              </Text>
              <Group spacing="sm">
                <IconMail size={20} />
                <Anchor href="mailto:example@markaztadarus.com" color="white">
                  example@markaztadarus.com
                </Anchor>
              </Group>
              <Group spacing="sm">
                <IconPhoneFilled size={20} />
                <Text>0812-0000-0000</Text>
              </Group>
              <Divider my="sm" color="#ffd700" />
              <Group spacing="sm" style={{ justifyContent: "center" }}>
                <IconBrandWhatsapp size={24} />
                <IconBrandInstagram size={24} />
                <IconBrandYoutube size={24} />
              </Group>
            </Stack>
          </div>

          {/* Second Column */}
          <div className={styles.column}>
            <Stack spacing="sm" className={styles.infoLinks}>
              <Text size="lg" weight={600}>
                Informasi
              </Text>
              <Anchor href="#" className={styles.link}>
                Beranda
              </Anchor>
              <Anchor href="#" className={styles.link}>
                Program
              </Anchor>
              <Anchor href="#" className={styles.link}>
                Tentang Kami
              </Anchor>
              <Anchor href="#" className={styles.link}>
                Galeri
              </Anchor>
            </Stack>
          </div>

          {/* Third Column */}
          <div className={styles.column}>
            <Stack spacing="sm">
              <Text size="lg" weight={600}>
                Find Us
              </Text>
              <Group spacing="sm">
                <IconMapPin size={20} />
                <Text color="#c8c8c8">
                  Jl. Belimbing 1 No.32 2, RT.2/RW.1, Srengseng, Kec. Kembangan,
                  Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11630
                </Text>
              </Group>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1402.3652198947646!2d106.7594086789109!3d-6.199189171554229!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f79c25e4783d%3A0xef2291486674a122!2sMarkaz%20al-Hijaz!5e0!3m2!1sen!2sid!4v1738400069398!5m2!1sen!2sid"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </Stack>
          </div>
        </div>

        {/* Subfooter */}
        <Divider my="md" color="#ffd700" mt={50} />
        <Text className={styles.subfooter}>
          © 2025 Markaz Tadarus. All rights reserved
        </Text>
      </Container>
    </footer>
  );
};

export default Footer;
