import { useState, useEffect } from "react";
import { Group, Burger, Drawer, ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconX, IconLanguage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Navbar.module.css";
import logo from "../../assets/imgs/MT-logo.svg";
import whiteLogo from "../../assets/imgs/MT-logo-white.svg";

export default function NavbarHome() {
  const { t, i18n } = useTranslation();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { id: "home", key: "menu.home" },
    { id: "about", key: "menu.about" },
    { id: "programs", key: "menu.programs" },
  ];

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "id" : "en");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > window.innerHeight);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        <img
          src={scrolled ? whiteLogo : logo}
          alt="Markaz Tadarus"
          className={styles.logoImage}
        />

        <Group spacing="xl" className={styles.navLinks} visibleFrom="sm">
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} className={styles.navLink}>
              {t(item.key)}
            </a>
          ))}

          <button onClick={toggleLanguage} className={styles.languageToggle}>
            <IconLanguage size={18} />
            <span>{t("language")}</span>
          </button>
        </Group>

        <div className={styles.mobileControls}>
          <Burger
            opened={opened}
            onClick={toggle}
            className={styles.burger}
            hiddenFrom="sm"
            color={scrolled ? "black" : "white"}
          />
        </div>

        <Drawer
          opened={opened}
          onClose={close}
          size="md"
          position="top"
          overlayProps={{ opacity: 0.3, blur: 10 }}
          classNames={{ content: styles.mobileMenu }}
          withCloseButton={false}
        >
          <div className={styles.drawerHeader}>
            <img
              src={scrolled ? whiteLogo : logo}
              alt="Markaz Tadarus"
              className={styles.logoImage}
            />
            <ActionIcon onClick={close} className={styles.closeButton}>
              <IconX stroke={2} />
            </ActionIcon>
          </div>

          <nav className={styles.mobileNav}>
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={close}
                className={styles.navLink}
              >
                {t(item.key)}
              </a>
            ))}
            <button
              onClick={() => {
                toggleLanguage();
                close();
              }}
              className={`${styles.languageToggle} ${styles.mobileNavLanguageToggle}`}
            >
              <IconLanguage size={18} />
              <span>
                {i18n.language === "id"
                  ? "Switch to English"
                  : "Ganti ke Bahasa"}
              </span>
            </button>
          </nav>
        </Drawer>
      </div>
    </header>
  );
}
