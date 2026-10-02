import { useState } from "react";
import { Avatar, Button, Card, Loader, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconHome2, IconLogout, IconShieldLock } from "@tabler/icons-react";
import { Trans, useTranslation } from "react-i18next";
import { useAccess } from "./accessContext";
import { LANGUAGES, changeLanguage, savedLanguage, useLanguageDirection } from "./language";
import styles from "./InternalPortal.module.css";

const NS = "internal/Internal";

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

// ID · EN · AR pill. `remember` stores the choice for the internal pages;
// public forms switch for the visit only.
export function LanguageSwitcher({ language, remember = true, className = "" }) {
  const { t } = useTranslation(NS);
  return (
    <div className={`${styles.langSwitch} ${className}`} role="group" aria-label={t("language")}>
      {LANGUAGES.map((l) => (
        <button
          type="button"
          key={l.code}
          lang={l.code}
          title={l.name}
          aria-pressed={language.startsWith(l.code)}
          className={language.startsWith(l.code) ? styles.langOn : ""}
          onClick={() => changeLanguage(l.code, { remember })}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function InternalLayout({ children, align = "center" }) {
  const { t } = useTranslation(NS);
  const [initial] = useState(savedLanguage);
  const language = useLanguageDirection(initial);

  return (
    <div className={`${styles.container} ${align === "top" ? styles.containerTop : ""}`}>
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
        <span>{t("home")}</span>
      </a>
      <LanguageSwitcher language={language} className={styles.langCorner} />
      {children}
    </div>
  );
}

export function FullPageLoader() {
  return (
    <InternalLayout>
      <Loader color="white" size="lg" />
    </InternalLayout>
  );
}

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const signInErrorKey = (err) => {
  switch (err?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/network-request-failed":
      return "google.errors.network";
    case "auth/unauthorized-domain":
      return "google.errors.unauthorizedDomain";
    case "auth/operation-not-allowed":
      return "google.errors.notEnabled";
    default:
      return "google.errors.generic";
  }
};

export function GoogleButton() {
  const { t } = useTranslation(NS);
  const { signInWithGoogle } = useAccess();
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState("");

  const handleClick = async () => {
    setErrorKey("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setErrorKey(signInErrorKey(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {errorKey && (
        <div className={styles.errorBox}>
          <IconAlertCircle size={18} />
          <span>{t(errorKey)}</span>
        </div>
      )}
      <button type="button" className={styles.googleButton} onClick={handleClick} disabled={busy}>
        {busy ? <Loader size={18} /> : <GoogleLogo />}
        <span>{busy ? t("google.opening") : t("google.continue")}</span>
      </button>
    </>
  );
}

export function AccountBar() {
  const { t } = useTranslation(NS);
  const { user, isSuperAdmin, signOutUser } = useAccess();
  if (!user) return null;

  return (
    <div className={styles.accountBar}>
      <Avatar src={user.photoURL} alt="" radius="xl" size={36}>
        {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
      </Avatar>
      <div className={styles.accountText}>
        <span className={styles.accountName}>
          {user.displayName || user.email}
          {isSuperAdmin && <span className={styles.superBadge}>{t("superAdmin")}</span>}
        </span>
        <span className={styles.accountEmail}>
          <bdi>{user.email}</bdi>
        </span>
      </div>
      <Button
        variant="subtle"
        color="gray"
        size="compact-sm"
        leftSection={<IconLogout size={15} />}
        onClick={signOutUser}
      >
        {t("signOut")}
      </Button>
    </div>
  );
}

// Shown in place of a dashboard when nobody is signed in, or the signed-in
// account has not been given that dashboard.
export function AccessGate({ title, subtitle, icon: Icon = IconShieldLock, color }) {
  const { t } = useTranslation(NS);
  const { user, email, signOutUser } = useAccess();

  return (
    <Card className={`${styles.card} ${styles.gateCard}`}>
      <div className={styles.iconWrap} style={color ? { background: color } : undefined}>
        <Icon size={34} />
      </div>
      <Title order={1} className={styles.title}>
        {title || t("gate.title")}
      </Title>

      {!user ? (
        <>
          <Text className={styles.subtitle}>{subtitle || t("gate.subtitle")}</Text>
          <div className={styles.gateActions}>
            <GoogleButton />
          </div>
          <Text className={styles.finePrint}>{t("gate.inviteOnly")}</Text>
        </>
      ) : (
        <>
          <div className={styles.noAccess}>
            <IconAlertCircle size={20} />
            <div>
              <p className={styles.noAccessTitle}>{t("gate.noAccessTitle")}</p>
              <p className={styles.noAccessText}>
                {email ? (
                  <Trans t={t} i18nKey="gate.noAccessText" values={{ email }} components={{ b: <strong dir="ltr" /> }} />
                ) : (
                  t("gate.noEmail")
                )}
              </p>
            </div>
          </div>
          <div className={styles.gateActions}>
            <Button variant="default" leftSection={<IconLogout size={16} />} onClick={signOutUser}>
              {t("gate.switchAccount")}
            </Button>
          </div>
        </>
      )}

      <Text className={styles.footerText}>{t("productBy")}</Text>
    </Card>
  );
}
