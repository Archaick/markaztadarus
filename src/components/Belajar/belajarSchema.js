// Belajar 5T: the teachers' book (Buku Guru) as lessons, one per surah, each
// with its 5T material ayah by ayah and the sections of the book (reading,
// questions with their answers, written tasks). Admins given "belajar" edit
// it in /internal/belajar; teachers will study it at /guru (and children at
// /anak later), so everything here is kept program-neutral.

export const BASE = "/belajar";
export const NS = "internal/Belajar";

export const LESSONS = "belajar_lessons";
export const SECTIONS = "belajar_sections";

export const PROGRAMS = ["guru", "anak"];

// The sections every surah of Buku Guru Jilid 1 has, in the book's order.
// `kind`: quiz = questions with answers (may open with a text to read),
// reading = text only, written = tasks the teacher answers in their own words.
export const SECTION_TYPES = [
  { key: "tadarus", kind: "quiz", t: "tamhid" },
  { key: "tujuan", kind: "reading" },
  { key: "pendahuluan", kind: "quiz", t: "tamhid" },
  { key: "tilawah", kind: "quiz", t: "tilawah" },
  { key: "tafsir", kind: "quiz", t: "tafsir" },
  { key: "tuhanku", kind: "quiz", t: "tadabbur" },
  { key: "doaku", kind: "quiz", t: "tadabbur" },
  { key: "rasulku", kind: "quiz", t: "tadabbur" },
  { key: "akhlakku", kind: "quiz", t: "tazkiyah" },
  { key: "keterampilan", kind: "written", t: "tadabbur" },
  { key: "amalku", kind: "written", t: "tazkiyah" },
];

export const sectionType = (key) => SECTION_TYPES.find((s) => s.key === key);

export const FIVE_T = ["tamhid", "tilawah", "tafsir", "tadabbur", "tazkiyah"];

export const QUESTION_TYPES = ["single", "truefalse", "multi", "match"];

// limits mirrored in firestore.rules
export const LIMITS = { title: 200, text: 4000, parts: 10, questions: 60, tasks: 30, reading: 80, ayat: 300 };

export const newId = () => Math.random().toString(36).slice(2, 10);

export const blankQuestion = (type = "single") => {
  const base = { id: newId(), type, stem: "", explanation: "" };
  if (type === "truefalse") return { ...base, options: ["Benar", "Salah"], correct: [] };
  if (type === "match") return { ...base, left: ["", ""], right: ["", ""], answer: [null, null] };
  return { ...base, options: ["", "", "", ""], correct: [] };
};

export const blankAyah = (no = 1) => ({ no, arabic: "", tema: "", tafsir: [], tadabbur: [], tazkiyah: [] });

/** What is wrong with a question, for the review list (empty when it is ready). */
export function questionIssues(q) {
  const issues = [];
  if (!(q.stem || "").trim()) issues.push("noStem");
  if (q.type === "match") {
    if ((q.left || []).some((x) => !x.trim()) || (q.right || []).some((x) => !x.trim())) issues.push("emptyOption");
    if ((q.answer || []).some((a) => a === null || a === undefined)) issues.push("noAnswer");
    return issues;
  }
  if ((q.options || []).some((x) => !x.trim())) issues.push("emptyOption");
  const n = (q.correct || []).length;
  if (n === 0) issues.push("noAnswer");
  if ((q.type === "single" || q.type === "truefalse") && n > 1) issues.push("tooMany");
  if (q.type === "multi" && n === 1) issues.push("onlyOne");
  return issues;
}

export const questionsOf = (section) => (section?.parts || []).flatMap((p) => p.questions || []);

export const issuesOfSection = (section) => questionsOf(section).filter((q) => questionIssues(q).length).length;

/** Surah lessons in the book's order. */
export const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.title || "").localeCompare(b.title || "");
