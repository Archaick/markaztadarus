import { collection, doc, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { auditedWrite } from "../Internal/audit";
import { IMAGES, POSTS, THUMBS, hasLargeCard, makeGridThumb, makeThumb } from "../Blog/blogSchema";
import { photoOf } from "../Blog/photoFiles";

// Thumbnails per batch: each is up to ~70 KB, well inside a request's size.
const PER_BATCH = 10;

/**
 * Gives every photo of a post a small gallery copy in posts/{id}/thumbs, then
 * marks the post `thumbsReady`, which is what tells the public page to load
 * the small copies instead of every full photo. A card image from before
 * cards were made smaller is shrunk too. Photos that already have a copy are
 * skipped, so running it again is harmless.
 *
 * `images` (id → { dataUrl }) can be passed when the caller already has them;
 * otherwise they are read here. Returns how many thumbnails were made.
 */
export async function buildPostThumbs({ user, post, images }) {
  const full = images || Object.fromEntries((await getDocs(collection(db, POSTS, post.id, IMAGES))).docs.map((d) => [d.id, photoOf(d.data())]));
  const have = new Set((await getDocs(collection(db, POSTS, post.id, THUMBS))).docs.map((d) => d.id));
  const missing = (post.images || []).filter((id) => full[id] && !have.has(id));

  // the card image, remade from the full cover photo
  let coverThumb = null;
  if (hasLargeCard(post) && full[post.coverId]) {
    try {
      coverThumb = await makeThumb(full[post.coverId].dataUrl);
    } catch (err) {
      console.error("Could not shrink the card image:", err);
    }
  }

  const made = [];
  for (const id of missing) {
    try {
      made.push({ id, ...(await makeGridThumb(full[id].dataUrl)) });
    } catch (err) {
      console.error(`Could not shrink photo ${id}:`, err);
    }
  }

  const postRef = doc(db, POSTS, post.id);
  const entry = (details) => ({ area: "site", action: "post.thumbs", target: post.id, label: post.title || post.id, details });
  for (let i = 0; i < made.length; i += PER_BATCH) {
    const part = made.slice(i, i + PER_BATCH);
    const last = i + PER_BATCH >= made.length;
    await auditedWrite(user, entry({ photos: part.length }), (batch, auditId) => {
      part.forEach(({ id, dataUrl, width, height }) => batch.set(doc(db, POSTS, post.id, THUMBS, id), { dataUrl, width, height, auditId }));
      if (last) batch.update(postRef, { thumbsReady: true, auditId, ...(coverThumb && { coverThumb }) });
    });
  }
  if (!made.length && (!post.thumbsReady || coverThumb)) {
    await auditedWrite(user, entry({ photos: 0 }), (batch, auditId) =>
      batch.update(postRef, { thumbsReady: true, auditId, ...(coverThumb && { coverThumb }) })
    );
  }
  return made.length;
}
