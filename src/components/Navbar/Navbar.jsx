import { Group, Button, Burger, Drawer, ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconX } from "@tabler/icons-react";
import styles from "./Navbar.module.css";
import logo from "../../assets/imgs/MT-logo.svg";

const navItems = ["Beranda", "Program", "Tentang Kami", "Galeri"];

export default function Navbar() {
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <img src={logo} alt="Markaz Tadarus" className={styles.logoImage} />

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
          <Button className={styles.contactBtn}>Hubungi Kami</Button>
        </Group>

        <Burger
          opened={opened}
          onClick={toggle}
          className={styles.burger}
          hiddenFrom="sm"
          color="white"
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
            <img src={logo} alt="Markaz Tadarus" className={styles.logoImage} />
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
            <Button fullWidth className={styles.contactBtn}>
              Hubungi Kami
            </Button>
          </nav>
        </Drawer>
      </div>
    </header>
  );
}
