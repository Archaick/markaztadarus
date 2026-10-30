import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconBrandWhatsapp,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconFileSpreadsheet,
  IconInbox,
  IconPrinter,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { auditedWrite } from "../Internal/audit";
import { formatDateTime, timeAgo } from "../Internal/timeAgo";
import portal from "../Internal/InternalPortal.module.css";
import styles from "./Forms.module.css";
import PrintResponse from "./PrintResponse";
import { plainText } from "./richText";
import { downloadBlob, rowsToXlsx } from "./xlsx";
import {
  FORMS_COLLECTION,
  HAS_OPTIONS,
  RESPONSES,
  displayAnswer,
  downloadText,
  responsesToCsv,
  responsesToRows,
  gradeResponse,
  questionsOf,
  quizOf,
  whatsappNumber,
} from "./formSchema";

const MAX_RESPONSES = 2000;

export default function ResponsesPanel({ form, quizKey }) {
  const { t } = useTranslation("internal/Forms");
  const { user } = useAccess();
  // questions only: section cards hold no answers
  const fields = useMemo(() => questionsOf(form.fields || []), [form.fields]);
  const [responses, setResponses] = useState(null);
  const [error, setError] = useState(""); // a responses.<key>
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(-1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(
    () =>
      onSnapshot(
        query(
          collection(db, FORMS_COLLECTION, form.id, RESPONSES),
          orderBy("submittedAt", "desc"),
          limit(MAX_RESPONSES)
        ),
        (snap) => {
          setResponses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setError("");
        },
        (err) => {
          console.error("Could not load responses:", err);
          setError("loadFailed");
          setResponses([]);
        }
      ),
    [form.id]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!responses || !term) return responses || [];
    return responses.filter((r) =>
      Object.values(r.answers || {}).some((v) => displayAnswer(v).toLowerCase().includes(term))
    );
  }, [responses, search]);

  // The first two text-like questions make a good title and subtitle per row.
  const [primary, secondary] = useMemo(
    () => fields.filter((f) => !HAS_OPTIONS.has(f.type)).slice(0, 2),
    [fields]
  );

  const summaries = useMemo(
    () =>
      fields
        .filter((f) => HAS_OPTIONS.has(f.type))
        .map((f) => {
          const counts = Object.fromEntries((f.options || []).map((o) => [o, 0]));
          let answered = 0;
          (responses || []).forEach((r) => {
            const value = r.answers?.[f.id];
            const picked = Array.isArray(value) ? value : value ? [value] : [];
            if (picked.length) answered += 1;
            picked.forEach((p) => {
              counts[p] = (counts[p] || 0) + 1;
            });
          });
          return { field: f, counts, answered };
        }),
    [fields, responses]
  );

  const open = openIndex >= 0 ? filtered[openIndex] : null;

  // a quiz: every response's score (hand grades win over the key), and the average
  const quiz = quizOf(form);
  const allFields = useMemo(() => form.fields || [], [form.fields]);
  const gradeOf = (r) => gradeResponse(allFields, quizKey || {}, r.answers || {}, r.grades || {});
  const quizStats = useMemo(() => {
    if (!quiz.enabled || !responses?.length) return null;
    const grades = responses.map((r) => gradeResponse(allFields, quizKey || {}, r.answers || {}, r.grades || {}));
    const max = grades[0]?.max || 0;
    const average = grades.reduce((a, g) => a + g.score, 0) / grades.length;
    return { max, average, toReview: grades.filter((g) => g.pending > 0).length };
  }, [quiz.enabled, responses, allFields, quizKey]);

  // points given by hand to one response, saved together
  const [handGrades, setHandGrades] = useState({});
  const [savingGrades, setSavingGrades] = useState(false);
  useEffect(() => setHandGrades(open?.grades || {}), [open?.id, open?.grades]);
  const saveGrades = async () => {
    if (!open) return;
    setSavingGrades(true);
    try {
      const grades = Object.fromEntries(Object.entries(handGrades).filter(([, v]) => v !== "" && v !== null && v !== undefined).map(([k, v]) => [k, Number(v)]));
      await auditedWrite(
        user,
        { area: "forms", action: "responses.grade", target: form.id, label: form.title, details: { response: open.id, graded: Object.keys(grades).length } },
        (batch, auditId) => batch.update(doc(db, FORMS_COLLECTION, form.id, RESPONSES, open.id), { grades, auditId })
      );
    } catch (err) {
      console.error("Could not save the grades:", err);
    } finally {
      setSavingGrades(false);
    }
  };

  const exportLabels = () => ({
    submitted: t("responses.csvSubmitted"),
    removed: (id) => t("responses.csvRemoved", { id }),
    ...(quiz.enabled ? { score: t("quiz.scoreColumn"), scoreOf: (r) => { const g = gradeOf(r); return `${g.score}/${g.max}`; } } : {}),
  });
  const exportName = (ext) => `${form.id}-responses-${new Date().toISOString().slice(0, 10)}.${ext}`;

  // Excel: a real .xlsx, so the columns are right whatever the computer's region
  const [exporting, setExporting] = useState(false);
  const exportXlsx = async () => {
    setExporting(true);
    try {
      const rows = responsesToRows(fields, responses || [], formatDateTime, exportLabels());
      downloadBlob(exportName("xlsx"), await rowsToXlsx(rows, form.title || form.id));
    } catch (err) {
      console.error("Could not make the Excel file:", err);
    } finally {
      setExporting(false);
    }
  };

  // CSV: for Google Sheets and other tools
  const exportCsv = () => downloadText(exportName("csv"), responsesToCsv(fields, responses || [], formatDateTime, exportLabels()));

  const deleteOpen = async () => {
    if (!open) return;
    setDeleting(true);
    try {
      await auditedWrite(
        user,
        { area: "forms", action: "response.delete", target: form.id, label: form.title, details: { response: open.id } },
        (batch, _auditId, markDelete) => {
          batch.delete(doc(db, FORMS_COLLECTION, form.id, RESPONSES, open.id));
          markDelete(`forms~${form.id}~responses~${open.id}`, open.auditId);
        }
      );
      setConfirmDelete(false);
      setOpenIndex(-1);
    } catch (err) {
      console.error("Could not delete response:", err);
      setError("deleteFailed");
    } finally {
      setDeleting(false);
    }
  };

  if (responses === null) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" />
      </Group>
    );
  }

  return (
    <div>
      <div className={styles.statRow}>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>{responses.length}</span>
          <span className={styles.statLabel}>{t("responses.count")}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>{responses[0] ? timeAgo(responses[0].submittedAt) : "—"}</span>
          <span className={styles.statLabel}>{t("responses.latest")}</span>
        </div>
        <Group gap="xs" className={styles.exportButton}>
          <Button
            variant="light"
            color="teal"
            leftSection={<IconFileSpreadsheet size={16} />}
            onClick={exportXlsx}
            loading={exporting}
            disabled={responses.length === 0}
          >
            {t("responses.exportExcel")}
          </Button>
          <Button variant="subtle" color="gray" leftSection={<IconDownload size={16} />} onClick={exportCsv} disabled={responses.length === 0}>
            CSV
          </Button>
        </Group>
      </div>

      {error && (
        <Alert color="red" mt="sm">
          {t(`responses.${error}`)}
        </Alert>
      )}

      {responses.length >= MAX_RESPONSES && (
        <Alert color="yellow" mt="sm">
          {t("responses.limit", { max: MAX_RESPONSES })}
        </Alert>
      )}

      {quizStats && (
        <div className={styles.quizStats}>
          <div>
            <b>
              {Math.round(quizStats.average * 10) / 10} / {quizStats.max}
            </b>
            <span>{t("quiz.average")}</span>
          </div>
          <div>
            <b>{responses.length}</b>
            <span>{t("quiz.graded")}</span>
          </div>
          {quizStats.toReview > 0 && (
            <div className={styles.quizStatsWarn}>
              <b>{quizStats.toReview}</b>
              <span>{t("quiz.toReview")}</span>
            </div>
          )}
        </div>
      )}

      {summaries.length > 0 && responses.length > 0 && (
        <div className={styles.summaryGrid}>
          {summaries.map(({ field, counts, answered }) => (
            <div className={styles.summaryCard} key={field.id}>
              <p className={styles.summaryQuestion}>{plainText(field.label)}</p>
              {Object.entries(counts).map(([option, count]) => {
                const pct = answered ? Math.round((count / answered) * 100) : 0;
                return (
                  <div className={styles.barRow} key={option}>
                    <div className={styles.barLabel}>
                      <span>{option}</span>
                      <span className={styles.barCount}>
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {responses.length === 0 ? (
        <div className={styles.empty}>
          <IconInbox size={34} />
          <Text fw={600}>{t("responses.emptyTitle")}</Text>
          <Text size="sm" c="dimmed">
            {form.status === "open" ? t("responses.emptyOpen") : t("responses.emptyClosed")}
          </Text>
        </div>
      ) : (
        <>
          <TextInput
            mt="lg"
            leftSection={<IconSearch size={16} />}
            placeholder={t("responses.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className={styles.responseList}>
            {filtered.map((r, index) => (
              <button type="button" className={styles.responseRow} key={r.id} onClick={() => setOpenIndex(index)}>
                <span className={styles.responseIndex}>{responses.length - responses.indexOf(r)}</span>
                <span className={styles.responseMain}>
                  <span className={styles.responseTitle} dir="auto">
                    {primary ? displayAnswer(r.answers?.[primary.id]) || "—" : t("responses.response")}
                  </span>
                  {secondary && (
                    <span className={styles.responseSub} dir="auto">{displayAnswer(r.answers?.[secondary.id]) || "—"}</span>
                  )}
                </span>
                {quiz.enabled && (() => {
                  const g = gradeOf(r);
                  return (
                    <span className={`${styles.scoreBadge} ${g.pending ? styles.scorePending : ""}`}>
                      {g.score}/{g.max}
                      {g.pending ? " ·?" : ""}
                    </span>
                  );
                })()}
                <span className={styles.responseTime}>{timeAgo(r.submittedAt)}</span>
                <IconChevronRight size={16} className={`${styles.responseChevron} ${portal.flipRtl}`} />
              </button>
            ))}
            {filtered.length === 0 && (
              <Text c="dimmed" ta="center" py="lg" size="sm">
                {t("responses.noMatch", { term: search })}
              </Text>
            )}
          </div>
        </>
      )}

      <Modal
        opened={!!open}
        onClose={() => setOpenIndex(-1)}
        size="lg"
        centered
        title={
          open && (
            <Group gap="xs">
              <Text fw={700}>{t("responses.responseN", { n: responses.length - responses.indexOf(open) })}</Text>
              <Text size="sm" c="dimmed">
                {formatDateTime(open.submittedAt)}
              </Text>
            </Group>
          )
        }
      >
        {open && (
          <>
            <div className={styles.answerList}>
              {quiz.enabled && (() => {
                const g = gradeOf({ ...open, grades: handGrades });
                return (
                  <div className={styles.quizStats}>
                    <div>
                      <b>
                        {g.score} / {g.max}
                      </b>
                      <span>{g.pending ? t("quiz.pendingN", { count: g.pending }) : t("quiz.total")}</span>
                    </div>
                  </div>
                );
              })()}
              {fields.map((f, i) => {
                const value = open.answers?.[f.id];
                const mark = quiz.enabled ? gradeOf({ ...open, grades: handGrades }).per[f.id] : null;
                return (
                  <div className={styles.answerItem} key={f.id}>
                    <p className={styles.answerQuestion}>
                      {mark && (mark.correct ? <IconCircleCheck size={16} color="#10b981" /> : mark.correct === false ? <IconCircleX size={16} color="#ef4444" /> : <IconClock size={16} color="#f59e0b" />)}{" "}
                      {i + 1}. {plainText(f.label)}
                    </p>
                    {mark && (
                      <div className={styles.gradeRow}>
                        {mark.accepted.length > 0 && (
                          <Text size="xs" c="dimmed" dir="auto">
                            {t("quiz.key")}: {displayAnswer(f.type === "checkbox" ? mark.accepted : mark.accepted[0])}
                          </Text>
                        )}
                        <NumberInput
                          size="xs"
                          w={130}
                          min={0}
                          max={mark.points}
                          placeholder={mark.earned === null ? t("quiz.give") : String(mark.earned)}
                          value={handGrades[f.id] ?? ""}
                          onChange={(v) => setHandGrades((h) => ({ ...h, [f.id]: v === "" ? "" : Number(v) }))}
                          rightSection={<Text size="xs" c="dimmed" pe={6}>/ {mark.points}</Text>}
                          rightSectionWidth={44}
                          aria-label={t("quiz.give")}
                        />
                      </div>
                    )}
                    <div className={styles.answerValueRow}>
                      <p className={styles.answerValue} dir="auto">{displayAnswer(value) || <em>{t("responses.noAnswer")}</em>}</p>
                      {f.type === "phone" && value && (
                        <Button
                          size="compact-xs"
                          color="green"
                          variant="light"
                          component="a"
                          href={`https://wa.me/${whatsappNumber(value)}`}
                          target="_blank"
                          rel="noreferrer"
                          leftSection={<IconBrandWhatsapp size={14} />}
                        >
                          {t("responses.chat")}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {Object.keys(open.answers || {})
                .filter((k) => !fields.some((f) => f.id === k))
                .map((k) => (
                  <div className={styles.answerItem} key={k}>
                    <p className={styles.answerQuestion}>{t("responses.removedQuestion")}</p>
                    <p className={styles.answerValue} dir="auto">{displayAnswer(open.answers[k])}</p>
                  </div>
                ))}
            </div>

            <Group justify="space-between" mt="lg">
              <Button
                variant="subtle"
                color="red"
                leftSection={<IconTrash size={15} />}
                onClick={() => setConfirmDelete(true)}
              >
                {t("responses.delete")}
              </Button>
              <Group gap={4}>
                {quiz.enabled && JSON.stringify(handGrades) !== JSON.stringify(open.grades || {}) && (
                  <Button color="teal" loading={savingGrades} onClick={saveGrades} me="xs">
                    {t("quiz.saveGrades")}
                  </Button>
                )}
                <Button variant="light" color="teal" leftSection={<IconPrinter size={15} />} onClick={() => setPrinting(true)} me="xs">
                  {t("print.button")}
                </Button>
                <Tooltip label={t("responses.newer")}>
                  <ActionIcon
                    variant="default"
                    disabled={openIndex <= 0}
                    onClick={() => setOpenIndex((i) => i - 1)}
                    aria-label={t("responses.newer")}
                  >
                    <IconChevronLeft size={16} className={portal.flipRtl} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t("responses.older")}>
                  <ActionIcon
                    variant="default"
                    disabled={openIndex >= filtered.length - 1}
                    onClick={() => setOpenIndex((i) => i + 1)}
                    aria-label={t("responses.older")}
                  >
                    <IconChevronRight size={16} className={portal.flipRtl} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </>
        )}
      </Modal>

      {open && (
        <PrintResponse
          opened={printing}
          onClose={() => setPrinting(false)}
          form={form}
          response={open}
          responseNo={responses.length - responses.indexOf(open)}
        />
      )}

      <Modal opened={confirmDelete} onClose={() => setConfirmDelete(false)} title={t("responses.deleteTitle")} centered size="sm">
        <Text size="sm">{t("responses.deleteText")}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setConfirmDelete(false)}>
            {t("responses.cancel")}
          </Button>
          <Button color="red" loading={deleting} onClick={deleteOpen}>
            {t("responses.delete")}
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
