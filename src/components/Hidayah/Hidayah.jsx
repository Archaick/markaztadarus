import React from "react";
import { useTranslation } from "react-i18next";
import {
  IconCalendar,
  IconCertificate,
  IconChevronDown,
  IconArrowLeft,
  IconLanguage,
  IconChecklist,
  IconClockHour4,
  IconCoins,
} from "@tabler/icons-react";
import { Menu } from "@mantine/core";
import styles from "./Hidayah.module.css";
import heroImg from "../../assets/imgs/homepage/programs/diploma.png";

const sectionMeta = [
  { key: "system", icon: IconChecklist },
  { key: "requirements", icon: IconCertificate },
  { key: "program_schedule", icon: IconCalendar },
  { key: "class_schedule", icon: IconClockHour4 },
  { key: "fees", icon: IconCoins },
];

const Hidayah = () => {
  const { t, i18n } = useTranslation("hidayah/Hidayah");
  const isArabic = i18n.language === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  const books = t("books", { returnObjects: true }) || [];
  const overviewParagraphs = t("overview_paragraphs", { returnObjects: true }) || [];
  const systemItems = t("system_items", { returnObjects: true }) || [];
  const requirementItems = t("requirements_items", { returnObjects: true }) || [];
  const programScheduleItems = t("program_schedule_items", { returnObjects: true }) || [];
  const classScheduleItems = t("class_schedule_items", { returnObjects: true }) || [];
  const feeItems = t("fees_items", { returnObjects: true }) || [];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const languageOptions = [
    { code: "id", label: "ID" },
    { code: "en", label: "EN" },
    { code: "ar", label: "AR" },
  ];

  const sectionItemsMap = {
    system: systemItems,
    requirements: requirementItems,
    program_schedule: programScheduleItems,
    class_schedule: classScheduleItems,
    fees: feeItems,
  };

  return (
    <>
      <header className={styles.simpleHeader} dir={dir}>
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
              <Menu.Item key={option.code} onClick={() => changeLanguage(option.code)}>
                {option.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </header>

      <div className={`${styles.pageContainer} ${styles.cleanPage}`} dir={dir}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroTextBlock}>
              <p className={styles.heroEyebrow}>{t("hero_eyebrow")}</p>
              <h1 className={styles.heroTitle}>{t("title")}</h1>
              <p className={styles.heroSubtext}>{t("hero_subtext")}</p>
            </div>
            <img src={heroImg} alt="Hidayah al-Qur'an" className={styles.heroImage} />
          </div>
        </section>

        <main className={styles.mainContent}>
          <div className={styles.contentWrap}>
            <section className={`${styles.card} ${styles.overviewCard}`}>
              <div className={styles.overviewHeader}>
                <div>
                  <p className={styles.cardEyebrow}>{t("overview_title")}</p>
                  <h2 className={styles.sectionTitle}>{t("title")}</h2>
                </div>
                <a href={t("register_url")} className={styles.registerLink}>
                  {t("register_btn")}
                </a>
              </div>

              <div className={styles.textStack}>
                {Array.isArray(overviewParagraphs) &&
                  overviewParagraphs.map((paragraph) => (
                    <p key={paragraph} className={styles.paragraph}>
                      {paragraph}
                    </p>
                  ))}
              </div>

              <div className={styles.booksPanel}>
                <p className={styles.paragraphBold}>{t("books_intro")}</p>
                <ol className={styles.numberedList}>
                  {Array.isArray(books) &&
                    books.map((book, idx) => (
                      <li key={idx}>
                        <span>{book}</span>
                      </li>
                    ))}
                </ol>
              </div>
            </section>

            <div className={styles.gridSection}>
              {sectionMeta.map(({ key, icon: Icon }) => (
                <section key={key} className={styles.card}>
                  <div className={styles.sectionHeading}>
                    <Icon size={20} className={styles.headingIcon} />
                    <h2 className={styles.sectionTitle}>{t(`${key}_title`)}</h2>
                  </div>

                  <ul className={styles.listSection}>
                    {Array.isArray(sectionItemsMap[key]) &&
                      sectionItemsMap[key].map((item, idx) => (
                        <li key={idx}>
                          <span>{item}</span>
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          <div className={styles.registerSection}>
            <a href={t("register_url")} className={styles.registerButton}>
              {t("register_btn")}
            </a>
          </div>
        </main>
      </div>
    </>
  );
};

export default Hidayah;
