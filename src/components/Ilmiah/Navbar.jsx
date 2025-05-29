import { useDisclosure } from "@mantine/hooks";
import { Group, Button, Burger, Drawer, ActionIcon } from "@mantine/core";
import { IconX, IconHomeFilled } from "@tabler/icons-react";
import styles from "./NavbarUmrah.module.css";
import logo from "../../assets/imgs/MT-logo-white.svg"; // Use the white logo consistently

export default function Navbar() {
  const [opened, { toggle, close }] = useDisclosure(false);

  const navItems = [
    { name: "Beranda", id: "/", isHome: true },
  ];

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <img
          src={logo}
          alt="Markaz Tadarus"
          className={styles.logoImage}
        />

        <Group spacing="xl" className={styles.navLinks} visibleFrom="sm">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.id.startsWith("/") ? item.id : `#${item.id}`}
              className={`${styles.navLink} ${item.isHome ? styles.homeLink : ""}`}
            >
              {item.isHome && (
                <span className={styles.homeIcon}>
                  <IconHomeFilled size={16} />
                </span>
              )}
              {item.name}
            </a>
          ))}
        </Group>

        <Burger
          opened={opened}
          onClick={toggle}
          className={styles.burger}
          hiddenFrom="sm"
          color="black"
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
              src={logo}
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
                href={item.id.startsWith("/") ? item.id : `#${item.id}`}
                onClick={close}
                className={`${styles.navLink} ${item.isHome ? styles.homeLink : ""}`}
              >
                {item.isHome && (
                  <span className={styles.homeIcon}>
                    <IconHomeFilled size={16} />
                  </span>
                )}
                {item.name}
              </a>
            ))}
          </nav>
        </Drawer>
      </div>
    </header>
  );
}
