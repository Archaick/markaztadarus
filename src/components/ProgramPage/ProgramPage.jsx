import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconBrandWhatsapp, IconCheck, IconChevronRight, IconShieldCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import BlogShell from "../Blog/BlogShell";
import Whatsapp from "../Whatsapp/Whatsapp";
import CertificateSheet from "../Certify/Template/CertificateSheet";
import { longDate } from "../Certify/Template/studioData";
import tamhid from "../../assets/imgs/homepage/methods/tamhid.png";
import tilawah from "../../assets/imgs/homepage/methods/tilawah.png";
import tafsir from "../../assets/imgs/homepage/methods/tafsir.png";
import tadabbur from "../../assets/imgs/homepage/methods/tadabbur.png";
import tazkiyah from "../../assets/imgs/homepage/methods/tazkiyah.png";
import styles from "./ProgramPage.module.css";

const PHONE = "6281210010733";
const METHODS = [
  ["tamhid", tamhid],
  ["tilawah", tilawah],
  ["tafsir", tafsir],
  ["tadabbur", tadabbur],
  ["tazkiyah", tazkiyah],
];

const waLink = (message) => `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;

/**
 * One program of Markaz Tadarus (Majelis, Seminar, Pelatihan), in the home
 * page's look and short: a photo header with the key facts, the 5T method in
 * one row, and the rest in tabs the program chooses. A fact shown in the
 * header is not repeated in a tab.
 *
 * program: { title, lead, hero, whatsapp, facts: [{ icon, label, value }],
 *   tabs: [{ key, label, type, ... }] } where type is one of
 *   "goals"       groups: [{ title, items }]
 *   "steps"       text?, items (numbered: a curriculum, a running order)
 *   "cards"       cards: [{ icon, title, items }]
 *   "books"       books: [{ img, tag, title, text, href }]
 *   "certificate" title, text, sheet (CertificateSheet data: the real design)
 *   "journey"     stages: [{ title, items }] (before → there → after)
 *   "facilities"  price?: { label, value }, items: [{ icon, text }]
 *   "schedule"    columns: [labels], rows: [[cells]]
 *   "media"       youtube? (video id), brochure? (image)
 * Optional: parent ({ label, href }: the breadcrumb above the title, Programs
 * by default), seo ({ title, description, path }).
 */
export default function ProgramPage({ program: p }) {
  const { t } = useTranslation("programs/Program");
  const { t: tMethods } = useTranslation("homepage/Methods");
  const ask = waLink(p.whatsapp);
  const tabs = p.tabs.filter(Boolean);
  const [active, setActive] = useState(tabs[0]?.key);
  const tab = tabs.find((x) => x.key === active) || tabs[0];
  const panelRef = useRef(null);

  // a new tab starts at its top: if the tabs scrolled out of sight, bring them back
  const open = (key) => {
    setActive(key);
    const panel = panelRef.current;
    if (panel && panel.getBoundingClientRect().top < 80) {
      window.scrollTo({ top: window.scrollY + panel.getBoundingClientRect().top - 90, behavior: "smooth" });
    }
  };

  return (
    <BlogShell>
      {p.seo && (
        <Helmet>
          <title>{p.seo.title}</title>
          <meta name="description" content={p.seo.description} />
          <link rel="canonical" href={`https://markaztadarus.com${p.seo.path}`} />
        </Helmet>
      )}
      {/* ── header, with the key facts at its foot ── */}
      <section className={styles.hero} style={{ "--hero": `url(${p.hero})` }}>
        <div className={styles.container}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <a href="/">{t("crumbs.home")}</a>
            <IconChevronRight size={14} />
            <a href={p.parent?.href || "/#programs"}>{p.parent?.label || t("crumbs.programs")}</a>
            <IconChevronRight size={14} />
            <span>{p.title}</span>
          </nav>
          <h1 className={styles.heroTitle}>{p.title}</h1>
          <p className={styles.heroLead}>{p.lead}</p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href={ask} target="_blank" rel="noreferrer">
              <IconBrandWhatsapp size={20} /> {t("ask")}
            </a>
          </div>
          <ul className={styles.facts}>
            {p.facts.map(({ icon: Icon, label, value }) => (
              <li key={label}>
                <Icon size={20} />
                <span>
                  <small>{label}</small>
                  <b>{value}</b>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── the 5T method, in one row ── */}
      <section className={styles.methodsWrap}>
        <div className={styles.container}>
          <h2 className={styles.rowTitle}>{tMethods("header")}</h2>
          <ol className={styles.methods}>
            {METHODS.map(([key, img]) => (
              <li key={key}>
                <img src={img} alt="" />
                <span>
                  <b>{tMethods(`methods.${key}.title`)}</b>
                  <small>{tMethods(`methods.${key}.description`)}</small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── the rest, one tab at a time ── */}
      <section className={styles.detailWrap}>
        <div className={styles.container}>
          <div className={styles.panel} ref={panelRef}>
            <div className={styles.tabs} role="tablist">
              {tabs.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  role="tab"
                  aria-selected={tab.key === x.key}
                  className={tab.key === x.key ? styles.tabOn : ""}
                  onClick={() => open(x.key)}
                >
                  {x.label}
                </button>
              ))}
            </div>
            <div className={styles.tabBody} role="tabpanel">
              <TabBody tab={tab} t={t} />
            </div>
          </div>
        </div>
      </section>

      <Whatsapp message={p.whatsapp} />
    </BlogShell>
  );
}

