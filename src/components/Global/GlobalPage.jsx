import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconChevronDown, IconMap2, IconMinus, IconPlus, IconWorld } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import WorldGlobe from "./WorldGlobe";
import { ORIGIN, countryName, useGlobalContent } from "./globalData";
import Flag from "./Flag";
import LivePanel from "./LivePanel";
import { useLiveSessions } from "./liveSessions";
import { SITE_DOCS, useSiteContent } from "../HomePage/siteContent";
import { getDisplayName, mtiProvinces, programCount, provinceTotals } from "../../data/mtiProvinceData";
import whiteLogo from "../../assets/imgs/MT-logo-white.svg";
import styles from "./GlobalPage.module.css";

const NS = "global/Global";
const LANGS = [
  { code: "id", label: "ID" },
  { code: "en", label: "EN" },
  { code: "ar", label: "عربي" },
];
const LOCALES = { id: "id-ID", en: "en-GB", ar: "ar-u-nu-latn" };

/** The time in Makkah, ticking. */
function useMakkahTime(lang) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return new Intl.DateTimeFormat(LOCALES[lang] || "id-ID", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
}

/**
 * /global: Markaz Tadarus around the world. A live globe (night shaded where
 * it is night now) with every country that has Tadarus programs lit up and
 * joined to Makkah; tap any country to fly to it and read about it.
 */
