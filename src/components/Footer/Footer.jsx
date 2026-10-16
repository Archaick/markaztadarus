import {
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconBrandYoutube,
  IconMail,
  IconPhone,
} from "@tabler/icons-react";
import { Container } from "@mantine/core";
import { useTranslation } from "react-i18next";
import styles from "./Footer.module.css";
import whiteLogo from "../../assets/imgs/MT-logo.svg";

const WHATSAPP_URL =
  "https://wa.me/6281210010733?text=Assalamu%20Alaikum%20warahmatullah%20wabarakatuh.%20%0A%0Asaya%20ingin%20berkonsultasi";

const SOCIALS = [
  { href: WHATSAPP_URL, icon: IconBrandWhatsapp, label: "WhatsApp" },
  { href: "https://www.instagram.com/markaz_tadarus.id/", icon: IconBrandInstagram, label: "Instagram" },
  { href: "https://www.youtube.com/@markaztadarusindonesia", icon: IconBrandYoutube, label: "YouTube" },
];

const Footer = () => {
  const { t, i18n } = useTranslation("common/Footer");
  const dir = i18n.language.startsWith("ar") ? "rtl" : "ltr";

  const links = [
    { href: "#home", label: t("links.home") },
    { href: "#program", label: t("links.program") },
    { href: "#about", label: t("links.about") },
    { href: "#gallery", label: t("links.gallery") },
  ];

  return (
    <footer className={styles.footer} dir={dir}>
      <Container size="lg" className={styles.inner}>
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <img src={whiteLogo} alt="Markaz Tadarus Indonesia" className={styles.logo} />
            <p className={styles.tagline}>{t("tagline")}</p>
            <p className={styles.label}>{t("follow")}</p>
            <div className={styles.socials}>
              {SOCIALS.map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={styles.social} aria-label={label}>
                  <Icon size={20} stroke={1.7} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <nav aria-label={t("information")}>
            <p className={styles.heading}>{t("information")}</p>
            <ul className={styles.links}>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <p className={styles.heading}>{t("contactUs")}</p>
            <ul className={styles.contact}>
              <li>
                <span className={styles.contactIcon} aria-hidden="true">
                  <IconMail size={17} stroke={1.8} />
                </span>
                <a href="mailto:markaztadarus@gmail.com">markaztadarus@gmail.com</a>
              </li>
              <li>
                <span className={styles.contactIcon} aria-hidden="true">
                  <IconPhone size={17} stroke={1.8} />
                </span>
                <a href="tel:+6281210010733" dir="ltr">
                  0812-1001-0733
                </a>
              </li>
            </ul>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.whatsapp}>
              <IconBrandWhatsapp size={18} /> {t("whatsapp")}
            </a>
          </div>

          {/* Legal registration */}
          <div className={styles.legal}>
            <div className={styles.legalHead}>
              <img src="/ahu-emblem.svg" alt="Kemenkumham" width={60} height={60} className={styles.emblem} />
              <div>
                <p className={styles.legalLabel}>{t("registeredUnder")}</p>
                <p className={styles.legalOrg}>Yayasan Madinatul Hijaz Jakarta</p>
                <p className={styles.legalMinistry}>{t("registrationMinistry")}</p>
              </div>
            </div>
            <p className={styles.legalText}>{t("description")}</p>
            <div className={styles.sk} dir="ltr">
              <span>{t("skLabel")}</span>
              <strong>AHU-0007727.AH.01.04</strong>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>
            © {new Date().getFullYear()} Markaz Tadarus Indonesia. {t("rights")}
          </span>
          <span className={styles.arabic} lang="ar">
            مركز التدارس إندونيسيا
          </span>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
