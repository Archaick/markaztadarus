import letterhead from "../../assets/imgs/letterhead-mt.png";
import { FIRST_SECTION, TRACE, displayAnswer, isEmptyAnswer } from "./formSchema";
import { RichText } from "./richText";
import styles from "./FormPrint.module.css";

/*
 * One response on the Markaz Tadarus letterhead, a page per section (like the
 * Tadarus worksheets: the ayah and its tafsir from the section's description,
 * then the answers, or lines to write on when empty). Used by the admins'
 * Print / PDF and by the respondent's own download after sending.
 */

export const SHEET_PX = 794; // A4 at 96 dpi
export const TAGLINE = "Markaz Tadarus Indonesia — Menyatukan Hati dengan al-Qur'an";

// Right to left, as on the Tadarus worksheets: traced words in ink, the rest still grey.
function TraceTable({ question, value }) {
  const words = question.words || [];
  return (
    <table className={styles.traceTable} dir="rtl">
      <tbody>
        <tr>
          {words.map((word) => (
            <td key={word} className={(value || []).includes(word) ? styles.traceInked : styles.traceGrey}>
              {word}
            </td>
          ))}
        </tr>
        <tr>
          {words.map((word) => (
            <td key={word} className={styles.traceBlank} />
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function SectionPage({ section, answers, footer }) {
  return (
    <section className={styles.page} data-pdf-page>
      {/* the letterhead: the Kufic band, the navy rule and the Arabic logo, with the tagline on the rule */}
      <div className={styles.head}>
        <img src={letterhead} alt="مركز التدارس إندونيسيا" className={styles.letterhead} />
        <span className={styles.tagline}>{TAGLINE}</span>
      </div>

      {section.title && (
        <h1 className={styles.title} dir="auto">
          {section.title}
        </h1>
      )}
      {section.description && <RichText text={section.description} align="center" className={styles.text} />}

      {section.questions.map((q) => {
        const value = answers[q.id];
        return (
          <div key={q.id} className={styles.question}>
            <h2 className={styles.label} dir="auto">
              <RichText text={q.label} as="inline" />
            </h2>
            {q.type === TRACE ? (
              <TraceTable question={q} value={value} />
            ) : isEmptyAnswer(value) ? (
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

/** The pages for `sections` (each with the questions to show). Section 1 without a title prints under the form's title. */
export function ResponseSheet({ sections, answers, footer, formTitle, rtl, sheetRef }) {
  return (
    <div ref={sheetRef} className={styles.sheet} dir={rtl ? "rtl" : "ltr"}>
      {sections.map((s) => (
        <SectionPage key={s.id} section={s.id === FIRST_SECTION ? { ...s, title: s.title || formTitle } : s} answers={answers} footer={footer} />
      ))}
    </div>
  );
}

/**
 * Prints only `sheet` (other off-screen pages, like the statistics report,
 * stay out): full A4 pages without the browser's own header and footer (the
 * page title and the address), named `title` when saved as PDF.
 */
export function printSheet(title, sheet) {
  const host = sheet?.closest(`.${styles.host}`);
  host?.classList.add(styles.printTarget);
  const page = document.createElement("style");
  page.textContent = "@page { size: A4; margin: 0; }";
  document.head.appendChild(page);
  const before = document.title;
  document.title = title;
  document.body.classList.add(styles.printing);
  const done = () => {
    document.body.classList.remove(styles.printing);
    host?.classList.remove(styles.printTarget);
    page.remove();
    document.title = before;
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  setTimeout(() => window.print(), 50);
}

export const hostClass = styles.host;
