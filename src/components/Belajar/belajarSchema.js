// Belajar 5T: the teachers' book (Buku Guru) as lessons, one per surah, each
// with its 5T material ayah by ayah and the sections of the book (reading,
// questions with their answers, written tasks). Admins given "belajar" edit
// it in /internal/belajar; teachers will study it at /guru (and children at
// /anak later), so everything here is kept program-neutral.

export const BASE = "/belajar";
export const NS = "internal/Belajar";

export const LESSONS = "belajar_lessons";
export const SECTIONS = "belajar_sections";
// classes (Kelas) with the surahs assigned to them, their join codes, the
// learners (one per Google account), email invites, and progress
// (one per learner per section: "<uid>_<sectionId>").
export const CLASSES = "belajar_classes";
export const CODES = "belajar_codes";
export const LEARNERS = "belajar_learners";
export const INVITES = "belajar_invites";
export const PROGRESS = "belajar_progress";

/** A join code that is easy to read out and type: no 0/O, 1/I/L. */
export function newCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  bytes.forEach((b) => (out += chars[b % chars.length]));
  return out;
}

export const normalizeCode = (value) => (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

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

// Sections are the admin's own: each has an order, a kind, an optional name
// and an optional 5T tag. The standard list above is only the template a new
// surah starts with (and fills in what an older section does not say).

/** A section's name: the admin's own, else the standard one (in the page's language). */
export const sectionTitle = (section, t) => (section?.title || "").trim() || (sectionType(section?.key) ? t(`section.${section.key}`) : section?.key || "");

/** quiz · reading · written */
export const kindOf = (section) => section?.kind || sectionType(section?.key)?.kind || "quiz";

/** The 5T step a section belongs to, or "" for none. */
export const fiveTOf = (section) => (section && "fiveT" in section ? section.fiveT || "" : sectionType(section?.key)?.t || "");

const templateRank = (s) => {
  const i = SECTION_TYPES.findIndex((x) => x.key === s.key);
  return i < 0 ? 99 : i;
};

/** The admin's order (older sections without one keep the book's order). */
export const bySectionOrder = (a, b) => (a.order ?? templateRank(a)) - (b.order ?? templateRank(b)) || templateRank(a) - templateRank(b);

/** The standard sections as new documents for one surah. */
export const templateSections = (lessonId) =>
  SECTION_TYPES.map((s, i) => ({ lessonId, key: s.key, kind: s.kind, fiveT: s.t || "", title: "", order: i + 1, reading: [], parts: s.kind === "quiz" ? [{ heading: "", instructions: "", questions: [] }] : [], tasks: [], instructions: "" }));

export const FIVE_T = ["tamhid", "tilawah", "tafsir", "tadabbur", "tazkiyah"];

export const QUESTION_TYPES = ["single", "truefalse", "multi", "match"];

// limits mirrored in firestore.rules
export const LIMITS = { title: 200, text: 4000, parts: 10, questions: 60, tasks: 30, reading: 80, ayat: 300 };

/** Text written only in Arabic. A sentence mixing Arabic with Latin words is not: it reads left to right. */
export const isArabic = (s) => {
  const letters = (s || "").replace(/\s/g, "");
  return letters.length > 0 && !/[A-Za-z]/.test(letters) && (letters.match(/[؀-ۿ]/g) || []).length > letters.length * 0.5;
};
/** The direction of one piece of content: "auto" would follow its first word and scramble a mixed sentence. */
export const textDir = (s) => (isArabic(s) ? "rtl" : "ltr");

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

/** A section has something for a learner (questions, text or tasks). */
export const hasContent = (s) => questionsOf(s).length > 0 || (s?.reading || []).some((b) => (b.text || "").trim()) || (s?.tasks || []).length > 0;

/** The sections a learner works through in one surah, in the order the admin set. */
export const learnerSections = (sections, lessonId) => sections.filter((s) => s.lessonId === lessonId && hasContent(s)).sort(bySectionOrder);

/**
 * Where a learner is in one surah: each section with done / open / locked
 * (a section opens when the one before it is done), and how far along.
 * `progress` is a Map sectionId → progress document.
 */
export function surahState(sections, lessonId, progress) {
  const list = learnerSections(sections, lessonId);
  let open = true;
  const steps = list.map((s) => {
    const p = progress.get(s.id);
    const done = !!p?.done;
    const state = done ? "done" : open ? "open" : "locked";
    if (!done) open = false;
    return { section: s, progress: p, state };
  });
  const done = steps.filter((x) => x.state === "done").length;
  return { steps, done, total: steps.length, percent: steps.length ? Math.round((done / steps.length) * 100) : 0, next: steps.find((x) => x.state === "open") || null };
}
