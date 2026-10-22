import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Group, Loader, Modal, TextInput } from "@mantine/core";
import { IconChevronRight, IconPhoto, IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { compressImage } from "../Internal/images";
import { useSupervisi } from "./SupervisiData";
import { BASE } from "./SupervisiShell";
import { saveSchool } from "./actions";
import { ProgressRing } from "./parts";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";
const COVER = { maxWidth: 1000, maxHeight: 700, maxChars: 140000 };

/** Share of a school's teachers with at least one finished supervision. */
export function schoolProgress(school, teachers, sessions) {
  const list = teachers.filter((t) => t.schoolId === school.id);
  const done = new Set(sessions.filter((s) => s.schoolId === school.id && s.status === "done").map((s) => s.teacherId));
  return { teachers: list.length, supervised: list.filter((t) => done.has(t.id)).length, percent: list.length ? (100 * list.filter((t) => done.has(t.id)).length) / list.length : 0 };
}

export function SchoolCover({ school }) {
  return (
    <>
      {school.cover ? <img src={school.cover} alt="" className={styles.cardCover} /> : <span className={styles.cardPattern} />}
      <span className={styles.cardShade} />
    </>
  );
}

/** New school, or edit one: name, place and an optional cover photo. */
export function SchoolForm({ opened, school, onClose, onSaved }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [values, setValues] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const v = values || { name: school?.name || "", city: school?.city || "", province: school?.province || "", cover: school?.cover || "" };
  const set = (k) => (e) => setValues({ ...v, [k]: e.currentTarget.value });

  const close = () => {
    setValues(null);
    setError("");
    onClose();
  };
  const pick = async (file) => {
    if (!file) return;
    try {
      setValues({ ...v, cover: (await compressImage(file, COVER)).dataUrl });
    } catch {
      setError(t("errors.photo"));
    }
  };
  const save = async () => {
    if (!v.name.trim()) return setError(t("errors.name"));
    setBusy(true);
    try {
      const id = await saveSchool(user, school, { name: v.name.trim(), city: v.city.trim(), province: v.province.trim(), cover: v.cover || "" });
      close();
      onSaved?.(id);
    } catch (err) {
      console.error(err);
      setError(t("errors.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title={t(school ? "schools.edit" : "schools.new")} centered>
      <div style={{ display: "grid", gap: 12 }}>
        <TextInput label={t("schools.name")} value={v.name} onChange={set("name")} required dir="auto" data-autofocus />
        <Group grow>
          <TextInput label={t("schools.city")} value={v.city} onChange={set("city")} dir="auto" />
          <TextInput label={t("schools.province")} value={v.province} onChange={set("province")} dir="auto" />
        </Group>
        <label className={styles.ghost} style={{ justifyContent: "center" }}>
          <IconPhoto size={18} /> {v.cover ? t("schools.changeCover") : t("schools.addCover")}
          <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {v.cover && <img src={v.cover} alt="" style={{ width: "100%", borderRadius: 14, maxHeight: 180, objectFit: "cover" }} />}
        {error && <p style={{ color: "#c92a2a", margin: 0 }}>{error}</p>}
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button color="#003366" loading={busy} onClick={save}>
            {t("common.save")}
          </Button>
        </Group>
      </div>
    </Modal>
  );
}

/** Schools as cards, like Tadarus Build's projects. */
export default function SchoolsPage() {
  const { t } = useTranslation(NS);
  const { schools, teachers, sessions, loading } = useSupervisi();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (schools || []).filter((s) => !q || [s.name, s.city, s.province].some((x) => (x || "").toLowerCase().includes(q)));
  }, [schools, search]);

  if (loading) return <Loader />;

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>{t("schools.title")}</h1>
        <button type="button" className={styles.primary} onClick={() => setCreating(true)}>
          {t("schools.new")}
        </button>
      </div>
      <TextInput
        className={styles.search}
        size="lg"
        radius="xl"
        leftSection={<IconSearch size={20} />}
        placeholder={t("schools.search")}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      {shown.length === 0 ? (
        <p className={styles.empty}>{schools.length ? t("common.noMatch") : t("schools.empty")}</p>
      ) : (
        <div className={styles.cards}>
          {shown.map((school) => {
            const p = schoolProgress(school, teachers, sessions);
            return (
              <Link key={school.id} to={`${BASE}/sekolah/${school.id}`} className={styles.card}>
                <SchoolCover school={school} />
                <div className={styles.cardTop}>
                  <h2 className={styles.cardTitle} dir="auto">
                    {school.name}
                  </h2>
                  {(school.city || school.province) && (
                    <p className={styles.cardPlace} dir="auto">
                      {[school.city, school.province].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <div className={styles.cardBottom}>
                  <span className={styles.cardOpen}>
                    <span>
                      {t("schools.open")}
                      <span className={styles.cardMeta}>{t("schools.meta", { teachers: p.teachers, supervised: p.supervised })}</span>
                    </span>
                    <IconChevronRight size={18} className={styles.flip} />
                  </span>
                  <ProgressRing value={p.percent} size={110} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <SchoolForm opened={creating} onClose={() => setCreating(false)} />
    </>
  );
}
