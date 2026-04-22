import { Card, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconShieldLock } from "@tabler/icons-react";
import styles from "./InternalPortal.module.css";

const internalLinks = [
  {
    href: "/cert-admin",
    title: "Certificate Dashboard",
    description: "Login to the certificate admin dashboard.",
  },
  {
    href: "/internal/redirect-manager",
    title: "Redirect Manager",
    description: "Open the internal short-link and redirect manager.",
  },
];

export default function InternalHub() {
  return (
    <div className={styles.container}>
      <div className={styles.backgroundPattern} />

      <Card className={styles.card}>
        <Stack gap="sm">
          <div className={styles.iconWrap}>
            <IconShieldLock size={36} />
          </div>

          <Title order={1} className={styles.title}>
            Internal Access
          </Title>
          <Text className={styles.subtitle}>
            Select an internal system below.
          </Text>
        </Stack>

        <div className={styles.links}>
          {internalLinks.map((link) => (
            <a href={link.href} key={link.href} className={styles.linkCard}>
              <div>
                <p className={styles.linkTitle}>{link.title}</p>
                <p className={styles.linkDesc}>{link.description}</p>
              </div>
              <IconArrowRight size={18} className={styles.arrow} />
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
