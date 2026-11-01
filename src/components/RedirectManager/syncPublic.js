import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { PATH_PATTERN, REDIRECTS_SECURED, REDIRECT_PUBLIC, publicId, publicLink } from "../Redirects/redirectSchema";

// The rules look up each copy's link: a request may only look up so many.
const PER_BATCH = 10;

const millis = (value) => (value && typeof value.toMillis === "function" ? value.toMillis() : null);
const same = (a, b) =>
  a.linkId === b.linkId &&
  a.destination === b.destination &&
  a.title === b.title &&
  a.active === b.active &&
  millis(a.expiresAt) === millis(b.expiresAt);

/**
 * Brings the short-link page's copies (redirect_public) in step with the
 * links: writes missing or stale ones, removes those whose link is gone or
 * moved, and once all match, closes the links themselves to the public.
 * `copies` maps a copy's id to its data. Returns whether anything was written.
 */
export async function syncPublicLinks(links, copies) {
  const wanted = new Map();
  links.forEach((link) => {
    if (!PATH_PATTERN.test(link.source || "") || typeof link.destination !== "string") return;
    const id = publicId(link.source);
    if (!wanted.has(id)) wanted.set(id, publicLink(link.id, link));
  });

  const writes = [];
  wanted.forEach((copy, id) => {
    if (!copies[id] || !same(copies[id], copy)) writes.push((batch) => batch.set(doc(db, REDIRECT_PUBLIC, id), copy));
  });
  Object.keys(copies).forEach((id) => {
    if (id !== REDIRECTS_SECURED && !wanted.has(id)) writes.push((batch) => batch.delete(doc(db, REDIRECT_PUBLIC, id)));
  });

  if (!writes.length) {
    if (copies[REDIRECTS_SECURED]) return false;
    const batch = writeBatch(db);
    batch.set(doc(db, REDIRECT_PUBLIC, REDIRECTS_SECURED), { at: serverTimestamp() });
    await batch.commit();
    return true;
  }
  for (let i = 0; i < writes.length; i += PER_BATCH) {
    const batch = writeBatch(db);
    writes.slice(i, i + PER_BATCH).forEach((write) => write(batch));
    await batch.commit();
  }
  return true;
}
