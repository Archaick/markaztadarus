import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActionIcon, Button, Checkbox, Collapse, Group, Modal, Text } from "@mantine/core";
import { IconChevronDown, IconPrinter, IconShare } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../Internal/timeAgo";
import { reportToPdf, sharePdf } from "../Supervisi/reportPdf";
import { isEmptyAnswer, sectionsOf } from "./formSchema";
import { ResponseSheet, SHEET_PX, printSheet } from "./ResponseSheet";
import { plainText } from "./richText";
import styles from "./FormPrint.module.css";

const NS = "internal/Forms";

/**
 * Print one response on the Markaz Tadarus letterhead, or share it as a PDF:
 * the admin first ticks which sections (and, inside them, which questions)
 * to include, and each section prints on its own page (like the Tadarus worksheets: the ayah and its tafsir from the
 * section's description, then the answers, or lines to write on if empty).
 */
export default function PrintResponse({ opened, onClose, form, response, responseNo }) {
  const { t } = useTranslation(NS);
  const sheetRef = useRef(null);
  const [picked, setPicked] = useState([]);
  const [skipped, setSkipped] = useState([]); // question ids left out of the print
  const [closed, setClosed] = useState([]); // sections whose question list is folded away (all show at first)
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const sections = useMemo(() => sectionsOf(form.fields || [], form.firstNext), [form.fields, form.firstNext]);
  const answers = response?.answers || {};
  const answeredIn = (s) => s.questions.filter((q) => !isEmptyAnswer(answers[q.id])).length;

  // the sections this person filled in come ticked
  useEffect(() => {
    if (!opened) return;
    const filled = sections.filter((s) => answeredIn(s) > 0).map((s) => s.id);
    setPicked(filled.length ? filled : sections.map((s) => s.id));
    setSkipped([]);
    setClosed([]);
    setNote("");
  }, [opened, response?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const kept = (s) => s.questions.filter((q) => !skipped.includes(q.id));
  const chosen = sections.filter((s) => picked.includes(s.id)).map((s) => ({ ...s, questions: kept(s) }));
  const toggleQuestion = (s, id, on) => {
    setSkipped((list) => (on ? list.filter((x) => x !== id) : [...list, id]));
    // ticking a question also ticks its section
    if (on) setPicked((p) => (p.includes(s.id) ? p : [...p, s.id]));
  };
  const footer = `${form.title} · ${t("responses.responseN", { n: responseNo })} · ${formatDateTime(response?.submittedAt)}`;
  const nameOf = (s, i) => s.title || (i === 0 ? form.title : t("builder.sectionOf", { n: i + 1, total: sections.length }));

  const print = () => printSheet(`${form.title} - ${t("responses.responseN", { n: responseNo })}`);

  const share = async () => {
    if (!sheetRef.current || !chosen.length) return;
    setBusy(true);
    setNote("");
    try {
      const blob = await reportToPdf(sheetRef.current, SHEET_PX);
      const name = `${form.title} - ${t("responses.responseN", { n: responseNo })}.pdf`.replace(/[\\/:*?"<>|]+/g, " ");
      const result = await sharePdf(blob, name, form.title);
      if (result === "downloaded") setNote(t("print.downloaded"));
    } catch (err) {
      console.error("Could not make the PDF:", err);
      setNote(t("print.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal opened={opened} onClose={onClose} title={t("print.title")} centered size="md">
        <Text size="sm" c="dimmed" mb="sm">
          {t("print.intro")}
        </Text>
        <Group gap="xs" mb="xs">
          <Button
            size="compact-xs"
            variant="light"
            onClick={() => {
              setPicked(sections.map((s) => s.id));
              setSkipped([]);
            }}
          >
            {t("print.all")}
          </Button>
          <Button size="compact-xs" variant="light" color="gray" onClick={() => setPicked([])}>
            {t("print.none")}
          </Button>
        </Group>
        <div className={styles.pickList}>
          {sections.map((s, i) => {
            const on = picked.includes(s.id);
            const count = kept(s).length;
            return (
              <div key={s.id} className={styles.pickSection}>
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <Checkbox
                    color="teal"
                    style={{ flex: 1 }}
                    checked={on}
                    indeterminate={on && count < s.questions.length}
                    onChange={(e) => {
                      const next = e.currentTarget.checked;
                      setPicked((p) => (next ? [...p, s.id] : p.filter((id) => id !== s.id)));
                      // ticking a section brings all its questions back
                      if (next) setSkipped((list) => list.filter((id) => !s.questions.some((q) => q.id === id)));
                    }}
                    label={
                      <span className={styles.pickLabel}>
                        <b dir="auto">{nameOf(s, i)}</b>
                        <span>
                          {t("print.answered", { count: answeredIn(s), total: s.questions.length })}
                          {on && count < s.questions.length ? ` · ${t("print.printingN", { count, total: s.questions.length })}` : ""}
                        </span>
                      </span>
                    }
                  />
                  {s.questions.length > 0 && (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label={t("print.questions")}
                      title={t("print.questions")}
                      onClick={() => setClosed((c) => (c.includes(s.id) ? c.filter((id) => id !== s.id) : [...c, s.id]))}
                      className={closed.includes(s.id) ? undefined : styles.chevronOpen}
                    >
                      <IconChevronDown size={16} />
                    </ActionIcon>
                  )}
                </Group>
                <Collapse in={!closed.includes(s.id)}>
                  <div className={styles.pickQuestions}>
                    {s.questions.map((q) => (
                      <Checkbox
                        key={q.id}
                        size="xs"
                        color="teal"
                        checked={on && !skipped.includes(q.id)}
                        onChange={(e) => toggleQuestion(s, q.id, e.currentTarget.checked)}
                        label={
                          <span dir="auto" className={isEmptyAnswer(answers[q.id]) ? styles.pickEmpty : undefined}>
                            {plainText(q.label)}
                          </span>
                        }
                      />
                    ))}
                  </div>
                </Collapse>
              </div>
            );
          })}
        </div>
        {note && (
          <Text size="sm" c="dimmed" mt="sm">
            {note}
          </Text>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" leftSection={<IconPrinter size={16} />} disabled={!chosen.length} onClick={print}>
            {t("print.print")}
          </Button>
          <Button color="teal" leftSection={<IconShare size={16} />} loading={busy} disabled={!chosen.length} onClick={share}>
            {t("print.share")}
          </Button>
        </Group>
      </Modal>

      {/* the pages themselves, off screen; printing shows only these */}
      {opened &&
        createPortal(
          <div className={styles.host}>
            <ResponseSheet sheetRef={sheetRef} sections={chosen} answers={answers} footer={footer} formTitle={form.title} rtl={form.language === "ar"} />
          </div>,
          document.body
        )}
    </>
  );
}
