import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Avatar } from "@mantine/core";
import {
  IconBuildingCommunity,
  IconChevronLeft,
  IconChevronRight,
  IconHome2,
  IconLayoutGrid,
  IconListCheck,
  IconLogout,
  IconMenu2,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { changeLanguage, savedLanguage, useLanguageDirection } from "../Internal/language";
import styles from "./Supervisi.module.css";

export const BASE = "/internal/supervisi";
const NS = "internal/Supervisi";

// Small flags drawn inline, so they look the same on every computer
// (Windows shows no flag emoji).
const FLAGS = {
  ar: (
    <svg viewBox="0 0 30 20" aria-hidden="true">
      <rect width="30" height="20" fill="#006c35" />
      <path d="M7 8.5h16M9 11.5h12" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 14h14" stroke="#fff" strokeWidth="0.9" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 30 20" aria-hidden="true">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" strokeWidth="1.6" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
      <path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3.4" />
    </svg>
  ),
  id: (
    <svg viewBox="0 0 30 20" aria-hidden="true">
      <rect width="30" height="10" fill="#ce1126" />
      <rect y="10" width="30" height="10" fill="#fff" />
    </svg>
  ),
};

const COLLAPSE_KEY = "mt.supervisiMenu";

/**
 * The supervision dashboard's frame, after Tadarus Build: a navy menu with
 * the account, the pages and the language flags; collapsible on a computer,
 * a drawer on a phone.
 */
export default function SupervisiShell({ children }) {
  const { t, i18n } = useTranslation(NS);
  const { user, isSuperAdmin, signOutUser } = useAccess();
  const [initial] = useState(savedLanguage);
  const language = useLanguageDirection(initial);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // not remembered, that is all
    }
  }, [collapsed]);

  const nav = [
    { to: BASE, end: true, icon: IconLayoutGrid, label: t("nav.home") },
    { to: `${BASE}/sekolah`, icon: IconBuildingCommunity, label: t("nav.schools") },
    { to: `${BASE}/instrumen`, icon: IconListCheck, label: t("nav.instruments") },
  ];

  return (
    <div className={`${styles.app} ${collapsed ? styles.collapsed : ""}`} dir={language.startsWith("ar") ? "rtl" : "ltr"}>
      <header className={styles.topbar}>
        <button type="button" className={styles.menuButton} onClick={() => setOpen(true)} aria-label={t("nav.open")}>
          <IconMenu2 size={22} />
        </button>
        <span className={styles.topBrand}>
          <img src="/MTIFavicon.png" alt="" /> Tadarus <b>{t("brand")}</b>
        </span>
      </header>

      {open && <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <button type="button" className={styles.closeDrawer} onClick={() => setOpen(false)} aria-label={t("nav.close")}>
          <IconX size={20} />
        </button>
        <a href="/internal" className={styles.brand}>
          <img src="/MTIFavicon.png" alt="" />
          <span className={styles.brandText}>
            Tadarus <b>{t("brand")}</b>
          </span>
        </a>

        {user && (
          <div className={styles.account}>
            <div className={styles.accountTop}>
              <Avatar src={user.photoURL} alt="" radius="xl" size={44} color="violet" className={styles.avatar}>
                {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
              </Avatar>
              <div className={styles.accountText}>
                <span className={styles.accountName}>{user.displayName || user.email}</span>
                <span className={styles.roleBadge}>
                  <IconShieldCheck size={13} /> {isSuperAdmin ? t("role.super") : t("role.supervisor")}
                </span>
              </div>
            </div>
            <span className={styles.accountEmail}>
              <bdi>{user.email}</bdi>
            </span>
            <button type="button" className={styles.signOut} onClick={signOutUser}>
              <IconLogout size={16} /> <span>{t("signOut")}</span>
            </button>
          </div>
        )}

        <nav className={styles.nav}>
          <span className={styles.navLabel}>{t("nav.overview")}</span>
          {nav.map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ""}`} title={label}>
              <Icon size={20} stroke={1.7} />
              <span>{label}</span>
            </NavLink>
          ))}
          <a href="/internal" className={styles.navItem} title={t("nav.portal")}>
            <IconHome2 size={20} stroke={1.7} />
            <span>{t("nav.portal")}</span>
          </a>
        </nav>

        <div className={styles.sidebarFoot}>
          <div className={styles.flags} role="group" aria-label="Language">
            {["ar", "en", "id"].map((code) => (
              <button
                key={code}
                type="button"
                className={i18n.language.startsWith(code) ? styles.flagOn : ""}
                onClick={() => changeLanguage(code)}
                aria-pressed={i18n.language.startsWith(code)}
                aria-label={{ ar: "العربية", en: "English", id: "Bahasa Indonesia" }[code]}
              >
                {FLAGS[code]}
              </button>
            ))}
          </div>
          <button type="button" className={styles.collapse} onClick={() => setCollapsed((c) => !c)}>
            {collapsed !== language.startsWith("ar") ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
            <span>{t("nav.collapse")}</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
