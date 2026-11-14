import { useTranslation } from "react-i18next";
import { NS } from "./belajarSchema";
import { TYPES } from "./questionTypeList";
import styles from "./Belajar.module.css";

/** One numbered card per type: icon, name (with its Arabic name), one line on what it is, an example. */
export function TypeCards({ group = "quiz", onPick }) {
  const { t, i18n } = useTranslation(NS);
  const arabicUi = (i18n.language || "").startsWith("ar");
  return (
    <div className={styles.typeGrid}>
      {TYPES.filter((x) => x.group === group).map(({ type, icon: Icon, ar }, i) => (
        <button key={type} type="button" className={styles.typeCard} onClick={() => onPick(type)}>
          <span className={styles.typeNo}>{i + 1}</span>
          <span className={styles.typeIcon}>
            <Icon size={26} />
          </span>
          <b className={styles.typeName}>{t(`board.types.${type}.name`)}</b>
          {!arabicUi && (
            <span className={styles.typeAr} dir="rtl" lang="ar">
              {ar}
            </span>
          )}
          <span className={styles.typeDesc}>{t(`board.types.${type}.desc`)}</span>
          <span className={styles.typeEx} dir="auto">
            {t(`board.types.${type}.ex`)}
          </span>
        </button>
      ))}
    </div>
  );
}
