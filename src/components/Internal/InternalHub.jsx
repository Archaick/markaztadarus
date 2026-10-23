import { Suspense, lazy, useMemo, useState } from "react";
import { Card, TextInput } from "@mantine/core";
import { IconArrowRight, IconHistory, IconSearch, IconShieldLock, IconUsersGroup } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "./accessContext";
import { FEATURES } from "./access";
import { AccessGate, AccountBar, FullPageLoader, InternalLayout } from "./InternalUI";
import styles from "./InternalPortal.module.css";

// the Tadarus Global globe behind the tiles, loaded after the portal itself
const HubGlobe = lazy(() => import("../Global/HubGlobe"));

// the two super-admin tools sit as small buttons in the header, not as tiles
const ADMIN_TOOLS = [
  { key: "access", href: "/internal/access", icon: IconUsersGroup },
  { key: "history", href: "/internal/history", icon: IconHistory },
];

const RECENT_KEY = "mt.hubRecent";
const readRecent = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const remember = (key) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([key, ...readRecent().filter((k) => k !== key)].slice(0, 10)));
  } catch {
    // a private window: the order simply is not remembered
  }
};

/**
 * /internal: every dashboard the admin may open, as a grid of tiles that stays
 * compact however many there are. The ones used last come first, and a search
 * appears once there are enough to need it.
 */
export default function InternalHub() {
  const { t } = useTranslation("internal/Internal");
  const { loading, user, isSuperAdmin, features } = useAccess();
  const [search, setSearch] = useState("");
  const recent = useMemo(readRecent, []);

  const tiles = useMemo(() => {
    const allowed = FEATURES.filter((f) => features.includes(f.key));
    const rank = (key) => {
      const i = recent.indexOf(key);
      return i === -1 ? 99 : i;
    };
    return allowed.map((f, i) => ({ ...f, order: i })).sort((a, b) => rank(a.key) - rank(b.key) || a.order - b.order);
  }, [features, recent]);

  if (loading) return <FullPageLoader />;

  if (!user || (tiles.length === 0 && !isSuperAdmin)) {
    return (
      <InternalLayout>
        <AccessGate />
      </InternalLayout>
    );
  }

  const q = search.trim().toLowerCase();
  const shown = q
    ? tiles.filter((f) => `${t(`features.${f.key}.title`)} ${t(`features.${f.key}.description`)}`.toLowerCase().includes(q))
    : tiles;

  return (
    <InternalLayout align="top">
      <Suspense fallback={null}>
        <HubGlobe />
      </Suspense>
      <Card className={`${styles.card} ${styles.hubCard}`}>
        <AccountBar />

        <div className={styles.hubHead}>
          <div className={styles.hubTitleRow}>
            <span className={styles.hubIcon}>
              <IconShieldLock size={24} />
            </span>
            <div>
              <h1 className={styles.hubTitle}>{t("gate.title")}</h1>
              <p className={styles.hubSub}>{tiles.length === 1 ? t("hub.single") : t("hub.pick")}</p>
            </div>
          </div>
          {isSuperAdmin && (
            <div className={styles.adminTools}>
              {ADMIN_TOOLS.map((tool) => (
                <a key={tool.key} href={tool.href} className={styles.adminTool} title={t(`features.${tool.key}.description`)}>
                  <tool.icon size={17} />
                  <span>{t(`features.${tool.key}.title`)}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {tiles.length > 5 && (
          <TextInput
            className={styles.hubSearch}
            leftSection={<IconSearch size={16} />}
            placeholder={t("hub.search")}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            radius="xl"
          />
        )}

        <div className={styles.tiles}>
          {shown.map((f) => (
            <a key={f.key} href={f.href} className={styles.tile} onClick={() => remember(f.key)}>
              <span className={styles.tileIcon} style={{ background: f.color }}>
                <f.icon size={24} />
              </span>
              <span className={styles.tileText}>
                <span className={styles.tileTitle}>{t(`features.${f.key}.title`)}</span>
                <span className={styles.tileDesc}>{t(`features.${f.key}.description`)}</span>
              </span>
              {recent[0] === f.key && !q && <span className={styles.tileRecent}>{t("hub.recent")}</span>}
              <IconArrowRight size={18} className={`${styles.tileArrow} ${styles.flipRtl}`} />
            </a>
          ))}
          {shown.length === 0 && <p className={styles.hubEmpty}>{t("hub.noMatch")}</p>}
        </div>
      </Card>
    </InternalLayout>
  );
}
