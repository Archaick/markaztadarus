import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Checkbox, Loader, Modal, Stack, Text, TextInput } from "@mantine/core";
import { IconPlus, IconUsers } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useBelajar } from "./BelajarData";
import { createClass } from "./actions";
import { BASE, NS } from "./belajarSchema";
import styles from "./Belajar.module.css";

/** The classes (Kelas): who learns which surahs. */
export default function ClassesPage() {
  const { t } = useTranslation(NS);
  const { classes, lessons, loading, learnersOf } = useBelajar();
  const [creating, setCreating] = useState(false);

  if (loading || !classes) return <Loader />;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{t("classes.title")}</h1>
          <p className={styles.pageSub}>{t("classes.intro")}</p>
        </div>
        <Button color="#003366" leftSection={<IconPlus size={18} />} onClick={() => setCreating(true)} disabled={!lessons.length}>
          {t("classes.new")}
        </Button>
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
          {classes.map((c) => (
            <Link key={c.id} to={`${BASE}/kelas/${c.id}`} className={`${styles.lessonCard} ${styles.classCard}`}>
              <span className={styles.classGlow} />
              <div className={styles.lessonTop}>
                <span className={styles.codePill}>{c.code}</span>
                {c.active === false ? <Badge color="gray">{t("classes.closed")}</Badge> : <Badge color="teal">{t("classes.open")}</Badge>}
              </div>
              <h2 className={styles.lessonTitle}>{c.name}</h2>
              <div className={styles.stats}>
                <Badge variant="light" color="#003366">
                  {t("classes.learners", { count: learnersOf(c.id).length })}
                </Badge>
                <Badge variant="light" color="#003366">
                  {t("classes.surahs", { count: (c.lessonIds || []).length })}
                </Badge>
              </div>
            </Link>
          ))}
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
  const [busy, setBusy] = useState(false);

  const close = () => {
    setName("");
    setLessonIds([]);
    onClose();
  };
  const save = async () => {
    setBusy(true);
    try {
      const id = await createClass(user, { name: name.trim().slice(0, 120), lessonIds });
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
        <Button color="#003366" onClick={save} loading={busy} disabled={!name.trim() || !lessonIds.length}>
          {t("classes.create")}
        </Button>
      </Stack>
    </Modal>
  );
}
