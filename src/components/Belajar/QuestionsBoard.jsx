import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Group, Modal, NumberInput, Select, Text, Textarea } from "@mantine/core";
import {
  IconArrowDown,
  IconArrowUp,
  IconChecklist,
  IconCircleCheck,
  IconCircleDot,
  IconEye,
  IconLink,
  IconPencil,
  IconPlayerPlayFilled,
  IconPlus,
  IconSettings,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import Player from "../Guru/Player";
import Lantern from "../Guru/Lantern";
import guru from "../Guru/Guru.module.css";
import { saveSectionContent } from "./actions";
import { BASE, NS, blankQuestion, fiveTOf, hasContent, kindOf, newId, questionIssues, questionsOf, sectionTitle } from "./belajarSchema";
import QuestionEditor from "./QuestionEditor";
import styles from "./Belajar.module.css";

// the cards in "Pilih jenis soal": four with an answer key, one written task
const TYPES = [
  { type: "single", icon: IconCircleDot, group: "quiz" },
  { type: "truefalse", icon: IconCircleCheck, group: "quiz" },
  { type: "multi", icon: IconChecklist, group: "quiz" },
  { type: "match", icon: IconLink, group: "quiz" },
  { type: "task", icon: IconPencil, group: "written" },
];
const ICON = Object.fromEntries(TYPES.map((x) => [x.type, x.icon]));
const LETTER = (i) => String.fromCharCode(65 + i);

const countOf = (s) => (kindOf(s) === "written" ? (s.tasks || []).length : questionsOf(s).length);
const partsOf = (s) => (s.parts?.length ? s.parts : [{ heading: "", instructions: "", questions: [] }]);

// a question put back (edited) or added at the end of the last part
const withQuestion = (s, q) => {
  const parts = partsOf(s);
  if (parts.some((p) => (p.questions || []).some((x) => x.id === q.id))) return parts.map((p) => ({ ...p, questions: p.questions.map((x) => (x.id === q.id ? q : x)) }));
  return parts.map((p, i) => (i === parts.length - 1 ? { ...p, questions: [...(p.questions || []), q] } : p));
};
const withoutQuestion = (s, id) => partsOf(s).map((p) => ({ ...p, questions: (p.questions || []).filter((x) => x.id !== id) }));
const swap = (arr, i, d) => {
  const j = i + d;
  if (i < 0 || j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};
const movedQuestion = (s, id, d) => partsOf(s).map((p) => ({ ...p, questions: swap(p.questions || [], (p.questions || []).findIndex((x) => x.id === id), d) }));
const withTask = (s, task) => ((s.tasks || []).some((x) => x.id === task.id) ? s.tasks.map((x) => (x.id === task.id ? task : x)) : [...(s.tasks || []), task]);

/**
 * Every question of one surah on one page, grouped by section: filter by
 * section, add a question by picking its type from cards, edit one at a time
 * in a window, and try them exactly as a teacher does.
 */
export default function QuestionsBoard({ lesson, sections }) {
  const { t } = useTranslation(NS);
  const { user } = useAccess();
  const targets = sections.filter((s) => ["quiz", "written"].includes(kindOf(s)));
  const [filter, setFilter] = useState("all");
  const [picking, setPicking] = useState(null); // { sectionId }
  const [editing, setEditing] = useState(null); // { sectionId, type, item, isNew }
  const [removing, setRemoving] = useState(null); // { section, item }
  const [playing, setPlaying] = useState(null); // { section, title }
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const shown = filter === "all" ? targets : targets.filter((s) => s.id === filter);
  const total = targets.reduce((n, s) => n + countOf(s), 0);
  // written tasks play too (as a box to write in), so the preview is the whole surah
  const tasksOf = (s) => (s.tasks || []).map((x) => ({ ...x, type: "task", stem: x.prompt }));
  const allQuestions = targets.flatMap((s) => (kindOf(s) === "written" ? tasksOf(s) : questionsOf(s)));
  const sectionById = (id) => targets.find((s) => s.id === id);

  const write = async (section, data) => {
    setBusy(true);
    setFailed(false);
    try {
      await saveSectionContent(user, lesson, section, data);
      return true;
    } catch (err) {
      console.error("Could not save the section:", err);
      setFailed(true);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openPicker = (sectionId) => {
    setFailed(false);
    setPicking({ sectionId: sectionId || (filter !== "all" ? filter : targets.find((s) => kindOf(s) === "quiz")?.id || targets[0]?.id) });
  };
  const startNew = (sectionId, type) => {
    setPicking(null);
    setFailed(false);
    setEditing({ sectionId, type, isNew: true, item: type === "task" ? { id: newId(), prompt: "", lines: 3 } : blankQuestion(type) });
  };
  // the lantern at the end of a preview: lit up to the section just tried (`upTo`), or all of it
  const lanternFor = (upTo) => {
    const list = sections.filter(hasContent);
    const last = upTo ? list.findIndex((s) => s.id === upTo) : list.length - 1;
    return <Lantern items={list.map((s, i) => ({ id: s.id, t: fiveTOf(s), done: i <= last }))} fire={upTo} label={lesson.title} />;
  };
  const play = (questions, title, celebrate) => setPlaying({ section: { kind: "quiz", parts: [{ heading: "", instructions: "", questions }] }, title, celebrate });

  if (targets.length === 0) {
    return (
      <div className={styles.drop}>
        <p className={styles.pageSub}>{t("board.noSections")}</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.boardHead}>
        <button type="button" className={styles.addBig} onClick={() => openPicker()}>
          <IconPlus size={22} /> {t("board.add")}
        </button>
        <div className={styles.boardSide}>
          <span className={styles.pageSub}>{t("board.summary", { count: total, sections: targets.length })}</span>
          <Button variant="light" color="violet" radius="xl" leftSection={<IconEye size={16} />} disabled={!allQuestions.length} onClick={() => play(allQuestions, lesson.title, lanternFor())}>
            {t("board.tryAll")}
          </Button>
        </div>
      </div>

      <div className={styles.chips}>
        <span className={styles.chipsLabel}>{t("board.filter")}</span>
        <button type="button" className={`${styles.chip} ${filter === "all" ? styles.chipOn : ""}`} onClick={() => setFilter("all")}>
          {t("board.all", { count: total })}
        </button>
        {targets.map((s) => (
          <button key={s.id} type="button" className={`${styles.chip} ${filter === s.id ? styles.chipOn : ""}`} onClick={() => setFilter(s.id)}>
            <i className={styles.dot} data-t={fiveTOf(s) || "none"} />
            {sectionTitle(s, t)} ({countOf(s)})
          </button>
        ))}
      </div>

      {failed && !editing && (
        <Text c="red" size="sm" mb="sm">
          {t("access.failed")}
        </Text>
      )}

      {shown.map((s) => {
        const kind = kindOf(s);
        const tag = fiveTOf(s);
        const qs = questionsOf(s);
        return (
          <section key={s.id} className={styles.secBlock}>
            <div className={styles.secHead}>
              <span className={styles.secNo}>{targets.indexOf(s) + 1}</span>
              <div className={styles.secName}>
                {tag && (
                  <span className={styles.secTag} data-t={tag}>
                    {t(`fiveT.${tag}`)}
                  </span>
                )}
                <b>{sectionTitle(s, t)}</b>
              </div>
              <Group gap={6} ml="auto">
                {countOf(s) > 0 && (
                  <Button size="compact-sm" variant="subtle" color="violet" leftSection={<IconPlayerPlayFilled size={13} />} onClick={() => play(kind === "written" ? tasksOf(s) : qs, `${lesson.title} · ${sectionTitle(s, t)}`, lanternFor(s.id))}>
                    {t("board.trySection")}
                  </Button>
                )}
                <Button size="compact-sm" variant="subtle" color="gray" component={Link} to={`${BASE}/surat/${lesson.id}/${s.id}`} leftSection={<IconSettings size={14} />}>
                  {t("board.settings")}
                </Button>
              </Group>
            </div>

            {kind === "quiz" &&
              qs.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  n={i + 1}
                  q={q}
                  first={i === 0}
                  last={i === qs.length - 1}
                  onView={() => play([q], sectionTitle(s, t))}
                  onEdit={() => {
                    setFailed(false);
                    setEditing({ sectionId: s.id, type: q.type, item: q, isNew: false });
                  }}
                  onRemove={() => setRemoving({ section: s, item: q })}
                  onMove={(d) => write(s, { parts: movedQuestion(s, q.id, d) })}
                />
              ))}

            {kind === "written" &&
              (s.tasks || []).map((task, i) => (
                <div key={task.id} className={styles.qcard}>
                  <div className={styles.qtop}>
                    <span className={styles.qno}>#{i + 1}</span>
                    <span className={styles.qtype}>
                      <IconPencil size={14} /> {t("board.types.task.name")}
                    </span>
                    <span className={styles.qmeta}>{t("board.lines", { count: task.lines || 3 })}</span>
                    <div className={styles.qactions}>
                      <button type="button" disabled={i === 0 || busy} onClick={() => write(s, { tasks: swap(s.tasks, i, -1) })} aria-label={t("sections.up")}>
                        <IconArrowUp size={15} />
                      </button>
                      <button type="button" disabled={i === s.tasks.length - 1 || busy} onClick={() => write(s, { tasks: swap(s.tasks, i, 1) })} aria-label={t("sections.down")}>
                        <IconArrowDown size={15} />
                      </button>
                      <button type="button" onClick={() => setEditing({ sectionId: s.id, type: "task", item: task, isNew: false })}>
                        {t("board.edit")}
                      </button>
                      <button type="button" className={styles.qdel} onClick={() => setRemoving({ section: s, item: task })}>
                        {t("board.remove")}
                      </button>
                    </div>
                  </div>
                  <p className={styles.qstem} dir="auto">
                    {task.prompt}
                  </p>
                </div>
              ))}

            <button type="button" className={styles.addHere} onClick={() => openPicker(s.id)}>
              <IconPlus size={16} /> {countOf(s) ? t("board.addMore") : t("board.addHere")}
            </button>
          </section>
        );
      })}

      {/* 1. pick the type */}
      <Modal opened={!!picking} onClose={() => setPicking(null)} title={<b className={styles.modalTitle}>{t("board.pickTitle")}</b>} size="xl" centered>
        {picking && (
          <TypePicker
            targets={targets}
            sectionId={picking.sectionId}
            onSection={(id) => setPicking({ sectionId: id })}
            onPick={(type) => startNew(picking.sectionId, type)}
          />
        )}
      </Modal>

      {/* 2. fill it in */}
      <Modal
        opened={!!editing}
        onClose={() => setEditing(null)}
        title={
          editing && (
            <b className={styles.modalTitle}>
              {t(editing.isNew ? "board.newTitle" : "board.editTitle", { type: t(`board.types.${editing.type}.name`) })}
            </b>
          )
        }
        size="lg"
        centered
        closeOnClickOutside={false}
      >
        {editing && (
          <EditForm
            key={editing.item.id}
            editing={editing}
            targets={targets}
            busy={busy}
            failed={failed}
            onCancel={() => setEditing(null)}
            onSave={async (sectionId, item, more) => {
              const s = sectionById(sectionId);
              if (!s) return;
              const ok = await write(s, editing.type === "task" ? { tasks: withTask(s, item) } : { parts: withQuestion(s, item) });
              if (!ok) return;
              if (more) setEditing({ sectionId, type: editing.type, isNew: true, item: editing.type === "task" ? { id: newId(), prompt: "", lines: 3 } : blankQuestion(editing.type), saved: countOf(s) + 1 });
              else setEditing(null);
            }}
          />
        )}
      </Modal>

      {/* deleting one question or task */}
      <Modal opened={!!removing} onClose={() => setRemoving(null)} title={<b className={styles.modalTitle}>{t("board.removeTitle")}</b>} centered>
        {removing && (
          <>
            <Text mb="xs" fw={600} dir="auto">
              {removing.item.stem || removing.item.prompt || "…"}
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              {t("board.removeBody", { section: sectionTitle(removing.section, t) })}
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setRemoving(null)}>
                {t("cancel")}
              </Button>
              <Button
                color="red"
                loading={busy}
                onClick={async () => {
                  const { section, item } = removing;
                  const ok = await write(section, "prompt" in item ? { tasks: section.tasks.filter((x) => x.id !== item.id) } : { parts: withoutQuestion(section, item.id) });
                  if (ok) setRemoving(null);
                }}
              >
                {t("delete")}
              </Button>
            </Group>
          </>
        )}
      </Modal>

      {/* trying them as a teacher: the very player of /guru */}
      {playing && (
        <div className={guru.app} style={{ display: "contents" }}>
          <Player section={playing.section} title={playing.title} celebrate={playing.celebrate} onFinish={() => {}} onExit={() => setPlaying(null)} />
        </div>
      )}
    </>
  );
}

/** One question as the admin reads it: type, text, the options with the key ticked. */
function QuestionCard({ n, q, first, last, onView, onEdit, onRemove, onMove }) {
  const { t } = useTranslation(NS);
  const issues = questionIssues(q);
  const Icon = ICON[q.type] || IconCircleDot;
  return (
    <div className={`${styles.qcard} ${issues.length ? styles.qcardBad : ""}`}>
      <div className={styles.qtop}>
        <span className={styles.qno}>#{n}</span>
        <span className={styles.qtype}>
          <Icon size={14} /> {t(`qtype.${q.type}`)}
        </span>
        {issues.map((x) => (
          <Badge key={x} color="orange" variant="light" size="sm">
            {t(`issue.${x}`)}
          </Badge>
        ))}
        <div className={styles.qactions}>
          <button type="button" disabled={first} onClick={() => onMove(-1)} aria-label={t("sections.up")}>
            <IconArrowUp size={15} />
          </button>
          <button type="button" disabled={last} onClick={() => onMove(1)} aria-label={t("sections.down")}>
            <IconArrowDown size={15} />
          </button>
          <button type="button" className={styles.qview} onClick={onView} disabled={issues.length > 0}>
            <IconEye size={15} /> {t("board.view")}
          </button>
          <button type="button" onClick={onEdit}>
            {t("board.edit")}
          </button>
          <button type="button" className={styles.qdel} onClick={onRemove}>
            {t("board.remove")}
          </button>
        </div>
      </div>
      <p className={styles.qstem} dir="auto">
        {q.stem || <i className={styles.qempty}>{t("issue.noStem")}</i>}
      </p>
      <div className={styles.qopts}>
        {q.type === "match"
          ? (q.left || []).map((l, k) => (
              <span key={k} className={styles.qopt} dir="auto">
                {l || "…"} <b>→</b> {q.right?.[q.answer?.[k]] ?? "?"}
              </span>
            ))
          : (q.options || []).map((o, k) => {
              const right = (q.correct || []).includes(k);
              return (
                <span key={k} className={`${styles.qopt} ${right ? styles.qoptRight : ""}`} dir="auto">
                  {right && "✓ "}
                  {q.type === "truefalse" ? o : `${LETTER(k)}. ${o || "…"}`}
                </span>
              );
            })}
      </div>
    </div>
  );
}

/** "Pilih jenis soal": which section, then one card per type. */
function TypePicker({ targets, sectionId, onSection, onPick }) {
  const { t } = useTranslation(NS);
  const section = targets.find((s) => s.id === sectionId) || targets[0];
  const group = kindOf(section) === "written" ? "written" : "quiz";
  return (
    <>
      <Text c="dimmed" mb="md">
        {t("board.pickIntro")}
      </Text>
      <Select
        mb="lg"
        label={t("board.forSection")}
        allowDeselect={false}
        data={targets.map((s) => ({ value: s.id, label: `${sectionTitle(s, t)} · ${t(kindOf(s) === "written" ? "board.groupWritten" : "board.groupQuiz")}` }))}
        value={section.id}
        onChange={onSection}
      />
      <div className={styles.typeGroup}>
        <b>{t(group === "written" ? "board.groupWritten" : "board.groupQuiz")}</b>
      </div>
      <div className={styles.typeGrid}>
        {TYPES.filter((x) => x.group === group).map(({ type, icon: Icon }, i) => (
          <button key={type} type="button" className={styles.typeCard} onClick={() => onPick(type)}>
            <span className={styles.typeNo}>{i + 1}</span>
            <span className={styles.typeIcon}>
              <Icon size={26} />
            </span>
            <b className={styles.typeName}>{t(`board.types.${type}.name`)}</b>
            <span className={styles.typeDesc}>{t(`board.types.${type}.desc`)}</span>
            <span className={styles.typeEx} dir="auto">
              {t(`board.types.${type}.ex`)}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/** The window where one question (or written task) is typed in. */
function EditForm({ editing, targets, busy, failed, onCancel, onSave }) {
  const { t } = useTranslation(NS);
  const [item, setItem] = useState(editing.item);
  const [sectionId, setSectionId] = useState(editing.sectionId);
  const isTask = editing.type === "task";
  const choices = targets.filter((s) => (kindOf(s) === "written") === isTask);
  const issues = isTask ? (item.prompt.trim() ? [] : ["noStem"]) : questionIssues(item);

  return (
    <>
      {editing.isNew && (
        <Select
          mb="md"
          label={t("board.forSection")}
          allowDeselect={false}
          data={choices.map((s) => ({ value: s.id, label: sectionTitle(s, t) }))}
          value={sectionId}
          onChange={setSectionId}
        />
      )}
      {editing.saved && (
        <div className={styles.savedNote}>{t("board.saved", { count: editing.saved })}</div>
      )}
      {isTask ? (
        <>
          <Textarea data-autofocus autosize minRows={3} size="md" placeholder={t("board.taskPrompt")} value={item.prompt} onChange={(e) => setItem({ ...item, prompt: e.currentTarget.value })} />
          <NumberInput mt="sm" w={200} label={t("sectionPage.lines")} min={1} max={20} value={item.lines} onChange={(v) => setItem({ ...item, lines: Number(v) || 3 })} />
        </>
      ) : (
        <QuestionEditor q={item} onChange={setItem} autoFocus bare />
      )}
      {failed && (
        <Text c="red" size="sm" mt="sm">
          {t("access.failed")}
        </Text>
      )}
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onCancel}>
          {t("cancel")}
        </Button>
        {editing.isNew && (
          <Button variant="light" color="#003366" loading={busy} disabled={issues.length > 0} onClick={() => onSave(sectionId, item, true)}>
            {t("board.saveMore")}
          </Button>
        )}
        <Button color="#003366" loading={busy} disabled={issues.length > 0} onClick={() => onSave(sectionId, item, false)}>
          {t("save")}
        </Button>
      </Group>
      {issues.length > 0 && (
        <Text size="xs" c="orange.8" ta="right" mt={6}>
          {issues.map((x) => t(`issue.${x}`)).join(" · ")}
        </Text>
      )}
    </>
  );
}
