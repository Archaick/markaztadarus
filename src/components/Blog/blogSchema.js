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
 * posts/{slug}/images/{imageId}
 *   dataUrl (JPEG), width, height, createdAt
 *
 * Photos live in Firestore because this project has no Storage bucket.
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
export const THUMB_LIMITS = { maxWidth: 720, maxHeight: 540, maxChars: 110000 };
export const GRID_LIMITS = { maxWidth: 480, maxHeight: 480, maxChars: 70000 };

export const PAGE_SIZE = 12;

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
