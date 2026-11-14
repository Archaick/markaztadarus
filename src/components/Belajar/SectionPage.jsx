import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Alert, Button, Group, Loader, Modal, Text, Textarea, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconArrowLeft, IconChevronsDown, IconChevronsUp, IconPlayerPlayFilled, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useBelajar } from "./BelajarData";
import { deleteSection, saveSectionContent } from "./actions";
import { BASE, NS, blankQuestion, cleanReading, fiveTOf, kindOf, newId, questionIssues, sectionTitle } from "./belajarSchema";
import PageEditor from "./PageEditor";
import PdfSlot from "./PdfSlot";
import { bare } from "./bareInput";
import Player from "../Guru/Player";
import guru from "../Guru/Guru.module.css";
import QuestionEditor from "./QuestionEditor";
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
  const [adding, setAdding] = useState(null); // { part, at: "top" | "end" }: where a new question goes, while its type is picked
  const [folded, setFolded] = useState(() => new Set()); // questions shown as one line
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

  const save = async () => {
    setBusy(true);
    try {
      const { reading, parts, tasks, instructions } = value;
      await saveSectionContent(user, lesson, section, {
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
                  {questionCount > 1 &&
                    (value.parts.some((x) => x.questions.some((q) => !folded.has(q.id))) ? (
                      <Button variant="subtle" color="gray" size="xs" leftSection={<IconChevronsUp size={14} />} onClick={() => setFolded(new Set(value.parts.flatMap((x) => x.questions.map((q) => q.id))))}>
                        {t("sectionPage.collapseAll")}
                      </Button>
                    ) : (
                      <Button variant="subtle" color="gray" size="xs" leftSection={<IconChevronsDown size={14} />} onClick={() => setFolded(new Set())}>
                        {t("sectionPage.expandAll")}
                      </Button>
                    ))}
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
                  {part.questions.map((q, i) => (
                    <QuestionEditor
                      key={q.id}
                      n={i + 1}
                      q={q}
                      collapsed={folded.has(q.id)}
                      onToggle={() =>
                        setFolded((f) => {
                          const next = new Set(f);
                          if (next.has(q.id)) next.delete(q.id);
                          else next.add(q.id);
                          return next;
                        })
                      }
                      onChange={(nq) => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, questions: x.questions.map((y, k) => (k === i ? nq : y)) } : x)) })}
                      onMove={(d) => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, questions: move(x.questions, i, d) } : x)) })}
                      onRemove={() => set({ parts: value.parts.map((x, j) => (j === p ? { ...x, questions: x.questions.filter((_, k) => k !== i) } : x)) })}
                    />
                  ))}
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
