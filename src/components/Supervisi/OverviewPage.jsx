import { useMemo } from "react";
import { Loader } from "@mantine/core";
import { IconBuildingCommunity, IconChartBar, IconClipboardCheck, IconUsers } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useSupervisi } from "./SupervisiData";
import { Stat } from "./parts";
import SessionRow from "./SessionRow";
import SchoolScene from "./SchoolScene";
import { AspectBars, Gauge, Months, Radar, SchoolsProgress, chartData } from "./HomeCharts";
import styles from "./Supervisi.module.css";
import c from "./Charts.module.css";

const NS = "internal/Supervisi";

/** Home: a greeting, the numbers and charts, supervisions still open, and the latest reports. */
export default function OverviewPage() {
  const { t, i18n } = useTranslation(NS);
  const { user } = useAccess();
  const { schools, teachers, sessions, loading } = useSupervisi();

  const data = useMemo(() => chartData({ sessions: sessions || [], schools: schools || [], teachers: teachers || [], lang: i18n.language }), [sessions, schools, teachers, i18n.language]);
  const open = useMemo(() => (sessions || []).filter((s) => s.status !== "done"), [sessions]);
  const done = useMemo(() => (sessions || []).filter((s) => s.status === "done"), [sessions]);

  if (loading) return <Loader />;

  return (
    <>
      <div className={`${styles.hero} ${styles.homeHero}`}>
        <SchoolScene id="home" scene="mosque-sunset" />
        <span className={`${styles.cardShade} ${styles.cardShadeScene}`} />
        <div className={styles.cardTop} style={{ alignSelf: "flex-end" }}>
          <h1 className={styles.cardTitle}>{t("home.greeting", { name: (user?.displayName || "").split(" ")[0] || "" })}</h1>
          <p className={styles.cardPlace}>{t("home.intro")}</p>
        </div>
      </div>

      <div className={styles.stats}>
        <Stat icon={IconBuildingCommunity} value={schools.length} label={t("home.schools")} />
        <Stat icon={IconUsers} value={teachers.length} label={t("home.teachers")} />
        <Stat icon={IconClipboardCheck} value={data.done} label={t("home.done")} />
        <Stat icon={IconChartBar} value={data.average} decimals={1} label={t("home.average")} />
      </div>

      <div className={c.grid}>
        <Gauge average={data.average} max={data.max} />
        <Radar axes={data.axes} max={data.max} hasData={data.done > 0} />
        <AspectBars sections={data.sections} max={data.max} />
      </div>
      <div className={c.grid}>
        <Months months={data.months} />
        <SchoolsProgress rows={data.schools} />
      </div>

      <div className={styles.twoCols}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t("home.open")}</h2>
          {open.length ? (
            <ul className={styles.rows}>
              {open.slice(0, 8).map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>{t("home.noOpen")}</p>
          )}
        </section>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t("home.latest")}</h2>
          {done.length ? (
            <ul className={styles.rows}>
              {done.slice(0, 8).map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>{t("home.noDone")}</p>
          )}
        </section>
      </div>
    </>
  );
}
