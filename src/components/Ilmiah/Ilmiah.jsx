import { useState } from "react";
import { Modal } from "@mantine/core";
import { IconBook, IconBrandWhatsapp, IconCheck, IconEye, IconShoppingBag, IconSparkles, IconTarget, IconUsersGroup } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import BlogShell from "../Blog/BlogShell";
import Whatsapp from "../Whatsapp/Whatsapp";
import OrderForm from "./OrderForm";
import tadarusId from "../../assets/imgs/ilmiah/tadarusbook.jpg";
import tadarusAr from "../../assets/imgs/ilmiah/tadarusbook-ar.jpg";
import childrenId from "../../assets/imgs/ilmiah/toddlerbook.jpg";
import childrenAr from "../../assets/imgs/ilmiah/toddlerbook-ar.jpg";
import styles from "./Ilmiah.module.css";

const STEPS = ["tamhid", "tilawah", "tafsir", "tadabbur", "tazkiyah"];
const FEATURE_ICONS = [IconTarget, IconSparkles, IconUsersGroup];

// Each book: its covers, who to ask on WhatsApp, and (the children's book)
// sample pages to look through and an order form.
const BOOKS = {
  tadarus: { covers: { id: tadarusId, ar: tadarusAr }, phone: "6282113324807" },
  children: {
    covers: { id: childrenId, ar: childrenAr },
    phone: "6287875764426",
    preview: "https://drive.google.com/file/d/1QgBMDZw0Rx5zJbZQOxJoVPuiU3RxbNFb/preview",
    orderable: true,
  },
};

const waLink = (phone, message) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

/**
 * Karya Ilmiah: the books of Markaz Tadarus Indonesia, in light glass. Two
 * book cards to pick from, then one panel for the chosen book: its cover
 * (Indonesian or Arabic edition), what it is, what is inside, and how to see
 * sample pages, order it or ask about it.
 */
export default function Ilmiah() {
  const { t, i18n } = useTranslation("programs/Ilmiah");
  const [bookKey, setBookKey] = useState("tadarus");
  const [edition, setEdition] = useState(i18n.language === "ar" ? "ar" : "id");
  const [dialog, setDialog] = useState(null); // "preview" | "order"
  const book = BOOKS[bookKey];
  const b = (key, options) => t(`${bookKey}.${key}`, options);

  return (
    <BlogShell>
      <div className={styles.page}>
        <div className={styles.aurora} aria-hidden="true" />

        <header className={styles.head}>
          <span className={styles.eyebrow}>
            <IconBook size={16} /> {t("eyebrow")}
          </span>
          <h1>{t("title")}</h1>
          <p>{t("lead")}</p>
        </header>

        {/* the two books, to pick from */}
        <div className={styles.picker} role="tablist" aria-label={t("pick")}>
          {Object.entries(BOOKS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={bookKey === key}
              className={`${styles.pick} ${bookKey === key ? styles.pickOn : ""}`}
              onClick={() => setBookKey(key)}
            >
              <img src={item.covers[edition]} alt="" />
              <span>
                <small>{t(`${key}.tag`)}</small>
                <b>{t(`${key}.title`)}</b>
              </span>
            </button>
          ))}
        </div>

        {/* the chosen book */}
        <section className={styles.panel} role="tabpanel">
          <div className={styles.coverSide}>
            <div className={styles.coverStage}>
              <img key={`${bookKey}-${edition}`} src={book.covers[edition]} alt={b("title")} className={styles.cover} />
            </div>
            <div className={styles.editions} role="group">
              {["id", "ar"].map((key) => (
                <button key={key} type="button" className={edition === key ? styles.editionOn : ""} onClick={() => setEdition(key)} aria-pressed={edition === key}>
                  {t(`editions.${key}`)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.info}>
            <span className={styles.tag}>{b("tag")}</span>
            <h2>{b("title")}</h2>
            <p className={styles.text}>{b("text")}</p>

            {bookKey === "tadarus" ? (
              <>
                <h3>{b("stepsTitle")}</h3>
                <ol className={styles.steps}>
                  {STEPS.map((step, i) => (
                    <li key={step}>
                      <span>{i + 1}</span>
                      <b>{step.charAt(0).toUpperCase() + step.slice(1)}</b>
                      <small>{b(`steps.${step}`)}</small>
                    </li>
                  ))}
                </ol>
                <h3>{b("seriesTitle")}</h3>
                <ul className={styles.series}>
                  {b("series", { returnObjects: true }).map((s) => (
                    <li key={s.name}>
                      <b>{s.name}</b>
                      <span>{s.text}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <ul className={styles.features}>
                {b("features", { returnObjects: true }).map((f, i) => {
                  const Icon = FEATURE_ICONS[i] || IconCheck;
                  return (
                    <li key={f.title}>
                      <span className={styles.featureIcon}>
                        <Icon size={20} />
                      </span>
                      <span>
                        <b>{f.title}</b>
                        <small>{f.text}</small>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className={styles.actions}>
              {book.orderable && (
                <button type="button" className={styles.primary} onClick={() => setDialog("order")}>
                  <IconShoppingBag size={18} /> {t("order")}
                </button>
              )}
              {book.preview && (
                <button type="button" className={styles.secondary} onClick={() => setDialog("preview")}>
                  <IconEye size={18} /> {t("preview")}
                </button>
              )}
              <a className={book.orderable ? styles.link : styles.primary} href={waLink(book.phone, b("whatsapp"))} target="_blank" rel="noreferrer">
                <IconBrandWhatsapp size={18} /> {t("ask")}
              </a>
            </div>
          </div>
        </section>
      </div>

      <Modal
        opened={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog === "order" ? t("order") : t("preview")}
        size={dialog === "preview" ? "xl" : "lg"}
        centered
        radius="lg"
        classNames={{ overlay: styles.overlay, content: styles.dialog, header: styles.dialogHead, title: styles.dialogTitle, body: styles.dialogBody }}
      >
        {dialog === "preview" && book.preview && (
          <iframe src={book.preview} title={t("preview")} className={styles.previewFrame} allow="autoplay" />
        )}
        {dialog === "order" && <OrderForm phone={book.phone} />}
      </Modal>

      <Whatsapp message={b("whatsapp")} phoneNumber={book.phone} />
    </BlogShell>
  );
}
