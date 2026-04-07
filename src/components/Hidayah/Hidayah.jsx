import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IconBook, IconCalendar, IconCertificate, IconCheck, IconChevronRight, IconLanguage, IconChevronDown, IconArrowLeft } from "@tabler/icons-react";
import { Menu } from "@mantine/core";
import styles from "./Hidayah.module.css";
import heroImg from "../../assets/imgs/homepage/programs/diploma.png";

const Hidayah = () => {
  const { t, i18n } = useTranslation("hidayah/Hidayah");

  // Define arrays specifically for rendering correctly since t("key", { returnObjects: true }) can sometimes be tricky
  const books = t("books", { returnObjects: true }) || [];
  const systemItems = t("system_items", { returnObjects: true }) || [];
  const requirementItems = t("requirements_items", { returnObjects: true }) || [];
  const termItems = t("terms_items", { returnObjects: true }) || [];
  const scheduleItems = t("schedule_items", { returnObjects: true }) || [];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const languageOptions = [
    { code: "id", label: "ID" },
    { code: "en", label: "EN" },
    { code: "ar", label: "AR" },
  ];

  return (
    <>
      <header className={styles.simpleHeader} dir={i18n.language === "ar" ? "rtl" : "ltr"}>
        <a href="/" className={styles.backLink}>
          <IconArrowLeft size={18} />
          <span>{t("home", { defaultValue: "Beranda" })}</span>
        </a>

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
      </header>

      <div className={`${styles.pageContainer} ${styles.cleanPage}`} dir={i18n.language === "ar" ? "rtl" : "ltr"}>
        {/* Hero Section */}
        <section className={styles.hero}>
        <div className={styles.heroContent}>
          <img src={heroImg} alt="Hidayah al-Qur'an" className={styles.heroImage} />
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrap}>
          
          <h1 className={styles.mainTitle}>{t("title")}</h1>
          
          <div className={styles.card}>
            <p className={styles.paragraph}>{t("about")}</p>
            
            <p className={styles.paragraphBold}>{t("books_intro")}</p>
            <ul className={styles.listSection}>
              {Array.isArray(books) && books.map((book, idx) => (
                <li key={idx}>
                  <IconBook size={18} className={styles.listIcon} />
                  <span>{book}</span>
                </li>
              ))}
            </ul>
            
            <p className={styles.paragraph}>{t("about_ext")}</p>
          </div>

          <div className={styles.gridSection}>
            {/* System */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>{t("system_title")}</h2>
              <ul className={styles.listSection}>
                {Array.isArray(systemItems) && systemItems.map((item, idx) => (
                  <li key={idx}>
                    <IconChevronRight size={18} className={styles.listIcon} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>{t("requirements_title")}</h2>
              <ul className={styles.listSection}>
                {Array.isArray(requirementItems) && requirementItems.map((item, idx) => (
                  <li key={idx}>
                    <IconCheck size={18} className={styles.listIcon} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Terms & Schedule Block */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>{t("terms_title")}</h2>
            <ul className={styles.listSection}>
              {Array.isArray(termItems) && termItems.map((item, idx) => (
                <li key={idx}>
                   <IconCertificate size={18} className={styles.listIcon} />
                   <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className={styles.divider}></div>

            <h2 className={styles.sectionTitle}>{t("schedule_title")}</h2>
            <ul className={styles.listSection}>
              {Array.isArray(scheduleItems) && scheduleItems.map((item, idx) => (
                <li key={idx}>
                  <IconCalendar size={18} className={styles.listIcon} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Registration Action */}
          <div className={styles.actionContainer}>
            <p className={styles.actionDesc}>{t("register_desc")}</p>
            <button className={styles.registerBtn} disabled>
              {t("register_btn")}
            </button>
            <p className={styles.disclaimer}>(Pendaftaran belum dibuka)</p>
          </div>

        </div>
      </main>
    </div>
    </>
  );
};

export default Hidayah;
