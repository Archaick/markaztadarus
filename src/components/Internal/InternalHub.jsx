import { Card, Stack, Text, Title } from "@mantine/core";
import {
  IconArrowRight,
  IconBarcode,
  IconHome2,
  IconLink,
  IconShieldLock,
} from "@tabler/icons-react";
import styles from "./InternalPortal.module.css";

const internalLinks = [
  {
    href: "/cert-admin",
    title: "Certificate Dashboard",
    description: "Login to the certificate admin dashboard.",
    icon: IconBarcode,
    iconClass: styles.certificateIcon,
  },
  {
    href: "/internal/redirect-manager",
    title: "Redirect Manager",
    description: "Open the internal short-link and redirect manager.",
    icon: IconLink,
    iconClass: styles.redirectIcon,
  },
];

const particles = [
  { left: "4%", top: "78%", size: 8, delay: "0s", duration: "16s" },
  { left: "11%", top: "90%", size: 4, delay: "1.8s", duration: "14s" },
  { left: "19%", top: "84%", size: 6, delay: "3.2s", duration: "17s" },
  { left: "27%", top: "88%", size: 5, delay: "0.5s", duration: "15s" },
  { left: "35%", top: "94%", size: 7, delay: "2.6s", duration: "18s" },
  { left: "43%", top: "82%", size: 4, delay: "4.1s", duration: "13s" },
  { left: "52%", top: "89%", size: 8, delay: "1.2s", duration: "20s" },
  { left: "60%", top: "86%", size: 5, delay: "2.2s", duration: "14s" },
  { left: "68%", top: "92%", size: 6, delay: "0.8s", duration: "17s" },
  { left: "75%", top: "84%", size: 4, delay: "3.8s", duration: "12s" },
  { left: "82%", top: "90%", size: 7, delay: "1.6s", duration: "19s" },
  { left: "90%", top: "87%", size: 5, delay: "2.9s", duration: "16s" },
  { left: "96%", top: "93%", size: 6, delay: "4.5s", duration: "18s" },
];

export default function InternalHub() {
  return (
    <div className={styles.container}>
      <div className={styles.backgroundPattern} />
      <div className={styles.particles} aria-hidden="true">
        {particles.map((particle, index) => (
          <span
            key={`particle-${index}`}
            className={styles.particle}
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>
      <a href="/" className={styles.homeButton}>
        <IconHome2 size={16} />
        <span>Home</span>
      </a>

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
              <div className={styles.linkMeta}>
                <span className={`${styles.linkIcon} ${link.iconClass}`}>
                  <link.icon size={19} />
                </span>
                <div>
                  <p className={styles.linkTitle}>{link.title}</p>
                  <p className={styles.linkDesc}>{link.description}</p>
                </div>
              </div>
              <div className={styles.linkArrow}>
                <IconArrowRight size={18} className={styles.arrow} />
              </div>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
