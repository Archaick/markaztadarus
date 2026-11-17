import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Alert, Button, Group, Loader, Modal, SegmentedControl, Select, Text, Textarea, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconArrowLeft, IconCheck, IconChevronsUp, IconEye, IconHeadphones, IconPlayerPlayFilled, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useBelajar } from "./BelajarData";
import { deleteSection, saveSectionContent } from "./actions";
import { BASE, NS, blankQuestion, cleanReading, fiveTOf, isTilawah, kindOf, newId, questionIssues, sectionTitle } from "./belajarSchema";
import PageEditor from "./PageEditor";
import PdfSlot from "./PdfSlot";
import { bare } from "./bareInput";
import Player from "../Guru/Player";
import RecitationPanel from "../Guru/Recitation";
import { DEFAULT_RECITER, RECITERS, knownReciter } from "../Guru/quranApi";
import guru from "../Guru/Guru.module.css";
import QuestionEditor from "./QuestionEditor";
import { QuestionCard } from "./QuestionsBoard";
import { TypeCards } from "./QuestionTypes";
import styles from "./Belajar.module.css";

const blankOf = (kind) => ({ kind, reading: [], parts: kind === "quiz" ? [{ heading: "", instructions: "", questions: [] }] : [], tasks: [], instructions: "" });

const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

