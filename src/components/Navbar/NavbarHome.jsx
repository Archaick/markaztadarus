import { useState, useEffect } from "react";
import { Group, Burger, Drawer, ActionIcon, Menu, rem } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconX, IconLanguage, IconChevronDown, IconArrowUpRight } from "@tabler/icons-react";
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
    { id: "news", key: "menu.news", href: "/berita" },
    { id: "global", key: "menu.global", href: "/global", beacon: true },
    { id: "internal", key: "menu.internal", href: "/internal" },
  ];
  // Section links jump within the home page, or back to it from other pages.
  const sectionHref = (id) => (window.location.pathname === "/" ? `#${id}` : `/#${id}`);

  const [timeLeft, setTimeLeft] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const targetDate = new Date("2026-04-20T23:59:59").getTime();

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft(t("countdown.closed"));
        setIsClosed(true);
        return false;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      setIsClosed(false);
      return true;
    };

    updateCountdown();
    const timer = setInterval(() => {
      const active = updateCountdown();
      if (!active) {
        clearInterval(timer);
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
        <a href="/" aria-label="Markaz Tadarus">
          <img
            src={whiteLogo}
            alt="Markaz Tadarus"
            className={styles.logoImage}
          />
        </a>

        <Group spacing="xl" className={styles.navLinks} visibleFrom="md">
          {navItems.map((item) => {
            const isHidayahLink = item.id === "hidayah";
            const href = item.href || (isHidayahLink ? (isClosed ? "#" : "/hidayah") : sectionHref(item.id));
            const linkClass = [styles.navLink, item.highlighted ? styles.highlighted : "", isHidayahLink && isClosed ? styles.disabledLink : ""].filter(Boolean).join(" ");
            return (
              <a
                key={item.id}
                href={href}
                className={linkClass}
                aria-disabled={isHidayahLink && isClosed ? "true" : undefined}
                onClick={isHidayahLink && isClosed ? (e) => e.preventDefault() : undefined}
              >
                {item.beacon && <span className={styles.beacon} aria-hidden="true" />}
                {t(item.key)}
                {item.beacon && <IconArrowUpRight size={15} className={styles.beaconArrow} aria-hidden="true" />}
                {item.id === "hidayah" && (
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
            hiddenFrom="md"
            color="black"
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
              src={whiteLogo}
              alt="Markaz Tadarus"
              className={styles.logoImage}
            />
            <ActionIcon onClick={close} className={styles.closeButton}>
              <IconX stroke={2} />
            </ActionIcon>
          </div>

          <nav className={styles.mobileNav}>
            {navItems.map((item) => {
              const isHidayahLink = item.id === "hidayah";
              const href = item.href || (isHidayahLink ? (isClosed ? "#" : "/hidayah") : sectionHref(item.id));
              const linkClass = [styles.navLink, item.highlighted ? styles.highlighted : "", isHidayahLink && isClosed ? styles.disabledLink : ""].filter(Boolean).join(" ");
              return (
                <a
                  key={item.id}
                  href={href}
                  onClick={(e) => {
                    if (isHidayahLink && isClosed) {
                      e.preventDefault();
                    }
                    close();
                  }}
                  className={linkClass}
                  aria-disabled={isHidayahLink && isClosed ? "true" : undefined}
                >
                  {item.beacon && <span className={styles.beacon} aria-hidden="true" />}
                  {t(item.key)}
                  {item.beacon && <IconArrowUpRight size={15} className={styles.beaconArrow} aria-hidden="true" />}
                  {item.id === "hidayah" && (
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
