import { useRef } from "react";
import { IconArrowDown, IconArrowRight, IconBook2, IconChevronLeft, IconChevronRight, IconBrandWhatsapp, IconBuildingMosque, IconCheck, IconMapPin, IconQuote } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import BlogShell from "../Blog/BlogShell";
import Whatsapp from "../Whatsapp/Whatsapp";
import heroVideo from "../../assets/video/hero.mp4";
import utPhoto from "../../assets/imgs/programs/UT.jpg";
import tsPhoto from "../../assets/imgs/programs/DS.jpg";
import dqPhoto from "../../assets/imgs/programs/DQ.jpg";
import gallery3 from "../../assets/imgs/gallery/slide3.webp";
import gallery4 from "../../assets/imgs/gallery/slide4.webp";
import gallery5 from "../../assets/imgs/gallery/slide5.webp";
import umrah1 from "../../assets/imgs/homepage/gallery/umrah/umrah1.jpg";
import umrah2 from "../../assets/imgs/homepage/gallery/umrah/umrah2.jpg";
import rahmat from "../../assets/imgs/leaders/rahmat.png";
import adnan from "../../assets/imgs/leaders/adnan.png";
import agus from "../../assets/imgs/leaders/agus.png";
import naba from "../../assets/imgs/marquee/naba.png";
import hijaz from "../../assets/imgs/marquee/hijaz.png";
import styles from "./Umrah.module.css";

const PHONE = "6281210010733";
const HIGHLIGHT_ICONS = [IconMapPin, IconBook2, IconBuildingMosque];

// The three programs: their own page, photo, title and (where it is set) fee.
const PROGRAMS = [
  { key: "ut", href: "/ut", photo: utPhoto, ns: "programs/UT", price: null },
  { key: "ts", href: "/ts", photo: tsPhoto, ns: "programs/TS", price: "facts.price.value" },
  { key: "dq", href: "/dq", photo: dqPhoto, ns: "programs/DQ", price: "facts.price.value" },
];

const LEADERS = [
  { key: "rahmat", name: "DR. Rahmat Hidayat Lubis, Lc., M.A.", photo: rahmat },
  { key: "adnan", name: "Ir. Adnan Afiff", photo: adnan },
  { key: "agus", name: "Ust. Agus Mujib, Lc., M.A.", photo: agus },
];

// One big photo, four beside it, two wide ones underneath (an even 4 × 3 grid).
const GALLERY = [umrah1, utPhoto, gallery3, dqPhoto, gallery5, gallery4, umrah2];

const PARTNERS = [
  { key: "naba", logo: naba },
  { key: "hijaz", logo: hijaz },
];

/**
 * /umrah: the Umrah programs of Markaz Tadarus — a bright header over the
 * video, the three programs side by side (who, what, fee), why Makkah in the
 * words of the leaders, the photos and the partners.
 */
