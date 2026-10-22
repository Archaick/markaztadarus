import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader, SegmentedControl, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useSupervisi } from "./SupervisiData";
import { SessionRow } from "./OverviewPage";
import NewSession from "./NewSession";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";

/** Every supervision, newest first, with search and status filter. */
export default function SessionsPage() {
  const { t } = useTranslation(NS);
  const { sessions, loading } = useSupervisi();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const creating = params.get("new") === "1";

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (sessions || [])
      .filter((s) => status === "all" || (status === "open" ? s.status !== "done" : s.status === "done"))
      .filter((s) => !q || [s.teacherName, s.schoolName, s.supervisorName, s.surah, s.className].some((x) => (x || "").toLowerCase().includes(q)));
  }, [sessions, search, status]);

  if (loading) return <Loader />;

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>{t("sessions.title")}</h1>
        <button type="button" className={styles.primary} onClick={() => setParams({ new: "1" })}>
          {t("sessions.new")}
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <TextInput
          style={{ flex: "1 1 320px" }}
          size="md"
          radius="xl"
          leftSection={<IconSearch size={18} />}
          placeholder={t("sessions.search")}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <SegmentedControl
          radius="xl"
          value={status}
          onChange={setStatus}
          data={[
            { value: "all", label: t("sessions.all") },
            { value: "open", label: t("sessions.openOnes") },
            { value: "done", label: t("status.done") },
          ]}
        />
      </div>
      {shown.length ? (
        <ul className={styles.rows}>
          {shown.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{sessions.length ? t("common.noMatch") : t("sessions.empty")}</p>
      )}
      <NewSession opened={creating} onClose={() => setParams({})} />
    </>
  );
}
