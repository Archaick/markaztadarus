import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Loader, Progress, Select, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { timeAgo } from "../Internal/timeAgo";
import { useBelajar } from "./BelajarData";
import { BASE, NS, PROGRESS, questionsOf, sectionTitle, surahState } from "./belajarSchema";
import styles from "./Belajar.module.css";

const DAY = 24 * 3600 * 1000;
const QUIET_DAYS = 7;
const millis = (v) => (v?.toMillis ? v.toMillis() : v ? new Date(v).getTime() : 0);

/** Every teacher's progress, live (admins may read all of it). */
function useAllProgress() {
  const [rows, setRows] = useState(null);
  useEffect(
    () =>
      onSnapshot(
        collection(db, PROGRESS),
        (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error("Could not load progress:", err);
          setRows([]);
        }
      ),
    []
  );
  return rows;
}

const SORTS = ["behind", "ahead", "recent", "name"];

/**
 * All teachers at a glance, across classes: who has started, how far each
 * is, their scores, who has gone quiet, and which sections are hardest.
 */
export default function ProgressPage() {
  const { t } = useTranslation(NS);
  const { loading, learners, classes, classById, lessonById, sections } = useBelajar();
  const rows = useAllProgress();
  const [classId, setClassId] = useState("all");
  const [sort, setSort] = useState("behind");

  const byLearner = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((p) => {
      if (!map.has(p.uid)) map.set(p.uid, new Map());
      map.get(p.uid).set(p.sectionId, p);
    });
    return map;
  }, [rows]);

  const report = useMemo(() => {
    if (!learners || !sections) return [];
    const now = Date.now();
    return learners
      .filter((l) => (classId === "all" ? true : (l.classIds || []).includes(classId)))
      .map((l) => {
        const myClasses = (classId === "all" ? l.classIds || [] : [classId]).map((id) => classById.get(id)).filter(Boolean);
        const lessonIds = [...new Set(myClasses.flatMap((c) => c.lessonIds || []))].filter((id) => lessonById.has(id));
        const progress = byLearner.get(l.id) || new Map();
        const per = lessonIds.map((id) => surahState(sections, id, progress));
        const done = per.reduce((n, x) => n + x.done, 0);
        const total = per.reduce((n, x) => n + x.total, 0);
        const scored = [...progress.values()].filter((p) => p.max > 0 && lessonIds.includes(p.lessonId));
        const avg = scored.length ? Math.round((scored.reduce((n, p) => n + p.best / p.max, 0) / scored.length) * 100) : null;
        const seen = millis(l.lastSeenAt);
        const quietDays = seen ? Math.floor((now - seen) / DAY) : null;
        const finished = total > 0 && done === total;
        const status = finished ? "finished" : done === 0 && !scored.length ? "notStarted" : quietDays !== null && quietDays >= QUIET_DAYS ? "quiet" : "going";
        return { learner: l, classes: myClasses, done, total, percent: total ? Math.round((done / total) * 100) : 0, avg, seen, quietDays, status };
      });
  }, [learners, sections, classId, classById, lessonById, byLearner]);

  const sorted = useMemo(() => {
    const name = (r) => r.learner.name || r.learner.email || "";
    const list = [...report];
    if (sort === "behind") list.sort((a, b) => a.percent - b.percent || a.seen - b.seen);
    if (sort === "ahead") list.sort((a, b) => b.percent - a.percent || (b.avg ?? -1) - (a.avg ?? -1));
    if (sort === "recent") list.sort((a, b) => b.seen - a.seen);
    if (sort === "name") list.sort((a, b) => name(a).localeCompare(name(b)));
    return list;
  }, [report, sort]);

  // the sections where teachers score lowest, to look at the questions or the teaching
  const hardest = useMemo(() => {
    if (!sections || !rows) return [];
    const ids = new Set(report.map((r) => r.learner.id));
    const lessons = new Set(report.flatMap((r) => r.classes.flatMap((c) => c.lessonIds || [])));
    return sections
      .filter((s) => lessons.has(s.lessonId) && questionsOf(s).length)
      .map((s) => {
        const tries = rows.filter((p) => p.sectionId === s.id && ids.has(p.uid) && p.max > 0);
        if (!tries.length) return null;
        const avg = Math.round((tries.reduce((n, p) => n + p.best / p.max, 0) / tries.length) * 100);
        const attempts = tries.reduce((n, p) => n + (p.attempts || 1), 0) / tries.length;
        return { section: s, lesson: lessonById.get(s.lessonId), avg, attempts, teachers: tries.length };
      })
      .filter(Boolean)
      .sort((a, b) => a.avg - b.avg || b.attempts - a.attempts)
      .slice(0, 5);
  }, [sections, rows, report, lessonById]);

  if (loading || rows === null || !learners) return <Loader />;

  const count = (s) => report.filter((r) => r.status === s).length;
  const scored = report.filter((r) => r.avg !== null);
  const average = scored.length ? Math.round(scored.reduce((n, r) => n + r.avg, 0) / scored.length) : null;
  const attention = report.filter((r) => r.status === "notStarted" || r.status === "quiet").sort((a, b) => a.seen - b.seen);
  const openOf = (r) => `${BASE}/kelas/${r.classes[0]?.id}?guru=${r.learner.id}`;

  const tiles = [
    { key: "teachers", value: report.length },
    { key: "started", value: report.length - count("notStarted") },
    { key: "finished", value: count("finished") },
    { key: "average", value: average === null ? "–" : `${average}%` },
    { key: "quiet", value: count("quiet"), warn: count("quiet") > 0 },
  ];

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{t("progressPage.title")}</h1>
          <p className={styles.pageSub}>{t("progressPage.sub")}</p>
        </div>
        <Select
          w={240}
          allowDeselect={false}
          value={classId}
          onChange={(v) => setClassId(v || "all")}
          data={[{ value: "all", label: t("progressPage.allClasses") }, ...(classes || []).map((c) => ({ value: c.id, label: c.name }))]}
        />
      </div>

      <div className={styles.tiles}>
        {tiles.map((x) => (
          <div key={x.key} className={`${styles.tile} ${x.warn ? styles.tileWarn : ""}`}>
            <b>{x.value}</b>
            <span>{t(`progressPage.tile.${x.key}`)}</span>
          </div>
        ))}
      </div>

      {report.length === 0 ? (
        <div className={styles.drop}>
          <p className={styles.pageSub}>{t("progressPage.none")}</p>
        </div>
      ) : (
        <>
          {attention.length > 0 && (
            <section className={styles.block}>
              <h2 className={styles.blockTitle}>{t("progressPage.attention")}</h2>
              <p className={styles.pageSub}>{t("progressPage.attentionSub", { days: QUIET_DAYS })}</p>
              <div className={styles.rows}>
                {attention.map((r) => (
                  <Link key={r.learner.id} to={openOf(r)} className={`${styles.row} ${styles.rowButton}`}>
                    <Avatar src={r.learner.photoURL} radius="xl" color="#003366">
                      {(r.learner.name || r.learner.email || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>{r.learner.name || r.learner.email}</div>
                      <div className={styles.rowSub}>
                        {r.learner.email} · {r.classes.map((c) => c.name).join(", ")}
                      </div>
                    </div>
                    <Badge color={r.status === "quiet" ? "orange" : "gray"} variant="light">
                      {r.status === "quiet" ? t("progressPage.quietFor", { count: r.quietDays }) : t("progressPage.status.notStarted")}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className={styles.block}>
            <div className={styles.blockHead}>
              <h2 className={styles.blockTitle}>{t("progressPage.everyone")}</h2>
              <Select w={210} size="xs" allowDeselect={false} value={sort} onChange={(v) => setSort(v || "behind")} data={SORTS.map((s) => ({ value: s, label: t(`progressPage.sort.${s}`) }))} />
            </div>
            <div className={styles.rows}>
              {sorted.map((r) => (
                <Link key={r.learner.id} to={openOf(r)} className={`${styles.row} ${styles.rowButton}`}>
                  <Avatar src={r.learner.photoURL} radius="xl" color="#003366">
                    {(r.learner.name || r.learner.email || "?").charAt(0).toUpperCase()}
                  </Avatar>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{r.learner.name || r.learner.email}</div>
                    <div className={styles.rowSub}>
                      {r.classes.map((c) => c.name).join(", ")} · {r.seen ? t("classes.seen", { time: timeAgo(r.seen) }) : t("progressPage.neverSeen")}
                    </div>
                  </div>
                  <Badge variant="light" color={{ finished: "teal", going: "blue", quiet: "orange", notStarted: "gray" }[r.status]} className={styles.statusBadge}>
                    {t(`progressPage.status.${r.status}`)}
                  </Badge>
                  <div className={styles.meter}>
                    <Progress value={r.percent} color={r.percent === 100 ? "teal" : "#cc9933"} radius="xl" size="md" />
                    <span>{t("classes.doneOf", { done: r.done, total: r.total })}</span>
                  </div>
                  <Badge variant="light" color={r.avg === null ? "gray" : r.avg >= 80 ? "teal" : r.avg >= 60 ? "yellow" : "orange"} w={64}>
                    {r.avg === null ? "–" : `${r.avg}%`}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>

          {hardest.length > 0 && (
            <section className={styles.block}>
              <h2 className={styles.blockTitle}>{t("progressPage.hardest")}</h2>
              <p className={styles.pageSub}>{t("progressPage.hardestSub")}</p>
              <div className={styles.rows}>
                {hardest.map((h) => (
                  <Link key={h.section.id} to={`${BASE}/surat/${h.section.lessonId}/${h.section.id}`} className={`${styles.row} ${styles.rowButton}`}>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>{sectionTitle(h.section, t)}</div>
                      <div className={styles.rowSub}>
                        {h.lesson?.title} · {t("progressPage.triedBy", { count: h.teachers })} · {t("progressPage.attempts", { count: Math.round(h.attempts * 10) / 10 })}
                      </div>
                    </div>
                    <Badge variant="light" color={h.avg >= 80 ? "teal" : h.avg >= 60 ? "yellow" : "orange"} w={64}>
                      {h.avg}%
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <Text size="xs" c="dimmed" mt="md">
            {t("progressPage.scoreNote")}
          </Text>
        </>
      )}
    </>
  );
}