/** One section of a surah: its text to read, question parts and written tasks. */
export default function SectionPage() {
  const { lessonId, sectionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(NS);
  // the teacher's own words, for the parts of their page shown while editing
  const { t: tg } = useTranslation("guru/Guru");
  const { user, isSuperAdmin } = useAccess();
  const { loading, lessonById, sectionsOf } = useBelajar();
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reciteView, setReciteView] = useState("editor");
  const [adding, setAdding] = useState(null); // { part, at: "top" | "end" }: where a new question goes, while its type is picked
  // questions open in their editor; the others show as a card with the answer key, as on the questions board
  const [open, setOpen] = useState(() => new Set());
  const [single, setSingle] = useState(null); // one question played as the teacher sees it
  const [dropping, setDropping] = useState(null); // { part, i }: a question about to be deleted
  const toggleOpen = (id, on) =>
    setOpen((o) => {
      const next = new Set(o);
      if (on ?? !next.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });
  const [fresh, setFresh] = useState(null); // the question just added: brought into view and focused

  // a new question: scroll to it and put the cursor in its first field
  useEffect(() => {
    if (!fresh) return undefined;
    const id = requestAnimationFrame(() => {
      const box = document.querySelector(`[data-qid="${fresh}"]`);
      if (!box) return;
      const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      box.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
      box.querySelector("textarea, input:not([readonly]):not([type=hidden])")?.focus({ preventScroll: true });
      setFresh(null);
    });
    return () => cancelAnimationFrame(id);
  }, [fresh]);

  if (loading) return <Loader />;
  const lesson = lessonById.get(lessonId);
  // the address names the section (older links named its standard key)
  const section = lesson ? sectionsOf(lesson.id).find((s) => s.id === sectionId) || sectionsOf(lesson.id).find((s) => s.key === sectionId) : null;
  if (!lesson || !section) return <Text c="dimmed">{t("lesson.missing")}</Text>;
  const kind = kindOf(section);
  const tag = fiveTOf(section);
  const name = sectionTitle(section, t);
  const stored = { ...blankOf(kind), ...section };
  // always at least one group, or a question section would have nowhere to add to
  if (kind === "quiz" && !stored.parts?.length) stored.parts = [{ heading: "", instructions: "", questions: [] }];
  const value = draft || stored;
  const set = (patch) => setDraft({ ...value, ...patch });
  const bad = (value.parts || []).flatMap((p) => p.questions).filter((q) => questionIssues(q).length).length;
  const questionCount = (value.parts || []).reduce((n, p) => n + (p.questions || []).length, 0);
  const tilawah = isTilawah(section);
  const surahNo = Number(lesson.surah) || 0;
  const reciter = knownReciter(value.reciter) || DEFAULT_RECITER;

  const save = async () => {
    setBusy(true);
    try {
      const { reading, parts, tasks, instructions } = value;
      await saveSectionContent(user, lesson, section, {
        // a Tilawah item's default reciter (a teacher's own choice on their device wins over it)
        ...(tilawah && "reciter" in value && { reciter: knownReciter(value.reciter) || "" }),
        instructions,
        reading: cleanReading(reading),
        parts,
        tasks: tasks.filter((x) => x.prompt.trim()),
      });
      setDraft(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to={`${BASE}/surat/${lesson.id}`} className={styles.crumb}>
        <IconArrowLeft size={16} /> {lesson.title}
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{name}</h1>
          <p className={styles.pageSub}>
            {t(`kind.${kind}`)}
            {tag && (
              <>
                {" "}
                · <span className={styles.tag}>{t(`fiveT.${tag}`)}</span>
              </>
            )}
          </p>
        </div>
        <Group>
          {section && isSuperAdmin && (
            <Tooltip label={t("sectionPage.delete")}>
              <ActionIcon variant="light" color="red" size="lg" onClick={() => setRemoving(true)}>
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </div>

      <>
          {bad > 0 && (
            <Alert color="orange" icon={<IconAlertTriangle size={18} />} mb="md">
              {t("sectionPage.bad", { count: bad })}
            </Alert>
          )}

          {/* the material: just the PDF here; teachers read it in "Try them all as a teacher" */}
          {/* only material (reading) items carry a PDF; a question item that still holds one from
              before can only have it removed (it belongs in the surah's material item) */}
          {(kind === "reading" || section.pdf?.url) && (
            <>
              <h3 className={styles.canvasQuestions}>{t("pdf.heading")}</h3>
              {kind !== "reading" && <Alert color="orange" mb="sm">{t("pdf.notHere")}</Alert>}
              <PdfSlot lesson={lesson} section={section} />
            </>
          )}
          {!section.pdf?.url && cleanReading(value.reading).length > 0 && (
            <>
              <p className={styles.canvasLabel}>{t("pdf.oldText")}</p>
              <PageEditor value={value.reading} onChange={(reading) => set({ reading })} />
            </>
          )}

          {/* Tilawah: the surah read aloud; teachers see every ayah with its own play button */}
          {tilawah && (
            <>
              <h3 className={styles.canvasQuestions}>
                <IconHeadphones size={18} style={{ verticalAlign: "-3px" }} /> {t("recite.heading")}
              </h3>
              {surahNo ? (
                <div className={styles.panel}>
                  <div className={styles.reciteBar}>
                    <Select
                      label={t("recite.reciter")}
                      description={t("recite.reciterHint")}
                      allowDeselect={false}
                      maw={360}
                      style={{ flex: 1 }}
                      data={RECITERS.map((r) => ({ value: r.id, label: tg(`recite.reciter.${r.key}`) }))}
                      value={reciter}
                      onChange={(v) => set({ reciter: v })}
                    />
                    {/* the editor's short box, or the whole panel exactly as a teacher sees it */}
                    <SegmentedControl
                      value={reciteView}
                      onChange={setReciteView}
                      color="#003366"
                      data={[
                        { value: "editor", label: t("recite.viewEditor") },
                        { value: "teacher", label: t("recite.viewTeacher") },
                      ]}
                    />
                  </div>
                  {reciteView === "teacher" ? (
                    <div className={`${guru.app} ${styles.teacherView}`}>
                      <RecitationPanel key={`t-${reciter}`} surah={surahNo} itemReciter={reciter} />
                    </div>
                  ) : (
                    <RecitationPanel key={reciter} surah={surahNo} reciter={reciter} compact />
                  )}
                  <Text size="sm" c="dimmed" mt="sm">
                    {t("recite.note")}
                  </Text>
                </div>
              ) : (
                <Alert color="orange" icon={<IconAlertTriangle size={18} />} mb="md">
                  {t("recite.noSurah")}{" "}
                  <Link to={`${BASE}/surat/${lesson.id}`}>{t("recite.openSurah")}</Link>
                </Alert>
              )}
            </>
          )}

          {kind === "written" && (
            <div className={`${guru.app} ${styles.canvas}`}>
              <main className={guru.page}>
                <>
                  <p className={`${guru.instructions} ${styles.canvasLine}`}>
                    <Textarea variant="unstyled" autosize minRows={1} styles={bare} placeholder={t("sectionPage.instructions")} value={value.instructions} onChange={(e) => set({ instructions: e.currentTarget.value })} />
                  </p>
                  {value.tasks.map((task, i) => (
                    <div key={task.id} className={`${guru.glassCard} ${guru.task} ${styles.canvasTask}`}>
                      <Group justify="space-between" wrap="nowrap">
                        <span className={guru.kicker}>{tg("view.task", { n: i + 1 })}</span>
                        <ActionIcon size="sm" variant="subtle" color="red" onClick={() => set({ tasks: value.tasks.filter((_, j) => j !== i) })} aria-label={t("delete")}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                      <div className={`${guru.taskPrompt} ${styles.canvasLine}`}>
                        <Textarea variant="unstyled" autosize minRows={1} styles={bare} placeholder={t("pageEditor.task")} value={task.prompt} onChange={(e) => set({ tasks: value.tasks.map((x, j) => (j === i ? { ...x, prompt: e.currentTarget.value } : x)) })} />
                      </div>
                      <textarea className={guru.textarea} rows={Math.max(3, task.lines || 3)} placeholder={tg("view.writeHere")} disabled />
                    </div>
                  ))}
                  <Button variant="light" color="#003366" leftSection={<IconPlus size={14} />} onClick={() => set({ tasks: [...value.tasks, { id: newId(), prompt: "", lines: 3 }] })}>
                    {t("sectionPage.addTask")}
                  </Button>
                </>
              </main>
            </div>
          )}

          {kind === "quiz" && (
            <>
              {/* stays at the top while the questions scroll, so adding one never means scrolling to the end */}
              <div className={styles.qHead}>
                <h3 className={styles.canvasQuestions}>{t("lesson.tabQuestions", { count: questionCount })}</h3>
                <Group gap={6} wrap="wrap" justify="flex-end">
                  {open.size > 1 && (
                    <Button variant="subtle" color="gray" size="xs" leftSection={<IconChevronsUp size={14} />} onClick={() => setOpen(new Set())}>
                      {t("sectionPage.collapseAll")}
                    </Button>
                  )}
                  <Button color="#003366" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setAdding({ part: 0, at: "top" })}>
                    {t("board.add")}
                  </Button>
                  {questionCount > 0 && (
                    <Button variant="light" color="#003366" size="xs" leftSection={<IconPlayerPlayFilled size={14} />} onClick={() => setPlaying(true)}>
                      {t("board.trySection")}
                    </Button>
                  )}
                </Group>
              </div>
              {value.parts.map((part, p) => (
                <div key={p} className={styles.panel}>
                  <div className={styles.qList}>
                  {part.questions.map((q, i) => {
                    const moveIt = (d) => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, questions: move(x.questions, i, d) } : x)) });
                    return open.has(q.id) ? (
                      <div key={q.id} data-qid={q.id} className={styles.qEditing}>
                        <QuestionEditor
                          n={i + 1}
                          q={q}
                          surah={surahNo}
                          onToggle={() => toggleOpen(q.id, false)}
                          onChange={(nq) => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, questions: x.questions.map((y, k) => (k === i ? nq : y)) } : x)) })}
                          onMove={moveIt}
                          onRemove={() => setDropping({ part: p, i })}
                        />
                        <Group justify="flex-end" mt="sm" gap="xs">
                          <Button size="xs" variant="subtle" color="violet" leftSection={<IconEye size={14} />} disabled={questionIssues(q).length > 0} onClick={() => setSingle(q)}>
                            {t("board.view")}
                          </Button>
                          <Button size="xs" color="#003366" leftSection={<IconCheck size={14} />} onClick={() => toggleOpen(q.id, false)}>
                            {t("sectionPage.doneEditing")}
                          </Button>
                        </Group>
                      </div>
                    ) : (
                      <div key={q.id} data-qid={q.id}>
                        <QuestionCard
                          n={i + 1}
                          q={q}
                          first={i === 0}
                          last={i === part.questions.length - 1}
                          onMove={moveIt}
                          onView={() => setSingle(q)}
                          onEdit={() => toggleOpen(q.id, true)}
                          onRemove={() => setDropping({ part: p, i })}
                        />
                      </div>
                    );
                  })}
                  </div>
                  <Group mt="md" gap="xs">
                    <Button size="xs" variant="light" color="#003366" leftSection={<IconPlus size={14} />} onClick={() => setAdding({ part: p, at: "end" })}>
                      {t("board.add")}
                    </Button>
                  </Group>
                </div>
              ))}
            </>
          )}
        </>

      {/* one question, played as the teacher plays it */}
      {single && (
        <div className={guru.app} style={{ display: "contents" }}>
          <Player section={{ kind: "quiz", parts: [{ heading: "", instructions: "", questions: [single] }] }} title={`${lesson.title} · ${name}`} onFinish={() => {}} onExit={() => setSingle(null)} preview />
        </div>
      )}

      {/* deleting a question: it goes when the section is saved (Cancel brings it back) */}
      <Modal opened={dropping !== null} onClose={() => setDropping(null)} title={t("board.removeTitle")} centered>
        <Text mb="md">{t("sectionPage.removeQuestionBody")}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDropping(null)}>
            {t("cancel")}
          </Button>
          <Button
            color="red"
            onClick={() => {
              const { part: dp, i: di } = dropping;
              set({ parts: value.parts.map((x, j) => (j === dp ? { ...x, questions: x.questions.filter((_, k) => k !== di) } : x)) });
              setDropping(null);
            }}
          >
            {t("board.remove")}
          </Button>
        </Group>
      </Modal>

      {/* the questions, played as the teacher plays them, with the answer key marked for the admin */}
      {playing && (
        <div className={guru.app} style={{ display: "contents" }}>
          <Player section={value} title={`${lesson.title} · ${name}`} onFinish={() => {}} onExit={() => setPlaying(false)} preview />
        </div>
      )}

      {draft && (
        <div className={styles.sticky}>
          <Button variant="default" onClick={() => setDraft(null)}>
            {t("cancel")}
          </Button>
          <Button color="#003366" loading={busy} onClick={save}>
            {t("save")}
          </Button>
        </div>
      )}

      {/* a new question: its type picked from the same cards as on the questions board */}
      <Modal opened={adding !== null} onClose={() => setAdding(null)} title={<b className={styles.modalTitle}>{t("board.pickTitle")}</b>} size="xl" centered>
        <TypeCards
          onPick={(qt) => {
            const nq = blankQuestion(qt);
            set({ parts: value.parts.map((x, j) => (j === adding.part ? { ...x, questions: adding.at === "top" ? [nq, ...x.questions] : [...x.questions, nq] } : x)) });
            setAdding(null);
            toggleOpen(nq.id, true);
            setFresh(nq.id);
          }}
        />
      </Modal>

      <Modal opened={removing} onClose={() => setRemoving(false)} title={t("sectionPage.delete")} centered>
        <Text mb="md">{t("sectionPage.deleteBody")}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setRemoving(false)}>
            {t("cancel")}
          </Button>
          <Button
            color="red"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await deleteSection(user, lesson, section);
                navigate(`${BASE}/surat/${lesson.id}`);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("delete")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
