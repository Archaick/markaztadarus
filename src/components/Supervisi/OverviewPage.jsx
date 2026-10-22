import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader } from "@mantine/core";
import { IconBuildingCommunity, IconChartBar, IconClipboardCheck, IconUsers } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useSupervisi } from "./SupervisiData";
import { BASE } from "./SupervisiShell";
import { Stat, StatusChip, useDateFormat } from "./parts";
import { formatAverage } from "./supervisiSchema";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";

export function SessionRow({ session }) {
  const { t } = useTranslation(NS);
  const dates = useDateFormat();
  const to = session.status === "done" ? `${BASE}/laporan/${session.id}` : `${BASE}/sesi/${session.id}`;
  return (
    <li>
      <Link to={to} className={styles.row}>
        <div className={styles.rowMain}>
          <div className={styles.rowTitle} dir="auto">
            {session.teacherName}
          </div>
          <div className={styles.rowSub} dir="auto">
            {[session.schoolName, session.className && `${t("fields.className")} ${session.className}`, session.surah, dates.short(session.date)]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <div className={styles.rowEnd}>
          {session.status === "done" && (
            <span className={styles.score}>
              {formatAverage(session.average)}
              <small>/ {session.max || 5}</small>
            </span>
          )}
          <StatusChip status={session.status} />
        </div>
      </Link>
    </li>
  );
}

/** Home: the numbers, supervisions still open, and the latest reports. */
export default function OverviewPage() {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const { schools, teachers, sessions, loading } = useSupervisi();

  const stats = useMemo(() => {
    const done = (sessions || []).filter((s) => s.status === "done");
    const avg = done.length ? done.reduce((a, s) => a + (s.average || 0), 0) / done.length : 0;
    return { done, avg, open: (sessions || []).filter((s) => s.status !== "done") };
  }, [sessions]);

  if (loading) return <Loader />;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{t("home.greeting", { name: (user?.displayName || "").split(" ")[0] || "" })}</h1>
          <p className={styles.pageSub}>{t("home.intro")}</p>
        </div>
        <Link to={`${BASE}/supervisi?new=1`} className={styles.primary}>
          {t("sessions.new")}
        </Link>
      </div>

      <div className={styles.stats}>
        <Stat icon={IconBuildingCommunity} value={schools.length} label={t("home.schools")} />
        <Stat icon={IconUsers} value={teachers.length} label={t("home.teachers")} />
        <Stat icon={IconClipboardCheck} value={stats.done.length} label={t("home.done")} />
        <Stat icon={IconChartBar} value={formatAverage(stats.avg)} label={t("home.average")} />
      </div>

      <div className={styles.twoCols}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t("home.open")}</h2>
          {stats.open.length ? (
            <ul className={styles.rows}>
              {stats.open.slice(0, 8).map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>{t("home.noOpen")}</p>
          )}
        </section>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t("home.latest")}</h2>
          {stats.done.length ? (
            <ul className={styles.rows}>
              {stats.done.slice(0, 8).map((s) => (
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
