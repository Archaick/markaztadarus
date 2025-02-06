import { Card, Text, Title, Flex } from "@mantine/core";
import styles from "./ProgramHighlights.module.css";
import { IconMapPin, IconSchool, IconCertificate } from "@tabler/icons-react";

const highlights = [
  { icon: IconMapPin, title: "Duta Qur'an", description: "" },
  { icon: IconSchool, title: "Daurah Santri", description: "" },
  { icon: IconCertificate, title: "Umrah Tadabburiyah", description: "" }
];
// Init backup before changes
export default function ProgramHighlights() {
  return (
    <section className={styles.section}>
      <Title align="center" className={styles.title}>PROGRAM KAMI</Title>
      {/* <Flex className={styles.grid}>
        {highlights.map(({ icon: Icon, title, description }, index) => (
          <Card key={index} shadow="sm" padding="lg" radius="md" className={styles.card}>
            <div className={styles.icon}>
              <Icon size={48} color="#FFD700" />
            </div>
            <Title order={3} className={styles.cardTitle}>{title}</Title>
            <Text className={styles.description}>{description}</Text>
          </Card>
        ))}
      </Flex> */}
    </section>
  );
}
