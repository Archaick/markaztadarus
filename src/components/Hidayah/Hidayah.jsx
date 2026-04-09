import React, { useEffect, useState } from "react";
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
  const [timeLeft, setTimeLeft] = useState("");

  const books = t("books", { returnObjects: true }) || [];
  const overviewParagraphs = t("overview_paragraphs", { returnObjects: true }) || [];
  const systemItems = t("system_items", { returnObjects: true }) || [];
  const requirementItems = t("requirements_items", { returnObjects: true }) || [];
  const programScheduleItems = t("program_schedule_items", { returnObjects: true }) || [];
  const classScheduleItems = t("class_schedule_items", { returnObjects: true }) || [];
  const feeItems = t("fees_items", { returnObjects: true }) || [];

  useEffect(() => {
    const targetDate = new Date("2026-04-20T00:00:00").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft(t("countdown_expired"));
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
                <button type="button" className={styles.registerLinkDisabled} disabled>
                  {t("register_btn")}
                </button>
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

              <div className={styles.noticeBox}>
                <p className={styles.noticeText}>{t("register_desc")}</p>
                <div className={styles.countdownBadge}>
                  <span className={styles.countdownLabel}>{t("countdown_prefix")}</span>
                  <span className={styles.countdownTime}>{timeLeft}</span>
                </div>
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
        </main>
      </div>
    </>
  );
};

export default Hidayah;
