import { Suspense, lazy, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Badge, Button, Checkbox, Group, Loader, Modal, Stack, Text, TextInput } from "@mantine/core";
import { IconChevronRight, IconMapPin, IconPlus, IconUsers } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useBelajar } from "./BelajarData";
import { createClass } from "./actions";
import { BASE, NS } from "./belajarSchema";
import SchoolScene from "../Supervisi/SchoolScene";
import styles from "./Belajar.module.css";

// the school's pin on Tadarus Global (loaded only when the form opens: the globe is heavy)
const SchoolLocation = lazy(() => import("./SchoolLocation"));

// a pinned school's place on its card: city and province, or the country's name
const placeOf = (loc, lang) => {
  const local = [loc.city, loc.province].filter(Boolean).join(", ");
  if (local) return local;
  try {
    return new Intl.DisplayNames([lang], { type: "region" }).of(loc.country) || loc.country;
  } catch {
    return loc.country;
  }
};

/** The classes (Kelas): who learns which surahs. */
export default function ClassesPage() {
  const { t, i18n } = useTranslation(NS);
  const { classes, lessons, loading, learners, learnersOf, pendingOf } = useBelajar();
  const [creating, setCreating] = useState(false);

  if (loading || !classes) return <Loader />;
  // teachers in no school (taken out, or declined): only the all-teachers list shows them
  const schoolIds = new Set(classes.map((c) => c.id));
  const loose = (learners || []).filter((l) => !(l.classIds || []).some((id) => schoolIds.has(id)) && !pendingOf().includes(l)).length;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{t("classes.title")}</h1>
          <p className={styles.pageSub}>{t("classes.intro")}</p>
        </div>
        <Group gap="xs">
          <Button component={Link} to={`${BASE}/guru`} variant="subtle" color="#003366" leftSection={<IconUsers size={18} />}>
            {t("classes.allTeachers", { count: (learners || []).length })}
            {loose > 0 && <span className={styles.looseCount}>{t("classes.noSchool", { count: loose })}</span>}
          </Button>
          <Button color="#003366" leftSection={<IconPlus size={18} />} onClick={() => setCreating(true)} disabled={!lessons.length}>
            {t("classes.new")}
          </Button>
        </Group>
      </div>

      {classes.length === 0 ? (
        <div className={styles.drop}>
          <IconUsers size={38} color="#1a4970" />
          <p className={styles.pageSub}>{t(lessons.length ? "classes.empty" : "classes.needLesson")}</p>
          {lessons.length > 0 && (
            <Button color="#003366" leftSection={<IconPlus size={18} />} onClick={() => setCreating(true)}>
              {t("classes.new")}
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {classes.map((c) => {
            const waiting = pendingOf(c.id);
            return (
            <Link key={c.id} to={`${BASE}/kelas/${c.id}`} className={`${styles.lessonCard} ${styles.classCard} ${styles.schoolCard} ${waiting.length ? styles.schoolCardWaiting : ""}`}>
              <span className={styles.schoolCover} aria-hidden="true">
                <SchoolScene id={c.id} scene={c.scene} />
              </span>
              <div className={styles.lessonTop}>
                <span className={styles.codePill}>{c.code}</span>
                {c.active === false ? <Badge color="gray">{t("classes.closed")}</Badge> : <Badge color="teal">{t("classes.open")}</Badge>}
              </div>
              <h2 className={styles.lessonTitle}>{c.name}</h2>
              {c.location && <span className={styles.cardPlace}><IconMapPin size={15} />{placeOf(c.location, i18n.language)}</span>}
              <div className={styles.stats}>
                <Badge variant="light" color="#003366">
                  {t("classes.learners", { count: learnersOf(c.id).length })}
                </Badge>
                <Badge variant="light" color="#003366">
                  {t("classes.surahs", { count: (c.lessonIds || []).length })}
                </Badge>
              </div>
              {/* teachers who entered the code and wait to be accepted: opens the school on its requests */}
              {waiting.length > 0 && (
                <div className={styles.waitStrip}>
                  <Avatar.Group spacing="sm">
                    {waiting.slice(0, 3).map((l) => (
                      <Avatar key={l.id} src={l.photoURL} size={30} radius="xl" color="orange">
                        {(l.name || l.email || "?").charAt(0).toUpperCase()}
                      </Avatar>
                    ))}
                    {waiting.length > 3 && (
                      <Avatar size={30} radius="xl" color="orange">
                        +{waiting.length - 3}
                      </Avatar>
                    )}
                  </Avatar.Group>
                  <span>{t("classes.waitingCard", { count: waiting.length })}</span>
                  <IconChevronRight size={18} />
                </div>
              )}
            </Link>
            );
          })}
        </div>
      )}

      <ClassForm opened={creating} onClose={() => setCreating(false)} />
    </>
  );
}

/** Pick surahs, in the book's order. */
export function SurahPicker({ value, onChange }) {
  const { lessons } = useBelajar();
  const set = new Set(value);
  return (
    <div className={styles.pickList}>
      {lessons.map((l) => (
        <label key={l.id} className={`${styles.pickItem} ${set.has(l.id) ? styles.pickOn : ""}`}>
          <Checkbox
            color="#003366"
            checked={set.has(l.id)}
            onChange={() => onChange(set.has(l.id) ? value.filter((x) => x !== l.id) : lessons.filter((x) => set.has(x.id) || x.id === l.id).map((x) => x.id))}
          />
          <span className={styles.pickName}>{l.title}</span>
          {l.titleAr && <span className={styles.pickAr}>{l.titleAr}</span>}
          {!l.published && (
            <Text size="xs" c="orange">
              •
            </Text>
          )}
        </label>
      ))}
    </div>
  );
}

function ClassForm({ opened, onClose }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [lessonIds, setLessonIds] = useState([]);
  const [location, setLocation] = useState(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setName("");
    setLessonIds([]);
    setLocation(null);
    onClose();
  };
  const save = async () => {
    setBusy(true);
    try {
      const id = await createClass(user, { name: name.trim().slice(0, 120), lessonIds, location });
      close();
      navigate(`${BASE}/kelas/${id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title={t("classes.new")} centered size="lg">
      <Stack>
        <TextInput label={t("classes.name")} placeholder={t("classes.namePlaceholder")} value={name} onChange={(e) => setName(e.currentTarget.value)} data-autofocus />
        <div>
          <Text fw={600} size="sm" mb={6}>
            {t("classes.pickSurahs")}
          </Text>
          <SurahPicker value={lessonIds} onChange={setLessonIds} />
          <Text size="xs" c="dimmed" mt={6}>
            {t("classes.unpublishedHint")}
          </Text>
        </div>
        {opened && (
          <Suspense fallback={<Loader size="sm" />}>
            <SchoolLocation value={location} onChange={setLocation} />
          </Suspense>
        )}
        <Button color="#003366" onClick={save} loading={busy} disabled={!name.trim() || !lessonIds.length}>
          {t("classes.create")}
        </Button>
      </Stack>
    </Modal>
  );
}
