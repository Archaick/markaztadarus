import { Timestamp, collection, doc, getDoc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { normalizeEmail } from "./access";

// The history of what admins do in the internal dashboards, read by the
// super admin on /internal/history.
//
// Every admin write goes out in one batch with its history entry, and
// firestore.rules refuses the write otherwise: a created or changed document
// must carry `auditId` naming an entry made in that same request by the same
// account, and a deleted one needs a "mark" (see deleteMarkId). Entries and
// marks can never be changed or removed, so the history cannot be skipped or
// rewritten, not even from the browser console.
//
// Nothing is deleted outright either: an exact copy of every deleted document
// goes to the recycle bin (internal_trash) first, where the super admin can
// restore it for TRASH_DAYS days; after that the database removes it by
// itself (a TTL policy on `expiresAt`, see firestore.indexes.json). The rules
// refuse a delete whose copy is missing or differs.
export const AUDIT_COLLECTION = "internal_audit";
export const MARKS_COLLECTION = "internal_audit_marks";
export const TRASH_COLLECTION = "internal_trash";
export const TRASH_ITEMS = "trash_items";
export const TRASH_DAYS = 30;

// Batches hold at most 500 writes, and each delete now takes three (the
// delete, its mark and its copy): leave room for the entry and the bin.
export const AUDIT_CHUNK = 150;

// One request carries at most 10 MiB; copies of big documents (photos) go
// ahead in batches of their own when the delete would not fit.
const INLINE_BYTES = 4 * 1024 * 1024;
const PRE_BATCH_BYTES = 6 * 1024 * 1024;

// Firestore values the rules accept in `details`: short and flat.
function cleanDetails(details) {
  const out = {};
  Object.entries(details || {})
    .slice(0, 20)
    .forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) out[key] = value.slice(0, 20).map((v) => String(v).slice(0, 300));
      else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
      else out[key] = String(value).slice(0, 300);
    });
  return out;
}

/**
 * The mark that lets one version of a document be deleted. `key` names the
 * document (e.g. "redirect_manager_links~abc") and `currentAuditId` is the
 * auditId it carries now ("v0" for one saved before the history existed).
 * Mirrored in firestore.rules (marked()).
 */
export const deleteMarkId = (key, currentAuditId) => `${key}~${currentAuditId || "v0"}`;

/** Where the document a delete key names lives ("admins~x" is internal_admins/x). */
export const keyPath = (key) => {
  const parts = key.split("~");
  if (parts[0] === "admins") parts[0] = "internal_admins";
  return parts.join("/");
};

/** The kind of document a path holds, for the bin's summary: its collection's name. */
export const kindOf = (path) => {
  const parts = path.split("/");
  return parts[parts.length - 2];
};

// Roughly how big a document is when sent (data URLs are nearly all of it).
const sizeOf = (data) => {
  try {
    return JSON.stringify(data).length;
  } catch {
    return 1024;
  }
};

/**
 * Write `entry` to the history together with whatever `fill(batch, auditId,
 * markDelete)` adds to the batch, in one atomic commit. Returns the auditId.
 *
 * entry: { area, action, target?, label?, details? }
 * markDelete(key, currentAuditId) must be called for every document deleted;
 * its copy goes to the recycle bin with it.
 * options.trash: { group, more } puts the copies of several writes in one bin
 *   entry (e.g. a form and the batches of its responses): `group` is any new
 *   id, `more` is true for every write after the first.
 */
export async function auditedWrite(user, entry, fill, options = {}) {
  const batch = writeBatch(db);
  const ref = doc(collection(db, AUDIT_COLLECTION));
  const actor = normalizeEmail(user?.email);
  const actorName = (user?.displayName || "").slice(0, 120);
  const label = String(entry.label || "").slice(0, 200);
  const target = String(entry.target || "").slice(0, 200);
  batch.set(ref, {
    at: serverTimestamp(),
    actor,
    actorName,
    area: entry.area,
    action: entry.action,
    target,
    label,
    details: cleanDetails(entry.details),
  });

  const group = options.trash?.group || ref.id;
  const deletes = [];
  const markDelete = (key, currentAuditId) => {
    const markId = deleteMarkId(key, currentAuditId);
    deletes.push({ key, markId });
    batch.set(doc(db, MARKS_COLLECTION, markId), {
      at: serverTimestamp(),
      actor,
      audit: ref.id,
      trash: group,
    });
  };
  await fill(batch, ref.id, markDelete);

  if (deletes.length) {
    // the copies, read as they are now (a document already gone needs none)
    const copies = (
      await Promise.all(
        deletes.map(async ({ key, markId }) => {
          const path = keyPath(key);
          const snap = await getDoc(doc(db, path));
          return snap.exists() ? { markId, path, data: snap.data() } : null;
        })
      )
    ).filter(Boolean);

    const expiresAt = Timestamp.fromMillis(Date.now() + TRASH_DAYS * 24 * 60 * 60 * 1000);
    const itemOf = (c) => ({ path: c.path, data: c.data, actor, at: serverTimestamp(), expiresAt });
    const itemRef = (c) => doc(db, TRASH_COLLECTION, group, TRASH_ITEMS, c.markId);
    const total = copies.reduce((sum, c) => sum + sizeOf(c.data), 0);

    if (total <= INLINE_BYTES) {
      copies.forEach((c) => batch.set(itemRef(c), itemOf(c)));
    } else {
      // big copies first, in batches of their own: the delete below checks they are there
      let part = writeBatch(db);
      let bytes = 0;
      let count = 0;
      for (const c of copies) {
        const size = sizeOf(c.data);
        if (count && (bytes + size > PRE_BATCH_BYTES || count >= 400)) {
          await part.commit();
          part = writeBatch(db);
          bytes = 0;
          count = 0;
        }
        part.set(itemRef(c), itemOf(c));
        bytes += size;
        count += 1;
      }
      if (count) await part.commit();
    }

    // the bin entry: what was deleted, by whom, and how much of each kind
    const kinds = {};
    copies.forEach((c) => {
      kinds[kindOf(c.path)] = (kinds[kindOf(c.path)] || 0) + 1;
    });
    const summary = { area: entry.area, action: entry.action, label, target, audit: ref.id };
    const groupRef = doc(db, TRASH_COLLECTION, group);
    if (options.trash?.more) {
      batch.update(groupRef, {
        ...summary,
        count: increment(copies.length),
        ...Object.fromEntries(Object.entries(kinds).map(([k, n]) => [`kinds.${k}`, increment(n)])),
      });
    } else {
      batch.set(groupRef, { ...summary, actor, actorName, at: serverTimestamp(), expiresAt, count: copies.length, kinds });
    }
  }

  await batch.commit();
  return ref.id;
}
