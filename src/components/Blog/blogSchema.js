import {
  collection,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { compressImage } from "../Internal/images";
import { intlLocale } from "../Internal/language";

/**
 * posts/{slug}
 *   title, excerpt, body (plain text, blank line = new paragraph)
 *   category, province ("" or a map province), date ("YYYY-MM-DD")
 *   status: "draft" | "published"
 *   images: [imageId, …] in display order, coverId, coverThumb (small JPEG)
 *   translations (optional): { en: { title, excerpt, body }, ar: { … } }
 *     Indonesian above is the main text; a language is left out when all
 *     three of its fields are empty, and an empty field falls back to Indonesian.
 * posts/{slug}/images/{imageId}
 *   url and file (in Cloud Storage), or dataUrl (a JPEG, for older photos);
 *   width, height, createdAt
 */
export const POSTS = "posts";
export const IMAGES = "images";
// Small copies of each photo, same id, for the gallery grid. Visitors load
// these; a full photo is fetched only when it is opened in the viewer.
export const THUMBS = "thumbs";

// Names live under categories.<key> in blog/Blog.json.
export const CATEGORIES = ["umrah", "pelatihan", "majelis", "seminar", "lainnya"];

export const MAX_IMAGES = 30;
export const IMAGE_LIMITS = { maxWidth: 1600, maxHeight: 1600, maxChars: 450000 };
// The card / cover image kept on the post itself: every news list downloads
// it, so it stays small (it is also the WhatsApp share picture).
export const THUMB_LIMITS = { maxWidth: 480, maxHeight: 360, maxChars: 45000 };
export const GRID_LIMITS = { maxWidth: 480, maxHeight: 480, maxChars: 70000 };

export const PAGE_SIZE = 12;

/* ── translations ── */

export const TRANSLATION_LANGUAGES = ["en", "ar"];
export const TRANSLATION_FIELDS = ["title", "excerpt", "body"];
// Same limits as firestore.rules (validTranslation).
export const TRANSLATION_LIMITS = { title: 200, excerpt: 400, body: 50000 };

const asText = (value) => (typeof value === "string" ? value : "");

// { title, excerpt, body } for one language, as strings ("" when missing).
export const translationOf = (post, lang) => {
  const entry = post?.translations?.[lang];
  return Object.fromEntries(TRANSLATION_FIELDS.map((f) => [f, asText(entry?.[f])]));
};

// Whether a language has any text of its own.
export const hasTranslation = (entry) => TRANSLATION_FIELDS.some((f) => asText(entry?.[f]).trim());

// The editor's { en: {…}, ar: {…} } → the stored map: values trimmed (body
// keeps its leading spaces), cut to the limits, empty languages left out.
export const cleanTranslations = (translations) => {
  const out = {};
  TRANSLATION_LANGUAGES.forEach((lang) => {
    const entry = translations?.[lang];
    const clean = {
      title: asText(entry?.title).trim().slice(0, TRANSLATION_LIMITS.title),
      excerpt: asText(entry?.excerpt).trim().slice(0, TRANSLATION_LIMITS.excerpt),
      body: asText(entry?.body).replace(/\s+$/, "").slice(0, TRANSLATION_LIMITS.body),
    };
    if (hasTranslation(clean)) out[lang] = clean;
  });
  return out;
};

// The language family of an i18next code ("en-US" → "en").
const baseLanguage = (lang) => (lang || "").split("-")[0];

/**
 * A post's text in the visitor's language: { title, excerpt, body, rtl }.
 * Each field falls back to the Indonesian one when its translation is empty;
 * `rtl` is true only when some Arabic text is actually shown. Also returns
 * `translated` and `dir` per field, for the elements that hold each one.
 */
export const localized = (post, lang) => {
  const base = baseLanguage(lang);
  const own = TRANSLATION_LANGUAGES.includes(base) ? translationOf(post, base) : null;
  const pick = (field) => {
    const text = own?.[field];
    return text && text.trim() ? { text, translated: true } : { text: asText(post?.[field]), translated: false };
  };
  const title = pick("title");
  const excerpt = pick("excerpt");
  const body = pick("body");
  const arabic = base === "ar";
  return {
    title: title.text,
    excerpt: excerpt.text,
    body: body.text,
    rtl: arabic && (title.translated || excerpt.translated || body.translated),
    translated: { title: title.translated, excerpt: excerpt.translated, body: body.translated },
    dir: {
      title: arabic && title.translated ? "rtl" : "auto",
      excerpt: arabic && excerpt.translated ? "rtl" : "auto",
      body: arabic && body.translated ? "rtl" : "auto",
    },
  };
};

// The card's short text in the visitor's language: the summary, or the start
// of the text. A translated text is preferred over an Indonesian summary.
export const localizedExcerpt = (post, lang, length = 160) => {
  const loc = localized(post, lang);
  const useBody = !loc.translated.excerpt && loc.translated.body;
  return {
    text: useBody ? excerptOf({ body: loc.body }, length) : excerptOf(loc, length),
    dir: useBody ? loc.dir.body : loc.excerpt.trim() ? loc.dir.excerpt : loc.dir.body,
  };
};

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const formatPostDate = (iso, lng) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(intlLocale(lng), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const postLink = (slug) => `${window.location.origin}/berita/${slug}`;

// Paragraphs for display: blank lines split paragraphs, single newlines stay.
export const paragraphs = (body) =>
  (body || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export const excerptOf = (post, length = 160) => {
  const text = (post.excerpt || post.body || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length).replace(/\s+\S*$/, "")}…` : text;
};

export const makeImage = (file) => compressImage(file, IMAGE_LIMITS);

export const makeThumb = async (source) => (await compressImage(source, THUMB_LIMITS)).dataUrl;

// A post saved before card images were made this small.
export const hasLargeCard = (post) => (post.coverThumb || "").length > THUMB_LIMITS.maxChars;

// { dataUrl, width, height } for the gallery grid
export const makeGridThumb = (source) => compressImage(source, GRID_LIMITS);

// Published posts, newest first; pass the last doc to get the next page.
// Each filter combination needs its index in firestore.indexes.json.
export const fetchPublished = async ({ category, province, after, size = PAGE_SIZE } = {}) => {
  const parts = [where("status", "==", "published")];
  if (category) parts.push(where("category", "==", category));
  if (province) parts.push(where("province", "==", province));
  parts.push(orderBy("date", "desc"));
  if (after) parts.push(startAfter(after));
  parts.push(firestoreLimit(size));
  const snap = await getDocs(query(collection(db, POSTS), ...parts));
  return {
    posts: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    last: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === size,
  };
};
