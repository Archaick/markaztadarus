import { useState, useEffect } from "react";
import { Group, Button, Burger, Drawer, ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconX } from "@tabler/icons-react";
import styles from "./Navbar.module.css";
import logo from "../../assets/imgs/MT-logo.svg";
import whiteLogo from "../../assets/imgs/MT-logo-white.svg"; // New white logo for scrolled state

const navItems = ["Beranda", "Program", "Tentang Kami", "Galeri"];

export default function Navbar() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [scrolled, setScrolled] = useState(false);
  const whatsappUrl =
    "https://wa.me/6281210010733?text=Halo,%20saya%20ingin%20konsultasi%20dengan%20Anda.";

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

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
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className={styles.navLink}
            >
              {item}
            </a>
          ))}
          <Button
            className={styles.contactBtn}
            component="a"
            href={whatsappUrl}
            target="_blank" // Open in a new tab
            rel="noopener noreferrer" // Security best practice
          >
            Hubungi Kami
          </Button>
        </Group>

        <Burger
          opened={opened}
          onClick={toggle}
          className={styles.burger}
          hiddenFrom="sm"
          color={scrolled ? "black" : "white"}
        />

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
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={close}
                className={styles.navLink}
              >
                {item}
              </a>
            ))}
            <Button
              fullWidth
              className={styles.contactBtn}
              component="a"
              href={whatsappUrl}
              target="_blank" // Open in a new tab
              rel="noopener noreferrer" // Security best practice
            >
              Hubungi Kami
            </Button>
          </nav>
        </Drawer>
      </div>
    </header>
  );
}
