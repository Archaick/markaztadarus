import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconBrandWhatsapp,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconInbox,
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
import {
  FORMS_COLLECTION,
  HAS_OPTIONS,
  RESPONSES,
  displayAnswer,
  downloadText,
  responsesToCsv,
  questionsOf,
  whatsappNumber,
} from "./formSchema";

const MAX_RESPONSES = 2000;

export default function ResponsesPanel({ form }) {
  const { t } = useTranslation("internal/Forms");
  const { user } = useAccess();
  // questions only: section cards hold no answers
  const fields = useMemo(() => questionsOf(form.fields || []), [form.fields]);
  const [responses, setResponses] = useState(null);
  const [error, setError] = useState(""); // a responses.<key>
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(-1);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const exportCsv = () => {
    const csv = responsesToCsv(fields, responses || [], formatDateTime, {
      submitted: t("responses.csvSubmitted"),
      removed: (id) => t("responses.csvRemoved", { id }),
    });
    const date = new Date().toISOString().slice(0, 10);
    downloadText(`${form.id}-responses-${date}.csv`, csv);
  };

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
        <Button
          variant="light"
          color="teal"
          leftSection={<IconDownload size={16} />}
          onClick={exportCsv}
          disabled={responses.length === 0}
          className={styles.exportButton}
        >
          {t("responses.export")}
        </Button>
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

      {summaries.length > 0 && responses.length > 0 && (
        <div className={styles.summaryGrid}>
          {summaries.map(({ field, counts, answered }) => (
            <div className={styles.summaryCard} key={field.id}>
              <p className={styles.summaryQuestion}>{field.label}</p>
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
              {fields.map((f, i) => {
                const value = open.answers?.[f.id];
                return (
                  <div className={styles.answerItem} key={f.id}>
                    <p className={styles.answerQuestion}>
                      {i + 1}. {f.label}
                    </p>
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
