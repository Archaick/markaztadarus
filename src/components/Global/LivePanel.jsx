import { IconBrandZoom, IconClock, IconExternalLink } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { clockAt, dayAt } from "./liveSessions";
import Flag from "./Flag";
import styles from "./GlobalPage.module.css";

const LOCALES = { id: "id-ID", en: "en-GB", ar: "ar" };
const NEXT_SHOWN = 4;

/**
 * /global's Tadarus Live: the online Tadarus running now, then the next ones,
 * each with its Zoom link (when the admins show it) and activity link. A tap
 * on a place flies the globe to it. Nothing shows when there are none.
 */
export default function LivePanel({ live, next, onPick, showCountry = true }) {
  const { t, i18n } = useTranslation("global/Global");
  const lang = (i18n.language || "id").slice(0, 2);
  if (!live.length && !next.length) return null;

  const dayName = (ms, utc) => {
    const day = dayAt(ms, utc);
    const today = dayAt(Date.now(), utc);
    if (day === today) return t("liveToday");
    if (day === (today + 1) % 7) return t("liveTomorrow");
    return new Intl.DateTimeFormat(LOCALES[lang] || "id-ID", { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + day)));
  };

  const item = (p, isLive) => {
    const id = p.code === "ID";
    return (
      <li key={p.key} className={isLive ? styles.liveItemOn : styles.liveItem}>
        <button type="button" className={styles.liveMain} onClick={() => onPick(p)}>
          {isLive ? <i className={styles.liveDotRed} /> : <IconClock size={15} className={styles.liveClock} />}
          <span className={styles.liveText}>
            <b dir="auto">{p.session.title || p.name}</b>
            <small dir="auto">
              {showCountry && <Flag code={p.code} size={13} />}
              <span>
                {p.session.title ? `${p.name} · ` : ""}
                {isLive ? t("liveUntil", { time: clockAt(p.endsAt, p.session.utc, id) }) : `${dayName(p.nextAt, p.session.utc)} ${clockAt(p.nextAt, p.session.utc, id)}`}
              </span>
            </small>
          </span>
        </button>
        {(p.session.zoom || p.session.activity) && (
          <span className={styles.liveLinks}>
            {p.session.zoom && (
              <a href={p.session.zoom} target="_blank" rel="noopener noreferrer" className={styles.liveJoin}>
                <IconBrandZoom size={15} /> {isLive ? t("liveJoin") : t("liveZoom")}
              </a>
            )}
            {p.session.activity && (
              <a href={p.session.activity} target="_blank" rel="noopener noreferrer" className={styles.liveActivity}>
                <IconExternalLink size={14} /> {t("liveActivity")}
              </a>
            )}
          </span>
        )}
      </li>
    );
  };

  return (
    <section className={styles.livePanel} aria-label={t("liveNow")}>
      {live.length > 0 && (
        <>
          <h3 className={styles.liveHead}>
            <span className={styles.liveBadge}>LIVE</span> {t("liveNow")} <span className={styles.liveCount}>{live.length}</span>
          </h3>
          <ul className={styles.liveList}>{live.map((p) => item(p, true))}</ul>
        </>
      )}
      {next.length > 0 && (
        <>
          <h3 className={styles.liveHeadSoft}>{t("liveNext")}</h3>
          <ul className={styles.liveList}>{next.slice(0, NEXT_SHOWN).map((p) => item(p, false))}</ul>
        </>
      )}
    </section>
  );
}
