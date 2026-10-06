import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { IconArrowRight, IconBuildingCommunity, IconMapPin, IconMapPinOff, IconNews } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Map.module.css";
import { getDisplayName } from "../../../data/mtiProvinceData";
import { useProvinceNews } from "../../Blog/useProvinceNews";
import { formatPostDate } from "../../Blog/blogSchema";

// The newest news tagged with this province, linking to each post.
function ProvinceNews({ province }) {
  const { t, i18n } = useTranslation("homepage/Map");
  const posts = useProvinceNews(province);
  if (!posts.length) return null;

  return (
    <div className={styles.news}>
      <p className={styles.listTitle}>
        <IconNews size={14} className={styles.inlineIcon} /> {t("news_title")}
      </p>
      <ul className={styles.newsList}>
        {posts.map((post) => (
          <li key={post.id}>
            <Link to={`/berita/${post.id}`} className={styles.newsItem}>
              {post.coverThumb && <img src={post.coverThumb} alt="" loading="lazy" />}
              <span className={styles.newsText}>
                <span className={styles.newsTitle} dir="auto">
                  {post.title}
                </span>
                <span className={styles.newsDate}>{formatPostDate(post.date, i18n.language)}</span>
              </span>
              <IconArrowRight size={15} className={styles.newsArrow} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The card for one province: programs, participants, its locations and news.
export function ProvinceDetail({ shown, provinces }) {
  const { t } = useTranslation("homepage/Map");
  if (!shown) return null;

  return (
    // Swaps at once and fades in, so the card is never left empty.
    <motion.div key={shown.name} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {shown.inactive ? (
        <div className={styles.empty}>
          <IconMapPinOff size={28} />
          <h3 className={styles.detailTitle}>{shown.name}</h3>
          <p className={styles.emptyTitle}>{t("no_program_title")}</p>
          <p className={styles.emptyText}>{t("no_program_text", { province: shown.name })}</p>
        </div>
      ) : (
        <>
          <div className={styles.detailHead}>
            <div>
              <h3 className={styles.detailTitle}>{getDisplayName(shown.name, provinces)}</h3>
              {shown.island && <span className={styles.island}>{shown.island}</span>}
            </div>
            <div className={styles.bigNumber}>
              <strong>{shown.programs}</strong>
              <span>{t("stat_locations")}</span>
            </div>
          </div>

          {shown.participants ? (
            <p className={styles.participants}>
              {t("participants")}: <strong>{Number(shown.participants).toLocaleString("id-ID")}</strong>
            </p>
          ) : null}

          {(shown.locations || []).length > 0 && (
            <>
              <p className={styles.listTitle}>{t("locations_title")}</p>
              <ul className={styles.locations}>
                {shown.locations.map((loc, i) => (
                  <li key={`${loc.city}-${i}`}>
                    {loc.institution ? <IconBuildingCommunity size={18} /> : <IconMapPin size={18} />}
                    <div>
                      {loc.institution && <span className={styles.institution}>{loc.institution}</span>}
                      <span className={styles.city}>{loc.city}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <ProvinceNews province={shown.name} />
        </>
      )}
    </motion.div>
  );
}

export function ProvinceChips({ list, provinces, selected, onPick, className = "" }) {
  return (
    <div className={`${styles.chips} ${className}`} role="list">
      {list.map((p) => (
        <button
          type="button"
          role="listitem"
          key={p.name}
          className={`${styles.chip} ${p.name === selected ? styles.chipOn : ""}`}
          onClick={() => onPick(p.name)}
          aria-pressed={p.name === selected}
        >
          <span>{getDisplayName(p.name, provinces)}</span>
          <span className={styles.chipCount}>{p.programs}</span>
        </button>
      ))}
    </div>
  );
}