export default function GlobalPage() {
  const { t, i18n } = useTranslation(NS);
  const lang = (i18n.language || "id").slice(0, 2);
  const rtl = lang === "ar";
  const content = useGlobalContent();
  const siteMap = useSiteContent(SITE_DOCS.map);
  const provinces = siteMap?.provinces && Object.keys(siteMap.provinces).length ? siteMap.provinces : mtiProvinces;
  const indonesia = useMemo(() => provinceTotals(provinces), [provinces]);
  const programs = content?.countries || {};
  const [selected, setSelected] = useState(null);
  const [litCity, setLitCity] = useState(null);
  const [province, setProvince] = useState(null);
  const globe = useRef(null);
  const panel = useRef(null);
  const makkah = useMakkahTime(lang);
  const sessions = useLiveSessions(provinces, programs);

  useEffect(() => {
    document.title = `${t("title")} · Markaz Tadarus`;
  }, [t]);

  // the page's night sky also behind it, so no white shows when a phone
  // scrolls or bounces past the ends
  useEffect(() => {
    const before = document.body.style.background;
    document.body.style.background = "#020817";
    return () => {
      document.body.style.background = before;
    };
  }, []);

  // Indonesia's figures follow the home page map
  const figures = (code) => {
    const data = programs[code] || {};
    const cities = (data.cities || []).length;
    if (code === "ID") return { programs: Number(data.programs) || indonesia.locations, cities, provinces: indonesia.provinces, islands: indonesia.islands };
    return { programs: Number(data.programs) || cities, cities };
  };
  const list = Object.keys(programs)
    .map((code) => ({ code, name: countryName(code, lang), ...figures(code) }))
    .sort((a, b) => b.programs - a.programs || a.name.localeCompare(b.name));
  const total = list.reduce((sum, c) => sum + c.programs, 0);

  const pick = (code) => {
    setSelected(code);
    setLitCity(null);
    setProvince(null);
  };
  // up close, a tap on one of Indonesia's provinces
  const pickProvince = (name) => {
    setSelected("ID");
    setLitCity(null);
    setProvince(name);
  };
  // a tap on an online Tadarus in the panel: its country, then the place itself
  const pickSession = (p) => {
    setSelected(p.code);
    setLitCity(null);
    setProvince(p.province || null);
    const at = p.at;
    if (at) setTimeout(() => globe.current?.flyToPoint(at, 7), 60);
  };
  const backToWorld = () => {
    setSelected(null);
    setLitCity(null);
    setProvince(null);
    globe.current?.home();
  };

  const sel = selected ? { code: selected, name: countryName(selected, lang), program: !!programs[selected], ...figures(selected), data: programs[selected] } : null;

  return (
    <div className={styles.page} dir={rtl ? "rtl" : "ltr"}>
      <div className={styles.stars} aria-hidden="true" />

      <header className={styles.top}>
        <Link to="/" className={styles.home}>
          <IconArrowLeft size={18} className={styles.flip} />
          <img src={whiteLogo} alt="Markaz Tadarus" />
        </Link>
        <div className={styles.titleBox}>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <div className={styles.topEnd}>
          <span className={styles.live}>
            <i />
            {t("live")} · {t("makkahTime", { time: makkah })}
          </span>
          <div className={styles.langs} role="group" aria-label={t("language")}>
            {LANGS.map((l) => (
              <button key={l.code} type="button" lang={l.code} aria-pressed={lang === l.code} className={lang === l.code ? styles.langOn : ""} onClick={() => i18n.changeLanguage(l.code)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className={styles.stage}>
        <WorldGlobe
          ref={globe}
          programs={programs}
          provinces={provinces}
          selected={selected}
          onSelect={pick}
          selectedProvince={province}
          onProvince={pickProvince}
          highlightCity={litCity}
          labels={{ makkah: t("holy.makkah"), madinah: t("holy.madinah"), quds: t("holy.quds") }}
        />

        <div className={styles.controls}>
          <button type="button" onClick={() => globe.current?.zoomBy(1.5)} aria-label={t("zoomIn")} title={t("zoomIn")}>
            <IconPlus size={18} />
          </button>
          <button type="button" onClick={() => globe.current?.zoomBy(1 / 1.5)} aria-label={t("zoomOut")} title={t("zoomOut")}>
            <IconMinus size={18} />
          </button>
          <button type="button" onClick={backToWorld} aria-label={t("back")} title={t("back")}>
            <IconWorld size={18} />
          </button>
        </div>
        {!sel && <p className={styles.hint}>{t("hint")}</p>}
        {/* phones: the picked country over the globe; tap to read about it below */}
        {sel && (
          <button type="button" className={styles.peek} onClick={() => panel.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            <Flag code={sel.code} size={18} />
            <b>{sel.name}</b>
            <span>{sel.program ? `${sel.programs} ${t("programs")}` : t("noPrograms")}</span>
            <IconChevronDown size={16} />
          </button>
        )}
      </main>

      <aside ref={panel} className={styles.panel}>
        {!sel ? (
          <>
            <p className={styles.kicker}>{t("from")}</p>
            <h2 className={styles.panelTitle}>{t("where")}</h2>
            <div className={styles.totals}>
              <div>
                <b>{list.length}</b>
                <span>{t("countries")}</span>
              </div>
              <div>
                <b>{total}</b>
                <span>{t("programs")}</span>
              </div>
            </div>
            <LivePanel live={sessions.live} next={sessions.next} onPick={pickSession} />
            <button type="button" className={styles.originCard} onClick={() => pick(ORIGIN)}>
              <Flag code={ORIGIN} size={22} />
              <span>
                <b>{t("origin.badge")}</b>
                <small>{t("origin.short")}</small>
              </span>
            </button>
            <ul className={styles.list}>
              {list.map((c) => (
                <li key={c.code}>
                  <button type="button" onClick={() => pick(c.code)}>
                    <Flag code={c.code} size={20} />
                    <span className={styles.listName}>{c.name}</span>
                    <span className={styles.listCount}>{c.programs} {t("programs")}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className={styles.legend}>
              <i className={styles.legendOrigin} /> {t("origin.badge")}
              <i className={styles.legendGold} /> {t("legendPrograms")}
              <i className={styles.legendNight} /> {t("legendNight")}
            </p>
          </>
        ) : (
          <div key={sel.code} className={styles.card}>
            <button type="button" className={styles.back} onClick={backToWorld}>
              <IconArrowLeft size={16} className={styles.flip} /> {t("back")}
            </button>
            <div className={styles.countryHead}>
              <Flag code={sel.code} size={40} />
              <div>
                <h2 className={styles.panelTitle}>{sel.name}</h2>
                {sel.code === ORIGIN && <span className={styles.badgeOrigin}>{t("origin.badge")}</span>}
                {sel.program ? (
                  <span className={styles.badge}>{t("hasPrograms")}</span>
                ) : sel.code !== ORIGIN ? (
                  <span className={styles.badgeMuted}>{t("noPrograms")}</span>
                ) : null}
              </div>
            </div>

            {sel.program ? (
              <>
                <div className={styles.totals}>
                  <div>
                    <b>{sel.programs}</b>
                    <span>{t("programs")}</span>
                  </div>
                  {sel.code === "ID" ? (
                    <>
                      <div>
                        <b>{sel.provinces}</b>
                        <span>{t("provinces")}</span>
                      </div>
                      <div>
                        <b>{sel.islands}</b>
                        <span>{t("islands")}</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <b>{sel.cities}</b>
                      <span>{t("cities")}</span>
                    </div>
                  )}
                </div>
                {sel.code === "ID" && province && (
                  <p className={styles.provinceLine}>
                    <b>{getDisplayName(province, provinces)}</b>
                    <span>{provinces[province] ? `${programCount(provinces[province])} ${t("programs")}` : t("noPrograms")}</span>
                  </p>
                )}
                {sel.data?.note?.[lang] || sel.data?.note?.id ? <p className={styles.note}>{sel.data.note[lang] || sel.data.note.id}</p> : null}
                <LivePanel
                  live={sessions.live.filter((p) => p.code === sel.code)}
                  next={sessions.next.filter((p) => p.code === sel.code)}
                  onPick={pickSession}
                  showCountry={false}
                />
                {(sel.data?.cities || []).length > 0 && (
                  <div className={styles.cities}>
                    {sel.data.cities.map((city, i) => (
                      <button
                        key={i}
                        type="button"
                        className={litCity === `${sel.code}-${i}` ? styles.cityOn : ""}
                        onClick={() => {
                          setLitCity(`${sel.code}-${i}`);
                          globe.current?.flyToPoint([city.lon, city.lat], 5);
                        }}
                      >
                        {city.name || "•"}
                      </button>
                    ))}
                  </div>
                )}
                {sel.code === "ID" && (
                  <Link to="/#map" className={styles.mapLink}>
                    <IconMap2 size={17} /> {t("mapLink")}
                  </Link>
                )}
              </>
            ) : sel.code === ORIGIN ? (
              <p className={styles.note}>{t("origin.text")}</p>
            ) : (
              <p className={styles.note}>{t("soon")}</p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
