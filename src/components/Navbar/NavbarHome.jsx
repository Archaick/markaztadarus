import { useState, useEffect } from "react";
import { Group, Burger, Drawer, ActionIcon, Menu, rem } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconX, IconLanguage, IconChevronDown } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Navbar.module.css";
import logo from "../../assets/imgs/MT-logo.svg";
import whiteLogo from "../../assets/imgs/MT-logo-white.svg";

// Home Page (MAIN PAGE)

export default function NavbarHome() {
  const { t, i18n } = useTranslation();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { id: "home", key: "menu.home" },
    { id: "about", key: "menu.about" },
    { id: "programs", key: "menu.programs" },
    { id: "hidayah", key: "menu.hidayah", special: true },
  ];

  const [timeLeft, setTimeLeft] = useState("");
  const targetDate = new Date("2026-04-20T00:00:00").getTime();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft(t("countdown.expired"));
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [t]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > window.innerHeight);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const languageOptions = [
    { code: "id", label: "ID" },
    { code: "en", label: "EN" },
    { code: "ar", label: "AR" },
  ];

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        <img
          src={scrolled ? whiteLogo : logo}
          alt="Markaz Tadarus"
          className={styles.logoImage}
        />

        <Group spacing="xl" className={styles.navLinks} visibleFrom="sm">
          {navItems.map((item) => {
            const href = item.id === "hidayah" ? "/hidayah" : `#${item.id}`;
            return (
              <a key={item.id} href={href} className={styles.navLink}>
                {t(item.key)}
                {item.special && (
                  <div className={styles.countdownBadge}>
                    <span className={styles.countdownLabel}>{t("countdown.prefix")}</span>
                    <span className={styles.countdownTime}>{timeLeft}</span>
                  </div>
                )}
              </a>
            );
          })}

          <Menu shadow="md" width={120} withinPortal>
            <Menu.Target>
              <button className={styles.languageToggle}>
                <IconLanguage size={18} />
                <span>{i18n.language.toUpperCase()}</span>
                <IconChevronDown size={14} />
              </button>
            </Menu.Target>

            <Menu.Dropdown>
              {languageOptions.map((option) => (
                <Menu.Item
                  key={option.code}
                  onClick={() => changeLanguage(option.code)}
                >
                  {option.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Group>

        <div className={styles.mobileControls}>
          <Menu shadow="md" width={120} withinPortal>
            <Menu.Target>
              <button className={styles.languageToggleMobile}>
                <IconLanguage size={18} />
                <span>{i18n.language.toUpperCase()}</span>
                <IconChevronDown size={14} />
              </button>
            </Menu.Target>

            <Menu.Dropdown>
              {languageOptions.map((option) => (
                <Menu.Item
                  key={option.code}
                  onClick={() => changeLanguage(option.code)}
                >
                  {option.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>

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
            {navItems.map((item) => {
              const href = item.id === "hidayah" ? "/hidayah" : `#${item.id}`;
              return (
                <a
                  key={item.id}
                  href={href}
                  onClick={close}
                  className={styles.navLink}
                >
                  {t(item.key)}
                  {item.special && (
                    <div className={styles.countdownBadgeMobile}>
                      <span className={styles.countdownLabel}>{t("countdown.prefix")}</span>
                      <span className={styles.countdownTime}>{timeLeft}</span>
                    </div>
                  )}
                </a>
              );
            })}
          </nav>
        </Drawer>
      </div>
    </header>
  );
}
