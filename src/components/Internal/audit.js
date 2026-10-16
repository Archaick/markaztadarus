import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
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
export const AUDIT_COLLECTION = "internal_audit";
export const MARKS_COLLECTION = "internal_audit_marks";

// Batches hold at most 500 writes; leave room for the entry and marks.
export const AUDIT_CHUNK = 200;

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

/**
 * Write `entry` to the history together with whatever `fill(batch, auditId,
 * markDelete)` adds to the batch, in one atomic commit. Returns the auditId.
 *
 * entry: { area, action, target?, label?, details? }
 * markDelete(key, currentAuditId) must be called for every document deleted.
 */
export async function auditedWrite(user, entry, fill) {
  const batch = writeBatch(db);
  const ref = doc(collection(db, AUDIT_COLLECTION));
  const actor = normalizeEmail(user?.email);
  batch.set(ref, {
    at: serverTimestamp(),
    actor,
    actorName: (user?.displayName || "").slice(0, 120),
    area: entry.area,
    action: entry.action,
    target: String(entry.target || "").slice(0, 200),
    label: String(entry.label || "").slice(0, 200),
    details: cleanDetails(entry.details),
  });
  const markDelete = (key, currentAuditId) => {
    batch.set(doc(db, MARKS_COLLECTION, deleteMarkId(key, currentAuditId)), {
      at: serverTimestamp(),
      actor,
      audit: ref.id,
    });
  };
  await fill(batch, ref.id, markDelete);
  await batch.commit();
  return ref.id;
}
