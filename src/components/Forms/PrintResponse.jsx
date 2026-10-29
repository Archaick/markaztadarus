import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActionIcon, Button, Checkbox, Collapse, Group, Modal, Text } from "@mantine/core";
import { IconChevronDown, IconPrinter, IconShare } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../Internal/timeAgo";
import { reportToPdf, sharePdf } from "../Supervisi/reportPdf";
import letterhead from "../../assets/imgs/letterhead-mt.png";
import { FIRST_SECTION, displayAnswer, isEmptyAnswer, sectionsOf } from "./formSchema";
import styles from "./FormPrint.module.css";

const NS = "internal/Forms";
const SHEET_PX = 794; // A4 at 96 dpi
const ARABIC = /[؀-ۿ]/;

/** A section printed on its own page under the letterhead: title, description, then each question and its answer. */
function SectionPage({ section, answers, numberOf, footer }) {
  const lines = (section.description || "").split(/\n/).filter((l) => l.trim());
  return (
    <section className={styles.page} data-pdf-page>
      {/* the Markaz Tadarus letterhead: the Kufic band, the navy rule and the Arabic logo */}
      <img src={letterhead} alt="مركز التدارس إندونيسيا" className={styles.letterhead} />

      {section.title && (
        <h1 className={styles.title} dir="auto">
          {section.title}
        </h1>
      )}
      {lines.map((line, i) =>
        ARABIC.test(line) ? (
          <p key={i} className={styles.arabic} dir="rtl">
            {line}
          </p>
        ) : (
          <p key={i} className={styles.text} dir="auto">
            {line}
          </p>
        )
      )}

      {section.questions.map((q) => {
        const value = answers[q.id];
        return (
          <div key={q.id} className={styles.question}>
            <h2 className={styles.label} dir="auto">
              {numberOf.get(q.id)}. {q.label}
            </h2>
            {isEmptyAnswer(value) ? (
              // empty: lines to write on by hand
              <div className={styles.blank} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            ) : Array.isArray(value) ? (
              <ul className={styles.list}>
                {value.map((v) => (
                  <li key={v} dir="auto">
                    {v}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.answer} dir="auto">
                {displayAnswer(value)}
              </p>
            )}
          </div>
        );
      })}
      <footer className={styles.footer}>{footer}</footer>
    </section>
  );
}

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
  const numberOf = useMemo(() => new Map(sections.flatMap((s) => s.questions).map((q, i) => [q.id, i + 1])), [sections]);
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

  const print = () => {
    document.body.classList.add(styles.printing);
    const done = () => {
      document.body.classList.remove(styles.printing);
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    setTimeout(() => window.print(), 50);
  };

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
                            {numberOf.get(q.id)}. {q.label}
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
            <div ref={sheetRef} className={styles.sheet} dir={form.language === "ar" ? "rtl" : "ltr"}>
              {chosen.map((s) => (
                // section 1 has no title of its own: it prints under the form's title
                <SectionPage key={s.id} section={s.id === FIRST_SECTION ? { ...s, title: s.title || form.title } : s} answers={answers} numberOf={numberOf} footer={footer} />
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
