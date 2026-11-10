import { useEffect, useRef, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Menu } from "@mantine/core";
import { IconBrandGoogle, IconDeviceMobileDown, IconLanguage, IconLogout, IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { changeLanguage } from "../Internal/language";
import { normalizeCode } from "../Belajar/belajarSchema";
import { LearnerProvider, useLearner } from "./guruData";
import GuruHome from "./GuruHome";
import SurahPage from "./SurahPage";
import SectionView from "./SectionView";
import { InstallProvider, useInstall } from "./install";
import { IosSteps } from "./InstallCard";
import DawnScene from "./DawnScene";
import styles from "./Guru.module.css";

export const NS = "guru/Guru";
export const GURU = "/guru";

/**
 * /guru: the teachers' side of the learning platform. Sign in with Google,
 * join a class with its code (or by an admin's email invite), then study
 * the surahs the class was given, one section at a time.
 */
export default function GuruApp() {
  const { i18n } = useTranslation(NS);
  return (
    <div className={styles.app} dir={i18n.language.startsWith("ar") ? "rtl" : "ltr"}>
      <div className={styles.backdrop} aria-hidden="true" />
      <InstallProvider>
        <Gate />
      </InstallProvider>
    </div>
  );
}

function Gate() {
  const { loading, user } = useAccess();
  if (loading) return <Splash />;
  if (!user) return <SignIn />;
  return (
    <LearnerProvider>
      <Inside />
    </LearnerProvider>
  );
}

function Inside() {
  const { loading, learner, classes, touch } = useLearner();
  const touched = useRef(false);
  useEffect(() => {
    if (learner && !touched.current) {
      touched.current = true;
      touch();
    }
  }, [learner, touch]);

  if (loading) return <Splash />;
  if (!learner || !classes.length) return <Join first />;
  return (
    <Routes>
      <Route index element={<GuruHome />} />
      <Route path="gabung" element={<Join />} />
      <Route path="surat/:lessonId" element={<SurahPage />} />
      <Route path="bagian/:sectionId" element={<SectionView />} />
      <Route path="*" element={<GuruHome />} />
    </Routes>
  );
}

function Splash() {
  return (
    <div className={styles.center}>
      <img src="/MTIFavicon.png" alt="" className={styles.splashLogo} />
    </div>
  );
}

export function Brand() {
  return (
    <Link to={GURU} className={styles.brand}>
      <img src="/MTIFavicon.png" alt="" />
      <span>
        Tadarus <b>Guru</b>
      </span>
    </Link>
  );
}

/** The bar on top: the brand, and the account menu (join another class, language, sign out). */
export function TopBar() {
  const { t } = useTranslation(NS);
  const { user, signOutUser } = useAccess();
  const { canInstall, ios, install } = useInstall();
  const [steps, setSteps] = useState(false);
  return (
    <header className={styles.topBar}>
      <IosSteps opened={steps} onClose={() => setSteps(false)} />
      <Brand />
      <Menu position="bottom-end" radius="lg" shadow="lg" width={230}>
        <Menu.Target>
          <button type="button" className={styles.avatar} aria-label={t("menu.account")}>
            {user?.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : (user?.displayName || user?.email || "?").charAt(0).toUpperCase()}
          </button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{user?.email}</Menu.Label>
          <Menu.Item component={Link} to={`${GURU}/gabung`} leftSection={<IconPlus size={16} />}>
            {t("menu.join")}
          </Menu.Item>
          {(canInstall || ios) && (
            <Menu.Item leftSection={<IconDeviceMobileDown size={16} />} onClick={() => (canInstall ? install() : setSteps(true))}>
              {t("install.menu")}
            </Menu.Item>
          )}
          <Menu.Label>
            <IconLanguage size={12} /> {t("menu.language")}
          </Menu.Label>
          {[
            ["id", "Bahasa Indonesia"],
            ["en", "English"],
            ["ar", "العربية"],
          ].map(([code, label]) => (
            <Menu.Item key={code} onClick={() => changeLanguage(code)}>
              {label}
            </Menu.Item>
          ))}
          <Menu.Divider />
          <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={signOutUser}>
            {t("menu.signOut")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </header>
  );
}

function SignIn() {
  const { t } = useTranslation(NS);
  const { signInWithGoogle } = useAccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className={styles.dawnStage}>
      <DawnScene />
      <div className={`${styles.glassCard} ${styles.welcome} ${styles.dawnCard}`}>
        <img src="/MTIFavicon.png" alt="" className={styles.welcomeLogo} />
        <span className={styles.eyebrow}>{t("signIn.eyebrow")}</span>
        <h1 className={styles.welcomeTitle}>
          Tadarus <span>Guru</span>
        </h1>
        <p className={styles.welcomeText}>{t("signIn.text")}</p>
        <button
          type="button"
          className={styles.googleButton}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(false);
            try {
              await signInWithGoogle();
            } catch (err) {
              if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") setError(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          <IconBrandGoogle size={20} /> {t("signIn.google")}
        </button>
        {error && <p className={styles.errorText}>{t("signIn.failed")}</p>}
      </div>
    </div>
  );
}

/** Joining a class with the code the admin shared. `first` when it is the only way in. */
function Join({ first = false }) {
  const { t } = useTranslation(NS);
  const { join } = useLearner();
  const { user, signOutUser } = useAccess();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const input = useRef(null);
  const name = (user?.displayName || "").split(" ")[0];

  const submit = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    setBusy(true);
    setResult(null);
    try {
      setResult(await join(code));
    } catch (err) {
      console.error("Joining failed:", err);
      setResult("failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!first && <TopBar />}
      <div className={styles.center}>
        <form className={`${styles.glassCard} ${styles.welcome}`} onSubmit={submit}>
          {first && <img src="/MTIFavicon.png" alt="" className={styles.welcomeLogo} />}
          <span className={styles.eyebrow}>{first ? t("join.hello", { name }) : t("menu.join")}</span>
          <h1 className={styles.joinTitle}>{t("join.title")}</h1>
          <p className={styles.welcomeText}>{t("join.text")}</p>
          <label className={styles.codeBoxes} onClick={() => input.current?.focus()}>
            <input
              ref={input}
              value={code}
              onChange={(e) => setCode(normalizeCode(e.currentTarget.value))}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              aria-label={t("join.code")}
            />
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className={`${styles.codeBox} ${i === code.length ? styles.codeBoxNow : ""} ${code[i] ? styles.codeBoxFull : ""}`}>
                {code[i] || ""}
              </span>
            ))}
          </label>
          {result && result !== "ok" && <p className={result === "already" ? styles.okText : styles.errorText}>{t(`join.${result}`)}</p>}
          {result === "ok" && <p className={styles.okText}>{t("join.ok")}</p>}
          <button type="submit" className={styles.primaryBig} disabled={code.length < 6 || busy}>
            {busy ? "…" : t("join.button")}
          </button>
          {first ? (
            <button type="button" className={styles.linkButton} onClick={signOutUser}>
              {t("join.otherAccount", { email: user?.email })}
            </button>
          ) : (
            <Link to={GURU} className={styles.linkButton}>
              {t("join.back")}
            </Link>
          )}
        </form>
      </div>
    </>
  );
}
