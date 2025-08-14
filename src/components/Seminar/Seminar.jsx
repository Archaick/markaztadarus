import React from "react";
import bokeh from "./Bokeh.module.css";
import styles from "./Seminar.module.css";
import { IconHomeFilled, IconCircleCheck } from "@tabler/icons-react";
import {
  Button,
  Text,
  Container,
  Grid,
  Box,
  Title,
  Accordion,
  List,
  ThemeIcon,
  Stack,
  Group,
} from "@mantine/core";
import logo from "../../assets/imgs/MT-logo.svg";
import Autoplay from "embla-carousel-autoplay";
import certificate from "../../assets/imgs/pelatihan/certificate.png";
import Whatsapp from "../Whatsapp/Whatsapp";

const Seminar = () => {
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

          <h2 className={styles.title}>SEMINAR TADARUS 5T</h2>
          <Text className={styles.textContent} mt={50} p={6}>
            Merupakan kegiatan berupa kuliah umum berisi pengenalan Tadarus
            al-Qur’an Metode 5T yang disampaikan secara interaktif.
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
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <Box className={styles.goalBox}>
                Memahami tujuan utama dari mempelajari al-Qur’an
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Box className={styles.goalBox}>
                Memahami secara sempurna arti kata “Tadarus”
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Box className={styles.goalBox}>
                Memahami definisi 5T serta perbedaan antara Tafsir dan Tadabbur
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <Box className={styles.goalBox}>
                Mengetahui kunci-kunci tadabbur untuk memetik pelajaran dari
                ayat
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 12 }}>
              <Box className={styles.goalBox}>
                Memahami cara mengamalkan ayat dalam keseharian
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
                Seleksi peserta yang akan.
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
                Mengikuti program ToT.
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
              <Accordion.Control>
                <Text fw={800}>Tema Utama</Text>
              </Accordion.Control>
              <Accordion.Panel>Seminar Tadarus 5T</Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-2">
              <Accordion.Control>
                <Text fw={800}>Sub Tema</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <ol style={{ textAlign: "left", listStylePosition: "inside" }}>
                  <li>Tadarus 5T.</li>
                  <li>Kunci-kunci tadabbur.</li>
                  <li>Praktek singkat.</li>
                  <li>Pengenalan Program Duta Qur'an di Mekah.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-3">
              <Accordion.Control>
                <Text fw={800}>Durasi Kegiatan</Text>
              </Accordion.Control>
              <Accordion.Panel>
                Kegiatan berlangsung selama kurang lebih 2-3 jam
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-4">
              <Accordion.Control>
                <Text fw={800}>Target Peserta</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <ol style={{ textAlign: "left", listStylePosition: "inside" }}>
                  <li>Pimpinan lembaga.</li>
                  <li>Dai dan asatidz.</li>
                  <li>Guru al-Qur'an.</li>
                  <li>Praktisi dalam bidang al-Qur’an.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-5">
              <Accordion.Control>
                <Text fw={800}>Gambaran Kegiatan Acara</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <ol style={{ textAlign: "left", listStylePosition: "inside" }}>
                  <li>Sambutan-sambutan.</li>
                  <li>Pengenalan program Duta Qur’an.</li>
                  <li>Materi 1: Tadarus Metode 5T.</li>
                  <li>Istirahat.</li>
                  <li>Kesimpulan dari peserta.</li>
                  <li>Materi 2: Kunci Tadabbur dan Praktek Tadarus 5T.</li>
                  <li>Kesan dan pesan dari peserta.</li>
                  <li>Penutup.</li>
                </ol>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Container>
      </div>

      <div className={styles.glass}>
        <Container size="lg" py="xl">
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box className={styles.requirementBox}>
                <Title order={3} ta="center" mb="md">
                  Syarat Peserta
                </Title>
                <Stack gap="xs">
                  <Group>
                    <ThemeIcon
                      color="teal"
                      size={24}
                      radius="xl"
                      style={{ backgroundColor: "rgba(78, 204, 163, 0.2)" }}
                    >
                      <IconCircleCheck size={16} />
                    </ThemeIcon>
                    <Text>Ikhwan dan akhwat.</Text>
                  </Group>
                  <Group>
                    <ThemeIcon
                      color="teal"
                      size={24}
                      radius="xl"
                      style={{ backgroundColor: "rgba(78, 204, 163, 0.2)" }}
                    >
                      <IconCircleCheck size={16} />
                    </ThemeIcon>
                    <Text>Berumur minimal 20 tahun.</Text>
                  </Group>
                </Stack>
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box className={styles.requirementBox}>
                <Title order={3} ta="center" mb="md">
                  Jumlah Peserta
                </Title>
                <Stack gap="xs">
                  <Group>
                    <ThemeIcon
                      color="teal"
                      size={24}
                      radius="xl"
                      style={{ backgroundColor: "rgba(78, 204, 163, 0.2)" }}
                    >
                      <IconCircleCheck size={16} />
                    </ThemeIcon>
                    <Text>Online: 50 orang.</Text>
                  </Group>
                  <Group>
                    <ThemeIcon
                      color="teal"
                      size={24}
                      radius="xl"
                      style={{ backgroundColor: "rgba(78, 204, 163, 0.2)" }}
                    >
                      <IconCircleCheck size={16} />
                    </ThemeIcon>
                    <Text>Offline: 100 orang.</Text>
                  </Group>
                </Stack>
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
            Pola Pembelajaran:
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
                Peserta dibagi menjadi beberapa halaqah maksimal 10 orang per
                halaqah.
              </List.Item>
              <List.Item>Tanya jawab antara pemateri dan peserta.</List.Item>
              <List.Item>Diskusi interaktif per halaqah.</List.Item>
              <List.Item>Presentasi perwakilan setiap halaqah. .</List.Item>
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
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: "12px",
            padding: "1.5rem",
            backdropFilter: "blur(10px)",
            color: "#fff",
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

export default Seminar;
