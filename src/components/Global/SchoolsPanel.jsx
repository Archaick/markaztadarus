import { useState } from "react";
import { IconSchool } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useTeacherNames } from "./schoolMap";
import styles from "./GlobalPage.module.css";

const SHOWN = 8;

/**
 * /global's schools: each pinned school and how many of its teachers are
 * studying now, the busiest first; a tap flies the globe to its pin. An admin
 * of the teachers (Belajar) also sees who is studying, by name; visitors only
 * the counts. Nothing shows when no school is pinned.
 */
export default function SchoolsPanel({ schools, onPick }) {
  const { t } = useTranslation("global/Global");
  const { hasFeature } = useAccess();
  const admin = hasFeature("belajar");
  const [all, setAll] = useState(false);
  const shown = all ? schools : schools.slice(0, SHOWN);
  const names = useTeacherNames(
    shown.flatMap((s) => s.active),
    admin
  );
  if (!schools.length) return null;
  const studying = schools.reduce((n, s) => n + s.active.length, 0);

  return (
    <section className={styles.schoolPanel} aria-label={t("schoolsTitle")}>
      <h3 className={styles.schoolHead}>
        <IconSchool size={17} /> {t("schoolsTitle")}
        {studying > 0 && <span className={styles.schoolHeadCount}>{t("studyingPin", { count: studying })}</span>}
      </h3>
      <ul className={styles.liveList}>
        {shown.map((s) => (
          <li key={s.id} className={s.active.length ? styles.schoolItemOn : styles.schoolItem}>
            <button type="button" className={styles.liveMain} onClick={() => onPick(s)}>
              {s.active.length ? <i className={styles.studyingDot} /> : <IconSchool size={15} className={styles.schoolIcon} />}
              <span className={styles.liveText}>
                <b dir="auto">{s.name}</b>
                <small dir="auto">
                  <span>
                    {[s.city, s.province].filter(Boolean).join(", ")}
                    {(s.city || s.province) && " · "}
                    {s.active.length ? t("schoolStudying", { count: s.active.length }) : t("schoolQuiet")}
                  </span>
                </small>
              </span>
            </button>
            {admin && s.active.length > 0 && (
              <p className={styles.schoolNames} dir="auto">
                <span>{t("schoolNames")}</span> {s.active.map((uid) => (uid in names ? names[uid] || "–" : "…")).join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>
      {schools.length > SHOWN && (
        <button type="button" className={styles.schoolMore} onClick={() => setAll((v) => !v)}>
          {all ? t("schoolsLess") : t("schoolsMore", { count: schools.length - SHOWN })}
        </button>
      )}
    </section>
  );
}
