import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Avatar, Card, TextInput } from "@mantine/core";
import { IconArrowRight, IconEye, IconHistory, IconSearch, IconShieldLock, IconUsersGroup, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "./accessContext";
import { ADMINS_COLLECTION, FEATURES, normalizeEmail } from "./access";
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
 * ?previewAs=<email>: the super admin sees the portal exactly as that admin
 * does (their dashboards only, no admin tools). Anyone else gets their own.
 */
function usePreview(isSuperAdmin) {
  const email = normalizeEmail(new URLSearchParams(window.location.search).get("previewAs"));
  const [admin, setAdmin] = useState(undefined); // undefined = loading, null = not found
  useEffect(() => {
    if (!isSuperAdmin || !email) return;
    getDoc(doc(db, ADMINS_COLLECTION, email))
      .then((snap) => setAdmin(snap.exists() ? { id: email, ...snap.data() } : null))
      .catch(() => setAdmin(null));
  }, [isSuperAdmin, email]);
  return isSuperAdmin && email ? { email, admin } : null;
}

/**
 * /internal: every dashboard the admin may open, as a grid of tiles that stays
 * compact however many there are. The ones used last come first, and a search
 * appears once there are enough to need it.
 */
export default function InternalHub() {
  const { t } = useTranslation("internal/Internal");
  const access = useAccess();
  const preview = usePreview(access.isSuperAdmin);
  const previewing = !!preview?.admin;
  const loading = access.loading || (preview && preview.admin === undefined);
  const user = access.user;
  const isSuperAdmin = access.isSuperAdmin && !previewing;
  const previewFeatures = previewing ? preview.admin.features : null;
  const features = useMemo(() => previewFeatures || (previewing ? [] : access.features), [previewFeatures, previewing, access.features]);
  const [search, setSearch] = useState("");
  const recent = useMemo(() => (previewing ? [] : readRecent()), [previewing]);

  const tiles = useMemo(() => {
    const allowed = FEATURES.filter((f) => features.includes(f.key));
    const rank = (key) => {
      const i = recent.indexOf(key);
      return i === -1 ? 99 : i;
    };
    return allowed.map((f, i) => ({ ...f, order: i })).sort((a, b) => rank(a.key) - rank(b.key) || a.order - b.order);
  }, [features, recent]);

  if (loading) return <FullPageLoader />;

  const exitHref = "/internal/access";
  const banner = preview && (
    <div className={styles.previewBanner}>
      <IconEye size={18} />
      <span>
        {preview.admin
          ? t("hub.previewing", {
              name: preview.admin.displayName || preview.email,
            })
          : t("hub.previewMissing", { email: preview.email })}
      </span>
      <a href={exitHref} className={styles.previewExit}>
        <IconX size={15} /> {t("hub.exitPreview")}
      </a>
    </div>
  );

  // an admin with nothing ticked sees the "no access" page; so does their preview
  if (!user || (tiles.length === 0 && !isSuperAdmin)) {
    return (
      <InternalLayout>
        {previewing ? (
          <div className={styles.hubStack}>
            {banner}
            <Card className={`${styles.card} ${styles.hubCard}`}>
              <p className={styles.hubEmpty}>{t("hub.previewNone")}</p>
            </Card>
          </div>
        ) : (
          <>
            {banner}
            <AccessGate />
          </>
        )}
      </InternalLayout>
    );
  }

  const q = search.trim().toLowerCase();
  const shown = q ? tiles.filter((f) => `${t(`features.${f.key}.title`)} ${t(`features.${f.key}.description`)}`.toLowerCase().includes(q)) : tiles;

  return (
    <InternalLayout align="top">
      <div className={styles.hubStack}>
        {banner}
        <Card className={`${styles.card} ${styles.hubCard}`}>
          {previewing ? (
            // their account, as their own portal shows it
            <div className={styles.previewAccount}>
              <Avatar src={preview.admin.photoURL || null} radius="xl">
                {(preview.admin.displayName || preview.email).charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <b>{preview.admin.displayName || preview.email}</b>
              {preview.admin.displayName && <span>{preview.email}</span>}
              </div>
            </div>
          ) : (
            <AccountBar />
          )}

          {/* a night-sky banner with the Tadarus Global Earth rising behind the title */}
          <div className={`${styles.hubHead} ${styles.hubBanner}`}>
            <Suspense fallback={null}>
              <HubGlobe />
            </Suspense>
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
                  <a key={tool.key} href={tool.href} className={styles.adminTool} title={t(`features.${tool.key}.description`)} aria-label={t(`features.${tool.key}.title`)}>
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
      </div>
    </InternalLayout>
  );
}
