import { Card, Text, Title, Flex } from "@mantine/core";
import styles from "./ProgramHighlights.module.css";
import { IconMapPin, IconSchool, IconCertificate } from "@tabler/icons-react";

const highlights = [
  { icon: IconMapPin, title: "Lokasi", description: "Berlokasi di Tanah Suci Mekah" },
  { icon: IconSchool, title: "Pengajar", description: "Diajarkan oleh Masyayikh atau Asatidz yang profesional di bidangnya" },
  { icon: IconCertificate, title: "Pembekalan", description: "Dibekali dengan buku materi dan pembekalan intensif sebelum keberangkatan" }
];

export default function ProgramHighlights() {
  return (
    <section className={styles.section}>
      <Title align="center" className={styles.title}>Keunggulan Program Kami</Title>
      <Flex className={styles.grid}>
        {highlights.map(({ icon: Icon, title, description }, index) => (
          <Card key={index} shadow="sm" padding="lg" radius="md" className={styles.card}>
            <div className={styles.icon}>
              <Icon size={48} color="#FFD700" />
            </div>
            <Title order={3} className={styles.cardTitle}>{title}</Title>
            <Text className={styles.description}>{description}</Text>
          </Card>
        ))}
      </Flex>
    </section>
  );
}
