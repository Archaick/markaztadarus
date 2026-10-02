import { Card, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconShieldLock, IconUsersGroup } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "./accessContext";
import { FEATURES } from "./access";
import { AccessGate, AccountBar, FullPageLoader, InternalLayout } from "./InternalUI";
import styles from "./InternalPortal.module.css";

const accessControlLink = {
  key: "access",
  href: "/internal/access",
  icon: IconUsersGroup,
  color: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
};

export default function InternalHub() {
  const { t } = useTranslation("internal/Internal");
  const { loading, user, isSuperAdmin, features } = useAccess();

  if (loading) return <FullPageLoader />;

  const links = [
    ...(isSuperAdmin ? [accessControlLink] : []),
    ...FEATURES.filter((f) => features.includes(f.key)),
  ];

  if (!user || links.length === 0) {
    return (
      <InternalLayout>
        <AccessGate />
      </InternalLayout>
    );
  }

  return (
    <InternalLayout>
      <Card className={styles.card}>
        <AccountBar />

        <Stack gap="sm" mt="lg">
          <div className={styles.iconWrap}>
            <IconShieldLock size={36} />
          </div>
          <Title order={1} className={styles.title}>
            {t("gate.title")}
          </Title>
          <Text className={styles.subtitle}>{links.length === 1 ? t("hub.single") : t("hub.pick")}</Text>
        </Stack>

        <div className={styles.links}>
          {links.map((link) => (
            <a
              href={link.href}
              key={link.key}
              className={`${styles.linkCard} ${link.key === "access" ? styles.linkCardSuper : ""}`}
            >
              <div className={styles.linkMeta}>
                <span className={styles.linkIcon} style={{ background: link.color }}>
                  <link.icon size={19} />
                </span>
                <div>
                  <p className={styles.linkTitle}>{t(`features.${link.key}.title`)}</p>
                  <p className={styles.linkDesc}>{t(`features.${link.key}.description`)}</p>
                </div>
              </div>
              <div className={styles.linkArrow}>
                <IconArrowRight size={18} className={`${styles.arrow} ${styles.flipRtl}`} />
              </div>
            </a>
          ))}
        </div>
      </Card>
    </InternalLayout>
  );
}
