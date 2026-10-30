import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Avatar } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconHome2, IconLogout, IconMenu2, IconShieldCheck, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "./accessContext";
import { changeLanguage, savedLanguage, useLanguageDirection } from "./language";
import styles from "./AppShell.module.css";

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

/**
 * The frame of the bigger internal tools (after Tadarus Build): a navy menu
 * with the account, the tool's pages and the language flags, collapsible on
 * a computer and a drawer on a phone; the page gets the rest of the screen.
 *
 * brand: the tool's name, after "Tadarus"; role: the account's badge;
 * sections: [{ label, items: [{ to, end?, icon, label, count?, active? }] }]
 *   (`active` decides by itself when the item is lit, e.g. for filters in the address);
 * action: something for the top of the menu (a "New …" button);
 * collapseKey: where the folded menu is remembered.
 */
export default function AppShell({ brand, role, sections, action, collapseKey, children }) {
  const { t, i18n } = useTranslation("internal/Internal");
  const { user, signOutUser } = useAccess();
  const [initial] = useState(savedLanguage);
  const language = useLanguageDirection(initial);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(collapseKey) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    try {
      localStorage.setItem(collapseKey, collapsed ? "1" : "0");
    } catch {
      // not remembered, that is all
    }
  }, [collapsed, collapseKey]);

  const rtl = language.startsWith("ar");

  return (
    <div className={`${styles.app} ${collapsed ? styles.collapsed : ""}`} dir={rtl ? "rtl" : "ltr"}>
      <header className={styles.topbar}>
        <button type="button" className={styles.menuButton} onClick={() => setOpen(true)} aria-label={t("shell.open")}>
          <IconMenu2 size={22} />
        </button>
        <span className={styles.topBrand}>
          <img src="/MTIFavicon.png" alt="" /> Tadarus <b>{brand}</b>
        </span>
      </header>

      {open && <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <button type="button" className={styles.closeDrawer} onClick={() => setOpen(false)} aria-label={t("shell.close")}>
          <IconX size={20} />
        </button>
        <a href="/internal" className={styles.brand}>
          <img src="/MTIFavicon.png" alt="" />
          <span className={styles.brandText}>
            Tadarus <b>{brand}</b>
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
                {role && (
                  <span className={styles.roleBadge}>
                    <IconShieldCheck size={13} /> {role}
                  </span>
                )}
              </div>
            </div>
            <span className={styles.accountEmail}>
              <bdi>{user.email}</bdi>
            </span>
            {/* the language, always in sight (the menu below can be long) */}
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
            <button type="button" className={styles.signOut} onClick={signOutUser}>
              <IconLogout size={16} /> <span>{t("signOut")}</span>
            </button>
          </div>
        )}

        {action && <div className={styles.action}>{action}</div>}

        <nav className={styles.nav}>
          {sections.map((section, s) => (
            <div key={s} className={styles.navGroup}>
              {section.label && <span className={styles.navLabel}>{section.label}</span>}
              {section.items.map(({ to, end, icon: Icon, label, count, active }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `${styles.navItem} ${(active ?? isActive) ? styles.navActive : ""}`}
                  title={label}
                >
                  <Icon size={20} stroke={1.7} />
                  <span className={styles.navText}>{label}</span>
                  {count !== undefined && count !== null && <span className={styles.count}>{count}</span>}
                </NavLink>
              ))}
            </div>
          ))}
          <a href="/internal" className={styles.navItem} title={t("shell.portal")}>
            <IconHome2 size={20} stroke={1.7} />
            <span className={styles.navText}>{t("shell.portal")}</span>
          </a>
        </nav>

        <div className={styles.sidebarFoot}>
          <button type="button" className={styles.collapse} onClick={() => setCollapsed((c) => !c)}>
            {collapsed !== rtl ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
            <span>{t("shell.collapse")}</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