export default function Umrah() {
  const { t, i18n } = useTranslation(["programs/Umrah", "programs/UT", "programs/TS", "programs/DQ"]);
  const ask = `https://wa.me/${PHONE}?text=${encodeURIComponent(t("whatsapp"))}`;
  const rtl = i18n.language === "ar";
  const stripRef = useRef(null);
  // the arrows move the photo strip by most of its width (mirrored in Arabic)
  const slide = (dir) => {
    const el = stripRef.current;
    if (el) el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <BlogShell>
      <Helmet>
        <title>{`${t("title")} · Markaz Tadarus Indonesia`}</title>
        <meta name="description" content={t("seo")} />
        <link rel="canonical" href="https://markaztadarus.com/umrah" />
      </Helmet>

      {/* ── header over the video ── */}
      <section className={styles.hero}>
        <video className={styles.video} autoPlay loop muted playsInline poster={utPhoto} aria-hidden="true">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.container}>
          <span className={styles.eyebrow}>{t("eyebrow")}</span>
          <h1 className={styles.heroTitle}>{t("title")}</h1>
          <p className={styles.tagline}>“{t("tagline")}”</p>
          <p className={styles.heroLead}>{t("lead")}</p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="#program">
              {t("see")} <IconArrowDown size={18} />
            </a>
            <a className={styles.ghost} href={ask} target="_blank" rel="noreferrer">
              <IconBrandWhatsapp size={18} /> {t("ask")}
            </a>
          </div>
          <ul className={styles.highlights}>
            {t("highlights", { returnObjects: true }).map((text, i) => {
              const Icon = HIGHLIGHT_ICONS[i] || IconCheck;
              return (
                <li key={text}>
                  <Icon size={18} /> {text}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── the three programs ── */}
      <section className={styles.programs} id="program">
        <div className={styles.container}>
          <header className={styles.sectionHead}>
            <h2>{t("programs.title")}</h2>
            <p>{t("programs.lead")}</p>
          </header>
          <div className={styles.cards}>
            {PROGRAMS.map((p) => (
              <a key={p.key} href={p.href} className={styles.card}>
                <span className={styles.cardPhoto}>
                  <img src={p.photo} alt="" loading="lazy" />
                  <span className={styles.cardTag}>{t(`programs.${p.key}.tag`)}</span>
                </span>
                <span className={styles.cardBody}>
                  <b className={styles.cardTitle}>{t("title", { ns: p.ns })}</b>
                  <span className={styles.cardText}>{t(`programs.${p.key}.text`)}</span>
                  <span className={styles.cardMeta}>
                    {t(`programs.${p.key}.meta`, { returnObjects: true }).map((m) => (
                      <span key={m}>
                        <IconCheck size={14} /> {m}
                      </span>
                    ))}
                  </span>
                  <span className={styles.cardFoot}>
                    <span className={styles.cardPrice}>{p.price ? t(p.price, { ns: p.ns }) : t("programs.ask")}</span>
                    <span className={styles.cardLink}>
                      {t("programs.open")} <IconArrowRight size={16} className={rtl ? styles.flip : undefined} />
                    </span>
                  </span>
                </span>
              </a>
            ))}
          </div>

          {/* the partners the programs run with */}
          <div className={styles.partners}>
            <h3>{t("partners.title")}</h3>
            <div className={styles.partnerCards}>
              {PARTNERS.map((p) => (
                <div key={p.key} className={styles.partner}>
                  <span className={styles.partnerLogo}>
                    <img src={p.logo} alt={t(`partners.${p.key}.name`)} loading="lazy" />
                  </span>
                  <span className={styles.partnerText}>
                    <b>{t(`partners.${p.key}.name`)}</b>
                    <small>{t(`partners.${p.key}.place`)}</small>
                    <span>{t(`partners.${p.key}.text`)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── why Makkah, in the leaders' words ── */}
      <section className={styles.leaders}>
        <div className={styles.container}>
          <header className={styles.sectionHead}>
            <h2>{t("leaders.title")}</h2>
            <p>{t("leaders.lead")}</p>
          </header>
          <div className={styles.quotes}>
            {LEADERS.map((l) => (
              <figure key={l.key} className={styles.quote}>
                <IconQuote size={28} className={styles.quoteMark} />
                <blockquote>{t(`leaders.${l.key}.text`)}</blockquote>
                <figcaption>
                  <img src={l.photo} alt="" loading="lazy" />
                  <span>
                    <b>{l.name}</b>
                    <small>{t(`leaders.${l.key}.role`)}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── photos ── */}
      <section className={styles.gallerySection}>
        <div className={styles.container}>
          <header className={styles.stripHead}>
            <div>
              <h2>{t("gallery.title")}</h2>
              <p>{t("gallery.lead")}</p>
            </div>
            <div className={styles.stripButtons}>
              <button type="button" onClick={() => slide(-1)} aria-label="‹">
                <IconChevronLeft size={20} />
              </button>
              <button type="button" onClick={() => slide(1)} aria-label="›">
                <IconChevronRight size={20} />
              </button>
            </div>
          </header>
        </div>
        {/* one row of photos to swipe through, photo by photo */}
        <div className={styles.strip} ref={stripRef}>
          {GALLERY.map((src, i) => (
            <img key={src} src={src} alt={`${t("gallery.title")} ${i + 1}`} loading="lazy" className={i % 3 === 0 ? styles.wide : undefined} />
          ))}
        </div>
        <div className={styles.container}>
        </div>
      </section>

      <Whatsapp message={t("whatsapp")} />
    </BlogShell>
  );
}
