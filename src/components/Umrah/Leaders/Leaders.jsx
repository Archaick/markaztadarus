import React from "react";
import { Card, Text, Grid, Container } from "@mantine/core";
import { IconQuote } from "@tabler/icons-react";
import Rahmat from "../../../assets/imgs/leaders/rahmat.png";
import Adnan from "../../../assets/imgs/leaders/adnan.png";
import Agus from "../../../assets/imgs/leaders/agus.png";
import { motion } from "framer-motion";
import styles from "./Leaders.module.css";

const leaders = [
  {
    name: "DR. Rahmat Hidayat Lubis, Lc., M.A",
    role: "Pembina Markaz Tadarus Indonesia",
    text: "Markaz Tadarus Indonesia berupaya menyebarkan nilai-nilai al-Qur’an seluas-luasnya di seluruh wilayah Indonesia melalui berbagai media, Tujuan tertinggi dari semua ini adalah agar setiap Muslim dapat menghayati al-Qur’an untuk dirinya sendiri dan setiap saat.",
    image: Rahmat,
  },
  {
    name: "Ir. Adnan Afiff",
    role: "Pembina Markaz Tadarus Indonesia",
    text: "Al-Qur'an adalah pedoman hidup umat Islam yang mengandung nilai-nilai moral, sosial, dan etika. Nilai-nilai tersebut dapat diinternalisasikan melalui keluarga dan  pendidikan lainnya. \n\nMarkaz Tadarus Indonesia membangun umat agar hidup bersama al Qur'an dengan mengerti, menghayati dan menjadikan al Quran sebagai aplikasi dalam kehidupan keseharian.",
    image: Adnan,
  },
  {
    name: "Ust. Agus Mujib, Lc., M.A",
    role: "Ketua Markaz Tadarus Indonesia",
    text: "Tidak dipungkiri bahwa Mekah al Mukarramah adalah pusat Islam. Dimulai sejak turunnya wahyu hingga saat ini, maka program ini memiliki keutamaan tersendiri karena kita bisa mendalami al-Qur’an dan Bahasa Arab ditempat yang paling mulia dan melakukan amalan yang agung.",
    image: Agus,
  },
];

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const Leaders = () => {
  return (
    <Container mt={100} mb={100} id="about">
      <Text
        align="center"
        size="1.8rem"
        mt={20}
        color="#112A42"
        fw={700}
        mb={10}
      >
        Tentang Belajar al-Qur’an dan Bahasa Arab di Mekah
      </Text>
      <Text align="center" size="1.2rem" color="gray" mb={10}>
        Disampaikan oleh Pengurus Markaz Tadarus Indonesia
      </Text>
      <Grid gutter="lg" mt={50}>
        {leaders.map((leader, index) => (
          <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ amount: 0.2 }}
              variants={cardVariants}
            >
              <Card
                className={styles.card}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
              >
                <div className={styles.imageWrap}>
                  <img
                    src={leader.image}
                    alt={leader.name}
                    width={100}
                    height={100}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <IconQuote
                  size={40}
                  color="#c8b26c"
                  style={{ marginBottom: 10 }}
                />
                <Text size="sm" style={{ minHeight: "80px", flexGrow: 1 }}>
                  {leader.text}
                </Text>
                <div className={styles.cardFooter}>
                  <Text weight={900} mt={50}>
                    {leader.name}
                  </Text>
                  <Text size="xs" color="gray">
                    {leader.role}
                  </Text>
                </div>
              </Card>
            </motion.div>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
};

export default Leaders;