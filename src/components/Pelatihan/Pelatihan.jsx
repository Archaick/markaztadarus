import React from "react";
import bokeh from "./Bokeh.module.css";
import styles from "./Pelatihan.module.css";
import { IconHomeFilled, IconCircleCheck } from "@tabler/icons-react";
import {
  Button,
  Text,
  Container,
  SimpleGrid,
  Grid,
  Paper,
  Box,
  Title,
  Accordion,
  List,
  ThemeIcon,
} from "@mantine/core";
import logo from "../../assets/imgs/MT-logo.svg";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Image } from "@mantine/core";
import pelatihan1 from "../../assets/imgs/homepage/programs/pelatihan.jpg";
import pelatihan2 from "../../assets/imgs/homepage/programs/pelatihan2.jpg";
import pelatihan3 from "../../assets/imgs/homepage/programs/pelatihan3.jpg";
import certificate from "../../assets/imgs/pelatihan/certificate.png";
import Whatsapp from "../Whatsapp/Whatsapp";

const Pelatihan = () => {
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

          <h2 className={styles.title}>PELATIHAN TADARUS 5T</h2>
          <Text className={styles.textContent} mt={50} p={6}>
            Merupakan kegiatan pelatihan untuk para dai dan guru Qur’an yang
            akan dikader menjadi trainer atau pengajar Tadarus metode 5T.
          </Text>
        </Container>
      </div>

      <div className={styles.glass}>
        <Container className={styles.topWrapper}>
          <h2 className={styles.title}>Dokumentasi Pelatihan</h2>

          <Carousel
            withIndicators
            slideSize="100%"
            slideGap="md"
            loop
            align="center"
            plugins={[autoplay]} // enable autoplay
            styles={{
              root: {
                maxWidth: "900px", // prevents full-screen stretching
                margin: "0 auto",
              },
              control: {
                backgroundColor: "rgba(255,255,255,0.25)",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.5)",
                backdropFilter: "blur(5px)",
                transition: "all 0.3s ease",
              },
              indicator: {
                backgroundColor: "rgba(255,255,255,0.6)",
              },
            }}
            breakpoints={[
              { maxWidth: "md", height: 250 },
              { maxWidth: "sm", height: 200 },
            ]}
          >
            {[pelatihan1, pelatihan2, pelatihan3].map((img, idx) => (
              <Carousel.Slide key={idx} className={styles.carouselSlide}>
                <Image
                  src={img}
                  alt={`Pelatihan ${idx + 1}`}
                  radius="md"
                  className={styles.carouselImage}
                />
              </Carousel.Slide>
            ))}
          </Carousel>
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
                Memahami Tadarus Nabi dan Sahabat
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box className={styles.goalBox}>
                Mampu menerapkan metode 5T dalam majelis Tadarus
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
          <Grid gutter="lg" mb="xl">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box
                style={{
                  background: "rgba(0, 0, 0, 0.5)",
                  color: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                }}
              >
                <Text fw={800}>Mencetak trainer Tadarus 5T.</Text>
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box
                style={{
                  background: "rgba(0, 0, 0, 0.5)",
                  color: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                }}
              >
                <Text fw={800}>Mencetak pengajar Tadarus 5T.</Text>
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
              control: { color: "#fff", fontWeight: 600 },
            }}
          >
            <Accordion.Item value="item-1">
              <Accordion.Control><Text fw={800}>Materi Pelatihan</Text></Accordion.Control>
              <Accordion.Panel>
                <ol style={{ textAlign: "left", listStylePosition: "inside" }}>
                  <li>Keagungan al-Qur’an.</li>
                  <li>Landasan metode 5T dari al-Qur’an dan hadis.</li>
                  <li>Tadarus Nabi dan sahabat.</li>
                  <li>Keahlian penerapan metode 5T.</li>
                  <li>Mengenal referensi Tadarus.</li>
                  <li>Pemetaan ayat.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-2">
              <Accordion.Control><Text fw={800}>Durasi Kegiatan</Text></Accordion.Control>
              <Accordion.Panel>
                Kegiatan berlangsung selama 2 hari dengan durasi 6 jam/hari.
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-3">
              <Accordion.Control><Text fw={800}>Target Peserta</Text></Accordion.Control>
              <Accordion.Panel>
                <ol style={{ textAlign: "left", listStylePosition: "inside" }}>
                  <li>Pimpinan lembaga.</li>
                  <li>Dai dan asatidz.</li>
                  <li>Guru al-Qur'an.</li>
                  <li>Praktisi dalam bidang al-Qur’an.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-4">
              <Accordion.Control><Text fw={800}>Pola Pelatihan</Text></Accordion.Control>
              <Accordion.Panel>
                <ol style={{ textAlign: "left", listStylePosition: "inside" }}>
                  <li>
                    Peserta dibagi menjadi beberapa halaqah maksimal 5
                    orang/halaqah.
                  </li>
                  <li>Tanya jawab antara pemateri dan peserta.</li>
                  <li>Diskusi interaktif perhalaqah.</li>
                  <li>Praktek Tadarus perhalaqah.</li>
                  <li>Tadarus online surat al-Fatihah.</li>
                  <li>Tadarus via WhatsApp surat ad-Dhuha.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Container>
      </div>

      {/* Jumla Pserta */}
      <div className={styles.glass}>
        <Container size="lg" py="xl">
          <Title
            order={2}
            ta="center"
            mb="lg"
            style={{ color: "#fff", fontWeight: 700 }}
          >
            Jumlah Peserta
          </Title>

          <Box
            className={styles.goalBox}
            style={{
              textAlign: "center",
              fontSize: "1.1rem",
              color: "#fff",
              fontWeight: 500,
            }}
          >
            Minimal 20 orang dan maksimal 30 orang.
          </Box>
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
            Syarat Peserta
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
              <List.Item>Ikhwan dan akhwat.</List.Item>
              <List.Item>Pendidikan terakhir S1.</List.Item>
              <List.Item>Pengalaman mengajar al-Qur’an.</List.Item>
              <List.Item>Mampu berbahasa Arab (diutamakan).</List.Item>
              <List.Item>Hafal Juz 30 mutqin (diutamakan).</List.Item>
            </List>
          </Box>
        </Container>
      </div>

      {/* Certificate */}
      <div className={styles.glass}>
        <Title
          order={2}
          ta="center"
          mb="lg"
          style={{ color: "#fff", fontWeight: 700 }}
        >
          Fasilitas
        </Title>
        <Box
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            color: "#fff",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "0.9rem",
          }}
        >
          <img
            src={certificate}
            alt="Sertifikat"
            style={{
              maxWidth: "150px",
              height: "auto",
              display: "block",
              margin: "1rem auto",
            }}
          />
          <p style={{ textAlign: "center" }}>
            Mendapatkan e-sertifikat keikutsertaan (PDF).
          </p>
        </Box>
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
            Pembiayaan
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
              <List.Item>
                Perihal yang terkait dengan transportasi, akomodasi dan modul
                pembelajaran dibebankan kepada Pihak Penyelenggara.
              </List.Item>
              <List.Item>
                Markaz Tadarus Indonesia menerima infaq dan shadaqah sebagai
                pendukung dakwah untuk penyebaran Tadarus 5T.
              </List.Item>
              <List.Item>
                Markaz Tadarus Indonesia akan mengirimkan utusan minimal 2 orang
                dan maksimal 3 orang.
              </List.Item>
            </List>
          </Box>
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
            Pembinaan
          </Title>

          <Box
            className={styles.goalBox}
            style={{
              textAlign: "center",
              fontSize: "1.1rem",
              color: "#fff",
              fontWeight: 500,
            }}
          >
            Pembinaan setelah pelatihan dilakukan secara online dengan teknis
            yang disepakati antara Markaz Tadarus Indonesia dan pihak
            penyelenggara sesuai kebutuhan.
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

export default Pelatihan;
