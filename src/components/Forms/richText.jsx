import { Fragment, useRef, useState } from "react";
import { Textarea, Tooltip } from "@mantine/core";
import { IconBold, IconItalic } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./RichText.module.css";

/*
 * A little formatting for a form's texts (its description, each section's
 * description, each question), typed with the buttons over the box:
 *   **bold**   *italic*   a line starting "# " is large, "-# " is small.
 * Shown line by line, each in its own direction, so an ayah in Arabic sits
 * right to left (in a Qur'an font) while the Indonesian lines stay left to
 * right; a short line ending in ":" (Terjemahan:, Tafsir:) reads as a label.
 */

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-ﻼ]/g;
const LATIN = /[A-Za-z]/g;
const SIZES = [
  ["-# ", "small"],
  ["# ", "large"],
];

/** "**a** *b*" → bold and italic pieces. */
const inline = (text) =>
  String(text)
    .split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)
    .map((part, i) => {
      if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
      return <Fragment key={i}>{part}</Fragment>;
    });

const sizeOf = (line) => SIZES.find(([prefix]) => line.startsWith(prefix)) || null;
const mostlyArabic = (line) => (line.match(ARABIC) || []).length > (line.match(LATIN) || []).length;

/** The text with its formatting marks taken out (for lists, Excel, CSV). */
export const plainText = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => {
      const size = sizeOf(line);
      return (size ? line.slice(size[0].length) : line).replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/\*([^*\n]+)\*/g, "$1");
    })
    .join("\n");

/**
 * The text, formatted. `as="block"` gives paragraphs (descriptions);
 * `as="inline"` keeps it inside a label, with line breaks.
 */
export function RichText({ text, as = "block", className, align }) {
  const lines = String(text || "").split("\n");
  if (as === "inline") {
    return lines.map((line, i) => {
      const size = sizeOf(line);
      const body = size ? line.slice(size[0].length) : line;
      return (
        <Fragment key={i}>
          {i > 0 && <br />}
          <span className={size ? styles[size[1]] : mostlyArabic(body) ? styles.arabicInline : undefined}>{inline(body)}</span>
        </Fragment>
      );
    });
  }
  return (
    <div className={`${styles.rich} ${align === "center" ? styles.center : ""} ${className || ""}`}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className={styles.gap} />;
        const size = sizeOf(line);
        const body = size ? line.slice(size[0].length) : line;
        const arabic = mostlyArabic(body);
        const label = !arabic && !size && body.trim().length <= 40 && /:\s*$/.test(body);
        const cls = [styles.line, arabic && styles.arabic, label && styles.label, size && styles[size[1]]].filter(Boolean).join(" ");
        return (
          <p key={i} className={cls} dir={arabic ? "rtl" : "auto"}>
            {inline(body)}
          </p>
        );
      })}
    </div>
  );
}

// ---------- the editor: a text box with the formatting buttons ----------

/** Wraps the selection in `mark` (or takes the mark off when already wrapped). */
function wrap(value, from, to, mark) {
  // spaces picked up with a double-clicked word stay outside the marks
  let start = from;
  let end = to;
  while (end > start && /\s/.test(value[end - 1])) end -= 1;
  while (start < end && /\s/.test(value[start])) start += 1;
  const before = value.slice(0, start);
  const chosen = value.slice(start, end) || "teks";
  const after = value.slice(end);
  if (before.endsWith(mark) && after.startsWith(mark)) {
    return { value: before.slice(0, -mark.length) + chosen + after.slice(mark.length), start: start - mark.length, end: start - mark.length + chosen.length };
  }
  return { value: before + mark + chosen + mark + after, start: start + mark.length, end: start + mark.length + chosen.length };
}

/** Gives every line of the selection the size prefix (or none). */
function resize(value, start, end, prefix) {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const toBreak = value.indexOf("\n", end);
  const to = toBreak === -1 ? value.length : toBreak;
  const lines = value
    .slice(from, to)
    .split("\n")
    .map((line) => {
      const size = sizeOf(line);
      const body = size ? line.slice(size[0].length) : line;
      return prefix ? prefix + body : body;
    })
    .join("\n");
  const next = value.slice(0, from) + lines + value.slice(to);
  return { value: next, start: from, end: from + lines.length };
}

/**
 * A Textarea with a small formatting bar (bold, italic, text size) that shows
 * while it is being edited, and a preview of the formatted text.
 */
export function RichTextarea({ value, onValue, preview = true, wrapperClassName, ...props }) {
  const { t } = useTranslation("internal/Forms");
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  const apply = (edit) => {
    const el = ref.current;
    if (!el) return;
    const out = edit(value || "", el.selectionStart, el.selectionEnd);
    onValue(out.value);
    // put the selection back once React has written the new text
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(out.start, out.end);
    });
  };
  const formatted = /\*[^*\n]+\*|^-?# /m.test(value || "");
  // the buttons keep the focus (and the selection) in the box
  const keep = (e) => e.preventDefault();
  const button = (label, onClick, content) => (
    <Tooltip label={label} withinPortal>
      <button type="button" className={styles.tool} onMouseDown={keep} onClick={onClick} aria-label={label}>
        {content}
      </button>
    </Tooltip>
  );

  return (
    <div
      className={`${styles.editor} ${wrapperClassName || ""}`}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      {focused && (
        <div className={styles.toolbar}>
          {button(t("format.bold"), () => apply((v, s, e) => wrap(v, s, e, "**")), <IconBold size={15} />)}
          {button(t("format.italic"), () => apply((v, s, e) => wrap(v, s, e, "*")), <IconItalic size={15} />)}
          <span className={styles.sep} />
          {button(t("format.large"), () => apply((v, s, e) => resize(v, s, e, "# ")), <span className={styles.sizeLarge}>A</span>)}
          {button(t("format.normal"), () => apply((v, s, e) => resize(v, s, e, "")), <span className={styles.sizeNormal}>A</span>)}
          {button(t("format.small"), () => apply((v, s, e) => resize(v, s, e, "-# ")), <span className={styles.sizeSmall}>A</span>)}
        </div>
      )}
      <Textarea ref={ref} value={value} onChange={(e) => onValue(e.currentTarget.value)} {...props} />
      {preview && focused && formatted && (
        <div className={styles.preview}>
          <span>{t("format.preview")}</span>
          <RichText text={value} />
        </div>
      )}
    </div>
  );
}
