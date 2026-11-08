import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Avatar, Badge, Button, CopyButton, Drawer, Group, Loader, Modal, Progress, Switch, Tabs, Text, TextInput, Textarea, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconBrandWhatsapp, IconCheck, IconCopy, IconLock, IconPencil, IconRefresh, IconTrash, IconUserMinus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { isValidEmail, normalizeEmail } from "../Internal/access";
import { timeAgo } from "../Internal/timeAgo";
import { useBelajar } from "./BelajarData";
import { deleteClass, inviteEmails, removeLearner, renewCode, saveNote, updateClass } from "./actions";
import { BASE, NS, PROGRESS, sectionTitle, surahState } from "./belajarSchema";
import { SurahPicker } from "./ClassesPage";
import { DeleteTeacher } from "./TeachersPage";
import styles from "./Belajar.module.css";

/** Every progress record of these learners, live (in groups of 30, Firestore's limit for "in"). */
function useProgressOf(uids) {
  const [rows, setRows] = useState(null);
  const key = uids.join(",");
  useEffect(() => {
    if (!uids.length) {
      setRows([]);
      return undefined;
    }
    const parts = [];
    for (let i = 0; i < uids.length; i += 30) parts.push(uids.slice(i, i + 30));
    const found = parts.map(() => []);
    const offs = parts.map((part, n) =>
      onSnapshot(
        query(collection(db, PROGRESS), where("uid", "in", part)),
        (snap) => {
          found[n] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setRows(found.flat());
        },
        (err) => {
          console.error("Could not load progress:", err);
          setRows([]);
        }
      )
    );
    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return rows;
}

/** One class: its code to share, its learners and how far each is, its surahs and invites. */
export default function ClassPage() {
  const { classId } = useParams();
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const navigate = useNavigate();
  const { loading, classById, codeById, lessonById, sections, learnersOf, invitedTo, inviteByEmail } = useBelajar();
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const klass = classById.get(classId);
  const learners = klass ? learnersOf(klass.id) : [];
  const progressRows = useProgressOf(learners.map((l) => l.id));

  const lessonsOf = useMemo(() => (klass?.lessonIds || []).map((id) => lessonById.get(id)).filter(Boolean), [klass, lessonById]);
  const byLearner = useMemo(() => {
    const map = new Map();
    (progressRows || []).forEach((p) => {
      if (!map.has(p.uid)) map.set(p.uid, new Map());
      map.get(p.uid).set(p.sectionId, p);
    });
    return map;
  }, [progressRows]);

  if (loading) return <Loader />;
  if (!klass) return <Text c="dimmed">{t("classes.missing")}</Text>;

  const link = `${window.location.origin}/guru`;
  const share = t("classes.shareText", { name: klass.name, code: klass.code, link });
  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  // each learner's position in every assigned surah
  const report = learners.map((l) => {
    const progress = byLearner.get(l.id) || new Map();
    const per = lessonsOf.map((lesson) => ({ lesson, ...surahState(sections || [], lesson.id, progress) }));
    const done = per.reduce((n, x) => n + x.done, 0);
    const total = per.reduce((n, x) => n + x.total, 0);
    const scores = [...progress.values()].filter((p) => p.max > 0);
    const avg = scores.length ? Math.round((scores.reduce((n, p) => n + p.best / p.max, 0) / scores.length) * 100) : null;
    return { learner: l, per, done, total, percent: total ? Math.round((done / total) * 100) : 0, avg, progress };
  });
  const finished = report.filter((r) => r.total && r.done === r.total).length;
  const started = report.filter((r) => r.done > 0).length;

  return (
    <>
      <Link to={`${BASE}/kelas`} className={styles.crumb}>
        <IconArrowLeft size={16} /> {t("nav.classes")}
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{klass.name}</h1>
          <p className={styles.pageSub}>{t("classes.summary", { learners: learners.length, started, finished })}</p>
        </div>
        <Group>
          <Tooltip label={t("classes.rename")}>
            <ActionIcon variant="light" color="#003366" size="lg" onClick={() => setRenaming(true)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t("classes.delete")}>
            <ActionIcon variant="light" color="red" size="lg" onClick={() => setRemoving(true)}>
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>

      <div className={styles.codeCard}>
        <div className={styles.codeMain}>
          <span className={styles.codeLabel}>{t("classes.codeLabel")}</span>
          <span className={styles.codeBig} dir="ltr">
            {klass.code}
          </span>
          <span className={styles.codeHint}>{t("classes.codeHint", { link: link.replace(/^https?:\/\//, "") })}</span>
        </div>
        <div className={styles.codeActions}>
          <CopyButton value={share}>
            {({ copied, copy }) => (
              <Button variant="white" color="#003366" leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />} onClick={copy}>
                {t(copied ? "access.copied" : "classes.copy")}
              </Button>
            )}
          </CopyButton>
          <Button component="a" href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noreferrer" color="teal" leftSection={<IconBrandWhatsapp size={16} />}>
            {t("classes.whatsapp")}
          </Button>
          <Group gap="xs">
            <Switch
              color="teal"
              checked={klass.active !== false}
              disabled={busy}
              onChange={(e) => run(() => updateClass(user, klass, { active: e.currentTarget.checked }, { active: e.currentTarget.checked }))}
              label={<span className={styles.codeSwitch}>{t("classes.acceptJoins")}</span>}
            />
            <Tooltip label={t("classes.renew")}>
              <ActionIcon variant="subtle" color="gray.0" disabled={busy} onClick={() => run(() => renewCode(user, klass, codeById.get(klass.code)))}>
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </div>
      </div>

      <Tabs defaultValue="learners" keepMounted={false} mt="lg">
        <Tabs.List mb="lg">
          <Tabs.Tab value="learners">{t("classes.tabLearners", { count: learners.length })}</Tabs.Tab>
          <Tabs.Tab value="surahs">{t("classes.tabSurahs", { count: lessonsOf.length })}</Tabs.Tab>
          <Tabs.Tab value="invites">{t("classes.tabInvites")}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="learners">
          {progressRows === null ? (
            <Loader size="sm" />
          ) : report.length === 0 ? (
            <div className={styles.drop}>
              <p className={styles.pageSub}>{t("classes.noLearners")}</p>
            </div>
          ) : (
            <div className={styles.rows}>
              {report.map((r) => (
                <button type="button" key={r.learner.id} className={`${styles.row} ${styles.rowButton}`} onClick={() => setViewing(r)}>
                  <Avatar src={r.learner.photoURL} radius="xl" color="#003366">
                    {(r.learner.name || r.learner.email).charAt(0).toUpperCase()}
                  </Avatar>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{r.learner.name || r.learner.email}</div>
                    <div className={styles.rowSub}>
                      {r.learner.lastSeenAt ? t("classes.seen", { time: timeAgo(r.learner.lastSeenAt) }) : r.learner.email}
                    </div>
                  </div>
                  <div className={styles.meter}>
                    <Progress value={r.percent} color={r.percent === 100 ? "teal" : "#cc9933"} radius="xl" size="md" />
                    <span>{t("classes.doneOf", { done: r.done, total: r.total })}</span>
                  </div>
                  <Badge variant="light" color={r.avg === null ? "gray" : r.avg >= 80 ? "teal" : r.avg >= 60 ? "yellow" : "orange"} w={64}>
                    {r.avg === null ? "–" : `${r.avg}%`}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="surahs">
          <SurahsEditor klass={klass} />
        </Tabs.Panel>

        <Tabs.Panel value="invites">
          <Invites klass={klass} invited={invitedTo(klass.id)} learners={learners} inviteByEmail={inviteByEmail} />
        </Tabs.Panel>
      </Tabs>

      <LearnerDrawer row={viewing} klass={klass} onClose={() => setViewing(null)} />

      <RenameModal opened={renaming} klass={klass} onClose={() => setRenaming(false)} />
      <Modal opened={removing} onClose={() => setRemoving(false)} title={t("classes.delete")} centered>
        <Text mb="md">{t("classes.deleteBody", { name: klass.name })}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setRemoving(false)}>
            {t("cancel")}
          </Button>
          <Button
            color="red"
            loading={busy}
            onClick={() =>
              run(async () => {
                await deleteClass(user, klass, codeById.get(klass.code));
                navigate(`${BASE}/kelas`);
              })
            }
          >
            {t("delete")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}

function RenameModal({ opened, klass, onClose }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [name, setName] = useState(klass.name);
  const [busy, setBusy] = useState(false);
  return (
    <Modal opened={opened} onClose={onClose} title={t("classes.rename")} centered>
      <TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} mb="md" />
      <Button
        fullWidth
        color="#003366"
        loading={busy}
        disabled={!name.trim()}
        onClick={async () => {
          setBusy(true);
          try {
            await updateClass(user, klass, { name: name.trim().slice(0, 120) });
            onClose();
          } finally {
            setBusy(false);
          }
        }}
      >
        {t("save")}
      </Button>
    </Modal>
  );
}

function SurahsEditor({ klass }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const value = draft || klass.lessonIds || [];
  return (
    <div className={styles.panel}>
      <Text size="sm" c="dimmed" mb="sm">
        {t("classes.surahsHint")}
      </Text>
      <SurahPicker value={value} onChange={setDraft} />
      {draft && (
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDraft(null)}>
            {t("cancel")}
          </Button>
          <Button
            color="#003366"
            loading={busy}
            disabled={!draft.length}
            onClick={async () => {
              setBusy(true);
              try {
                await updateClass(user, klass, { lessonIds: draft }, { lessons: draft.length });
                setDraft(null);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("save")}
          </Button>
        </Group>
      )}
    </div>
  );
}

function Invites({ klass, invited, learners, inviteByEmail }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const joined = new Set(learners.map((l) => l.email));
  const emails = Array.from(new Set(text.split(/[\s,;]+/).map(normalizeEmail).filter(Boolean)));
  const bad = emails.filter((e) => !isValidEmail(e));

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{t("classes.inviteTitle")}</h3>
      <Text size="sm" c="dimmed" mb="sm">
        {t("classes.inviteHint")}
      </Text>
      <Textarea autosize minRows={3} placeholder={"guru1@gmail.com\nguru2@gmail.com"} value={text} onChange={(e) => setText(e.currentTarget.value)} />
      {bad.length > 0 && (
        <Text size="xs" c="red" mt={4}>
          {t("classes.badEmails", { list: bad.join(", ") })}
        </Text>
      )}
      <Group justify="space-between" mt="sm">
        <Text size="sm" c={notice ? "teal" : "dimmed"}>
          {notice || t("classes.emailCount", { count: emails.length - bad.length })}
        </Text>
        <Button
          color="#003366"
          loading={busy}
          disabled={!emails.length || bad.length > 0}
          onClick={async () => {
            setBusy(true);
            try {
              await inviteEmails(user, klass, emails.slice(0, 200), inviteByEmail);
              setNotice(t("classes.invited", { count: emails.length }));
              setText("");
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("classes.inviteButton")}
        </Button>
      </Group>

      {invited.length > 0 && (
        <div className={styles.rows} style={{ marginTop: 16 }}>
          {invited.map((i) => (
            <div key={i.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>{i.id}</div>
              </div>
              {joined.has(i.id) ? <Badge color="teal">{t("classes.joined")}</Badge> : <Badge color="gray">{t("classes.notJoined")}</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** One learner: where they are in each surah, their scores and their written answers. */
function LearnerDrawer({ row, klass, onClose }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!row) return <Drawer opened={false} onClose={onClose} />;
  const l = row.learner;
  return (
    <Drawer opened={!!row} onClose={onClose} position="right" size="lg" title={l.name || l.email}>
      <Text size="sm" c="dimmed" mb="md">
        {l.email}
      </Text>
      {row.per.map(({ lesson, steps, percent }) => (
        <div key={lesson.id} className={styles.panel}>
          <Group justify="space-between" mb="xs">
            <Text fw={800}>{lesson.title}</Text>
            <Badge color={percent === 100 ? "teal" : "gray"} variant="light">
              {percent}%
            </Badge>
          </Group>
          {steps.map(({ section, progress, state }) => (
            <div key={section.id} className={styles.stepRow}>
              <span className={`${styles.stepDot} ${styles[`step_${state}`]}`}>{state === "done" ? <IconCheck size={12} /> : state === "locked" ? <IconLock size={11} /> : null}</span>
              <span className={styles.stepName}>{sectionTitle(section, t)}</span>
              {progress?.max > 0 && (
                <span className={styles.stepScore}>
                  {progress.best}/{progress.max}
                </span>
              )}
              {progress?.attempts > 1 && <span className={styles.stepTries}>×{progress.attempts}</span>}
              {progress?.answers && Object.keys(progress.answers).length > 0 && <WrittenAnswers section={section} progress={progress} learner={l} user={user} />}
            </div>
          ))}
        </div>
      ))}
      <Group mt="md" gap="xs">
        <Button variant="subtle" color="red" leftSection={<IconUserMinus size={16} />} onClick={() => setConfirm(true)}>
          {t("classes.removeLearner")}
        </Button>
        <Button variant="light" color="red" leftSection={<IconTrash size={16} />} onClick={() => setDeleting(l)}>
          {t("teachers.delete")}
        </Button>
      </Group>
      <DeleteTeacher learner={deleting} onClose={() => setDeleting(null)} onDone={onClose} />
      <Modal opened={confirm} onClose={() => setConfirm(false)} title={t("classes.removeLearner")} centered>
        <Text mb="md">{t("classes.removeLearnerBody", { name: l.name || l.email, klass: klass.name })}</Text>
        <Button
          fullWidth
          color="red"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await removeLearner(user, klass, l);
              setConfirm(false);
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("classes.removeLearner")}
        </Button>
      </Modal>
    </Drawer>
  );
}

function WrittenAnswers({ section, progress, learner, user }) {
  const { t } = useTranslation(NS);
  const [note, setNote] = useState(progress.note || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className={styles.answers}>
      {(section.tasks || []).map((task, i) =>
        progress.answers[task.id] ? (
          <div key={task.id} className={styles.answer}>
            <Text size="xs" fw={700} c="dimmed">
              {t("sectionPage.task", { n: i + 1 })}
            </Text>
            <Text size="sm" mb={4} style={{ whiteSpace: "pre-line" }} dir="auto">
              {task.prompt}
            </Text>
            <Text size="sm" className={styles.answerText} dir="auto">
              {progress.answers[task.id]}
            </Text>
          </div>
        ) : null
      )}
      <Textarea size="xs" autosize minRows={2} label={t("classes.note")} placeholder={t("classes.notePlaceholder")} value={note} onChange={(e) => (setNote(e.currentTarget.value), setSaved(false))} />
      <Group justify="flex-end" mt={6}>
        {saved && (
          <Text size="xs" c="teal">
            {t("classes.noteSaved")}
          </Text>
        )}
        <Button
          size="xs"
          color="#003366"
          loading={busy}
          disabled={note === (progress.note || "")}
          onClick={async () => {
            setBusy(true);
            try {
              await saveNote(user, progress, note, `${learner.name || learner.email} · ${sectionTitle(section, t)}`);
              setSaved(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("classes.saveNote")}
        </Button>
      </Group>
    </div>
  );
}
