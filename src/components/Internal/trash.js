import { collection, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { AUDIT_CHUNK, TRASH_COLLECTION, TRASH_ITEMS, auditedWrite, kindOf } from "./audit";
import { normalizeEmail } from "./access";

// Restoring and emptying the recycle bin (see audit.js), for the super admin.

// One request carries at most 10 MiB, and the rules may only read so much of
// it: big restores (photos) go a few megabytes at a time.
const BATCH_BYTES = 3 * 1024 * 1024;
const sizeOf = (data) => {
  try {
    return JSON.stringify(data).length;
  } catch {
    return 1024;
  }
};

/** The copies held for one bin entry. */
export async function loadItems(groupId) {
  const snap = await getDocs(collection(db, TRASH_COLLECTION, groupId, TRASH_ITEMS));
  return snap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() }));
}

/**
 * What would clash on restore: a document now at the same place (a new one
 * made since), or a short link whose path another link took meanwhile.
 * Returns [{ path, reason }].
 */
export async function findConflicts(items) {
  const found = [];
  await Promise.all(
    items.map(async (item) => {
      if ((await getDoc(doc(db, item.path))).exists()) found.push({ path: item.path, reason: "exists" });
      if (kindOf(item.path) === "redirect_manager_links" && item.data?.source) {
        const same = await getDocs(query(collection(db, "redirect_manager_links"), where("source", "==", item.data.source), limit(2)));
        if (same.docs.some((d) => `redirect_manager_links/${d.id}` !== item.path)) found.push({ path: item.data.source, reason: "taken" });
      }
    })
  );
  return found;
}

// Splits copies into batches that fit one request.
function chunks(items) {
  const out = [];
  let part = [];
  let bytes = 0;
  items.forEach((item) => {
    const size = sizeOf(item.data);
    if (part.length && (bytes + size > BATCH_BYTES || part.length >= AUDIT_CHUNK)) {
      out.push(part);
      part = [];
      bytes = 0;
    }
    part.push(item);
    bytes += size;
  });
  if (part.length) out.push(part);
  return out;
}

/**
 * Puts every document of a bin entry back where it was, under its own id
 * (so printed QR codes and shared links work again), and marks the entry
 * restored. Each batch is a history entry of its own.
 */
export async function restoreGroup(user, group, items, onProgress) {
  const parts = chunks(items);
  let done = 0;
  for (const [i, part] of parts.entries()) {
    const last = i === parts.length - 1;
    await auditedWrite(
      user,
      {
        area: group.area,
        action: "trash.restore",
        target: group.target,
        label: group.label,
        details: { count: part.length, ...(parts.length > 1 && { part: `${i + 1}/${parts.length}` }), deletedBy: group.actor },
      },
      (batch, auditId) => {
        part.forEach((item) => {
          batch.set(doc(db, item.path), { ...item.data, auditId });
          batch.delete(item.ref);
        });
        if (last) {
          batch.update(doc(db, TRASH_COLLECTION, group.id), {
            restoredAt: serverTimestamp(),
            restoredBy: normalizeEmail(user?.email),
          });
        }
      }
    );
    done += part.length;
    onProgress?.(done / items.length);
  }
}

/**
 * Removes the entries whose 30 days are up, copies and all (no history
 * entry: nothing anyone did, just time). Run when the super admin opens the
 * Admin app; returns how many went.
 */
export async function purgeExpired(groups) {
  const now = Date.now();
  const expired = groups.filter((g) => g.expiresAt?.toMillis?.() < now);
  for (const group of expired) {
    const items = await loadItems(group.id);
    for (let i = 0; i < items.length; i += 450) {
      const batch = writeBatch(db);
      items.slice(i, i + 450).forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, TRASH_COLLECTION, group.id));
  }
  return expired.length;
}

/** Removes a bin entry for good, before its 30 days are up. */
export async function purgeGroup(user, group, items) {
  const parts = [];
  for (let i = 0; i < items.length; i += 400) parts.push(items.slice(i, i + 400));
  if (!parts.length) parts.push([]);
  for (const [i, part] of parts.entries()) {
    const last = i === parts.length - 1;
    await auditedWrite(
      user,
      {
        area: group.area,
        action: "trash.purge",
        target: group.target,
        label: group.label,
        details: { count: part.length, deletedBy: group.actor },
      },
      (batch) => {
        part.forEach((item) => batch.delete(item.ref));
        if (last) batch.delete(doc(db, TRASH_COLLECTION, group.id));
      }
    );
  }
}
