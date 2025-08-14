import React from "react";
import bokeh from "./Bokeh.module.css";
import styles from "./Majelis.module.css";
import { IconHomeFilled, IconCircleCheck } from "@tabler/icons-react";
import {
  Button,
  Text,
  Container,
  Grid,
  Card,
  Box,
  Title,
  Accordion,
  List,
  ThemeIcon,
} from "@mantine/core";
import logo from "../../assets/imgs/MT-logo.svg";
import Autoplay from "embla-carousel-autoplay";
// import book from "../../assets/imgs/majelis/book.png";
import toddler from "../../assets/imgs/ilmiah/toddlerbook.jpg";
import book from "../../assets/imgs/ilmiah/tadarusbook.jpg";
import Whatsapp from "../Whatsapp/Whatsapp";

const Majelis = () => {
  const autoplay = Autoplay({
    delay: 3000,
    stopOnInteraction: false,
    stopOnMouseEnter: false,
  });

  return (
    <div className={bokeh.page}>
      <div className={bokeh.bg} aria-hidden="true" />

      {/* Modern floating lights */}
      <div className={bokeh.bokeh} aria-hidden="true">
        <div className="light-1"></div>
        <div className="light-2"></div>
      </div>
      {/* Glass card */}
      <div className={styles.glass}>
        <Container className={styles.topWrapper}>
          <div className={styles.header}>
            <img src={logo} alt="MT Logo" className={styles.logo} />
            <Button
              variant="filled"
              size="md"
              component="a"
              href="/"
              className={styles.homeButton}
            >
              <IconHomeFilled size={14} style={{ marginRight: "3px" }} />
              Beranda
            </Button>
          </div>

          <h2 className={styles.title}>MAJELIS TADARUS 5T</h2>
          <Text className={styles.textContent} mt={50} p={6}>
            Pembelajaran Tadarus al-Qur’an metode 5T untuk para santri atau
            masyarakat umum.
          </Text>
        </Container>
      </div>

      <div className={styles.glass}>
        <Container size="lg" py="xl">
          <Title
            order={2}
            ta="center"
            mb="lg"
            style={{ color: "#fff", fontWeight: 700 }}
          >
            Tujuan Umum Program
          </Title>

          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box className={styles.goalBox}>
                Mengamalkan sunnah bertadarus al-Qur’an
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box className={styles.goalBox}>
                Mengamalkan nilai al-Qur’an dalam keseharian.
              </Box>
            </Grid.Col>
          </Grid>
        </Container>
      </div>

      <div className={styles.glass}>
        <Container size="lg" py="xl">
          <Title
            order={2}
            ta="center"
            mb="lg"
            style={{ color: "#fff", fontWeight: 700 }}
          >
            Tujuan Khusus Program
          </Title>

          {/* Two Boxes Side by Side */}
          <Grid
            gutter="lg"
            mb="xl"
            justify="
          center"
          >
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box
                style={{
                  background: "rgba(0, 0, 0, 0.5)",
                  color: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  textAlign: "center",
                  fontWeight: "900",
                  fontSize: "1rem",
                }}
              >
                Mampu menghayati dan menikmati al-Qur’an secara mandiri.
              </Box>
            </Grid.Col>
          </Grid>

          {/* Accordion Below */}
          <Accordion
            variant="separated"
            radius="md"
            styles={{
              item: {
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                border: "none",
              },
              control: { color: "#fff", fontWeight: 800 },
            }}
          >
            <Accordion.Item value="item-1">
              <Accordion.Control>
                <Text fw={800}>Kurikulum</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <ol style={{ textAlign: "left", listStylePosition: "inside" }}>
                  <li>Ad-Dhuha s/d an-Nas.</li>
                  <li>Al-lail s/d an-Naba.</li>
                  <li>Al-Mulk s/d al-Mursalat.</li>
                  <li>Al-Mujadilah s/d at-Tahrim.</li>
                  <li>Qaf s/d al-Hadid.</li>
                  <li>Ayat-ayat atau surat-surat pilihan.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-2">
              <Accordion.Control>
                <Text fw={800}>Durasi Kegiatan</Text>
              </Accordion.Control>
              <Accordion.Panel>
                30 sampai 60 menit per pertemuan.
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-3">
              <Accordion.Control>
                <Text fw={800}>Target Peserta</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <ol style={{ textAlign: "left", listStylePosition: "inside" }}>
                  <li>Pelajar.</li>
                  <li>Masyarakat umum.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Container>
      </div>

      <Card className={styles.glass} p="xl">
        <Title order={2} ta="center" mb="lg" c="white" fw={700}>
          Modul
        </Title>

        <Grid gutter="xl" justify="center">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card p="lg" bg="rgba(0, 0, 0, 0.6)">
              <img
                src={book}
                alt="Kitab Tadarus Mubtadi"
                className={styles.bookImage}
              />
              <Text ta="center" mt="sm" c="white">
                Kitab Tadarus Mubtadi
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card p="lg" bg="rgba(0, 0, 0, 0.6)">
              <img
                src={toddler}
                alt="Kitab Pendidikan Qur'ani Anak"
                className={styles.bookImage}
              />
              <Text ta="center" mt="sm" c="white">
                Kitab Pendidikan Qur'ani Anak
              </Text>
            </Card>
          </Grid.Col>
        </Grid>
      </Card>

      <div className={styles.glass}>
        <Container size="lg" py="xl">
          <Accordion
            variant="separated"
            radius="md"
            styles={{
              item: {
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                border: "none",
              },
              control: { color: "#fff", fontWeight: 600 },
            }}
          >
            <Accordion.Item value="item-1">
              <Accordion.Control>
                <Text fw={800}>Pola Pelatihan</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <ol style={{ textAlign: "left", listStylePosition: "inside" }}>
                  <li>Tanya jawab antara pemateri dan peserta.</li>
                  <li>Diskusi interaktif sesama peserta.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-2">
              <Accordion.Control>
                <Text fw={800}>Syarat Peserta</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <ol style={{ textAlign: "left", listStylePosition: "inside" }}>
                  <li>Ikhwan dan Akhwat.</li>
                  <li>Berkomitmen dalam belajar.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-3">
              <Accordion.Control>
                <Text fw={800}>Jumlah Peserta</Text>
              </Accordion.Control>
              <Accordion.Panel>5-10 Orang per halaqah</Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Container>
      </div>

      {/* Pembiayaan */}
      <div className={styles.glass}>
        <Container size="lg" py="xl">
          <Title
            order={2}
            ta="center"
            mb="lg"
            style={{ color: "#fff", fontWeight: 700 }}
          >
            Intensitas Pembelajaran
          </Title>

          <Box
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              borderRadius: "12px",
              padding: "1.5rem",
              backdropFilter: "blur(10px)",
              color: "#fff",
            }}
          >
            <List
              spacing="md"
              size="md"
              icon={
                <ThemeIcon
                  color="teal"
                  size={24}
                  radius="xl"
                  style={{ backgroundColor: "rgba(78, 204, 163, 0.2)" }}
                >
                  <IconCircleCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>Minimal 1 ayat per pekan.</List.Item>
            </List>
          </Box>
        </Container>
      </div>

      <Whatsapp
        message={
          "Assalamu'alaikum warahmatullah wabarakatuh. \n\n Afwan, Saya ingin bertanya tentang Daurah Santri."
        }
      />
    </div>
  );
};

export default Majelis;