function TabBody({ tab, t }) {
  if (tab.type === "goals") {
    return (
      <div className={styles.goals}>
        {tab.groups.map((group) => (
          <div key={group.title}>
            <h3>{group.title}</h3>
            <ul className={styles.checks}>
              {group.items.map((item) => (
                <li key={item}>
                  <IconCheck size={16} /> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (tab.type === "steps") {
    return (
      <>
        {tab.text && <p className={styles.tabIntro}>{tab.text}</p>}
        <ol className={styles.steps}>
          {tab.items.map((item, i) => (
            <li key={item}>
              <span>{i + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      </>
    );
  }

  if (tab.type === "cards") {
    return (
      <div className={styles.details}>
        {tab.cards.map(({ icon: Icon, title, items }) => (
          <div key={title}>
            <h3>
              <Icon size={18} /> {title}
            </h3>
            <ul>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (tab.type === "books") {
    return (
      <div className={styles.books}>
        {tab.books.map((m) => (
          <article key={m.title} className={styles.book}>
            <div className={styles.bookCover}>
              <img src={m.img} alt={m.title} loading="lazy" />
            </div>
            <div className={styles.bookText}>
              {m.tag && <span className={styles.bookTag}>{m.tag}</span>}
              <h3>{m.title}</h3>
              {m.text && <p>{m.text}</p>}
              {m.href && (
                <a href={m.href} className={styles.bookLink}>
                  {t("seeBook")} <IconArrowRight size={16} />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (tab.type === "certificate") {
    return (
      <div className={styles.certificate}>
        <div className={styles.certText}>
          <h3>{tab.title}</h3>
          <p>{tab.text}</p>
          <p className={styles.certVerify}>
            <IconShieldCheck size={18} /> {t("verify")}
          </p>
        </div>
        <FittedCertificate sheet={tab.sheet} />
      </div>
    );
  }

  if (tab.type === "journey") {
    return (
      <ol className={styles.journey}>
        {tab.stages.map((stage, i) => (
          <li key={stage.title}>
            <span className={styles.journeyDot}>{i + 1}</span>
            <div>
              <h3>{stage.title}</h3>
              <ul>
                {stage.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  if (tab.type === "facilities") {
    return (
      <>
        {tab.price && (
          <div className={styles.price}>
            <small>{tab.price.label}</small>
            <b>{tab.price.value}</b>
            {tab.price.note && <span>{tab.price.note}</span>}
          </div>
        )}
        <ul className={styles.facilities}>
          {tab.items.map(({ icon: Icon, text }) => (
            <li key={text}>
              <span>
                <Icon size={18} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (tab.type === "schedule") {
    return (
      <div className={styles.scheduleWrap}>
        <table className={styles.schedule}>
          <thead>
            <tr>
              {tab.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tab.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab.type === "media") {
    return (
      <div className={styles.media}>
        {tab.youtube && (
          <div className={styles.video}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${tab.youtube}`}
              title={tab.label}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        {tab.brochure && (
          <a href={tab.brochure} target="_blank" rel="noreferrer" className={styles.brochure}>
            <img src={tab.brochure} alt={tab.label} loading="lazy" />
          </a>
        )}
      </div>
    );
  }

  return null;
}

// "2026-10-31", in the visitor's own time zone
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** The real certificate design, as wide as its box (it is drawn in code, so it stays sharp). */
function FittedCertificate({ sheet }) {
  const box = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={box} className={styles.certSheet} dir="ltr">
      {width > 0 && <CertificateSheet data={{ issueDate: longDate(today()), ...sheet }} width={width} />}
    </div>
  );
}
