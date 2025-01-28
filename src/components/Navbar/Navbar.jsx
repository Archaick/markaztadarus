import { Group, Button, Burger, Drawer, ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconX } from "@tabler/icons-react"; 
import styles from "./Navbar.module.css";
import logo from "../../assets/imgs/MT-logo.svg";

export default function Navbar() {
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <img src={logo} alt="Markaz Tadarus" className={styles.logoImage} />

        {/* Navigation for Large Screens */}
        <Group spacing="xl" className={styles.navLinks} visibleFrom="sm">
          {["Beranda", "Program", "Tentang Kami", "Galeri"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className={styles.navLink}>
              {item}
            </a>
          ))}
          <Button className={styles.contactBtn}>Hubungi Kami</Button>
        </Group>

        {/* Hamburger Menu */}
        <Burger opened={opened} onClick={toggle} className={styles.burger} hiddenFrom="sm" color="white" />

        {/* Mobile Menu */}
        <Drawer
          opened={opened}
          onClose={close}
          size="md"
          position="top"
          overlayProps={{ opacity: 0.3, blur: 10 }}
          classNames={{ content: styles.mobileMenu }}
          withCloseButton={false} // Remove Mantine default close button
        >
          {/* Custom Header with Logo + Close Button */}
          <div className={styles.drawerHeader}>
            <img src={logo} alt="Markaz Tadarus" className={styles.logoImage} />
            <ActionIcon onClick={close} className={styles.closeButton}>
              <IconX stroke={2} />
            </ActionIcon>
          </div>

          {/* Mobile Navigation */}
          <nav className={styles.mobileNav}>
            {["Beranda", "Program", "Tentang Kami", "Galeri"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={close} className={styles.navLink}>
                {item}
              </a>
            ))}
            <Button fullWidth className={styles.contactBtn}>Hubungi Kami</Button>
          </nav>
        </Drawer>
      </div>
    </header>
  );
}
