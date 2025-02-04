import React, { useRef } from "react";
import { Card, Text, Grid, Container } from "@mantine/core";
import { IconQuote } from "@tabler/icons-react";
import Rahmat from "../../assets/imgs/leaders/rahmat.png";
import Adnan from "../../assets/imgs/leaders/adnan.png";
import Agus from "../../assets/imgs/leaders/agus.png";
import { motion, useInView } from "framer-motion";
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
    text: "Markaz Tadarus Indonesia berupaya menyebarkan nilai-nilai al-Qur’an seluas-luasnya di seluruh wilayah Indonesia melalui berbagai media, Tujuan tertinggi dari semua ini adalah agar setiap Muslim dapat menghayati al-Qur’an untuk dirinya sendiri dan setiap saat.",
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
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const Leaders = () => {
  return (
    <Container mt={100} mb={100} id="about">
      <Text align="center" size="1.8rem" mt={20} color="#112A42" fw={700} mb={10}>
        Tentang Belajar al-Qur’an dan Bahasa Arab di Mekah
      </Text>
      <Text align="center" size="1.2rem" color="gray" mb={10}>
        Disampaikan oleh Pengurus Markaz Tadarus Indonesia
      </Text>
      <Grid gutter="lg" mt={50}>
        {leaders.map((leader, index) => {
          const ref = useRef(null);
          const isInView = useInView(ref, { once: false, margin: "-100px" });

          return (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
              <motion.div
                ref={ref}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={cardVariants}
              >
                <Card
                  className={styles.card}
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                >
                  <div
                    style={{
                      position: "relative",
                      paddingTop: "30px",
                      marginBottom: "60px",
                    }}
                  >
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
                    color="#ccc"
                    style={{ marginBottom: 10 }}
                  />
                  <Text size="sm" style={{ minHeight: "80px" }}>
                    {leader.text}
                  </Text>
                  <Text weight={900} mt={50}>
                    {leader.name}
                  </Text>
                  <Text size="xs" color="gray">
                    {leader.role}
                  </Text>
                </Card>
              </motion.div>
            </Grid.Col>
          );
        })}
      </Grid>

    </Container>
  );
};

export default Leaders;
