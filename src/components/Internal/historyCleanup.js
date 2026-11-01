import { Timestamp, collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { AUDIT_COLLECTION, MARKS_COLLECTION, auditedWrite } from "./audit";

// How long the Activity History keeps its entries, chosen by the super admin
// (0: forever). The rules refuse removing anything younger than MIN_KEEP_DAYS,
// so the last month (and what the recycle bin still points to) always stays.
export const SETTINGS_COLLECTION = "internal_settings";
export const HISTORY_SETTINGS = "history";
export const MIN_KEEP_DAYS = 30;
export const MAX_KEEP_DAYS = 3650;

const settingsRef = () => doc(db, SETTINGS_COLLECTION, HISTORY_SETTINGS);
const cutoffOf = (days) => Timestamp.fromMillis(Date.now() - days * 86400e3);
const CHUNK = 400;

export async function loadKeepDays() {
  const snap = await getDoc(settingsRef());
  return Number(snap.data()?.keepDays) || 0;
}

export function saveKeepDays(user, keepDays) {
  return auditedWrite(user, { area: "access", action: "history.settings", details: { keepDays } }, (batch, auditId) =>
    batch.set(settingsRef(), { keepDays, auditId, updatedAt: serverTimestamp() })
  );
}

/** How many entries are older than `days` (what a cleanup would remove). */
export async function countOlder(days) {
  if (!days) return 0;
  const snap = await getCountFromServer(query(collection(db, AUDIT_COLLECTION), where("at", "<", cutoffOf(days))));
  return snap.data().count;
}

async function removeOlder(name, cutoff) {
  let removed = 0;
  for (;;) {
    const snap = await getDocs(query(collection(db, name), where("at", "<", cutoff), orderBy("at"), limit(CHUNK)));
    if (snap.empty) return removed;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    removed += snap.size;
  }
}

/**
 * Removes the entries (and their delete marks) older than `days`, then notes
 * in the history itself that a cleanup ran and how much went. Returns the count.
 */
export async function cleanHistory(user, days) {
  if (!days || days < MIN_KEEP_DAYS) return 0;
  const cutoff = cutoffOf(days);
  const count = await removeOlder(AUDIT_COLLECTION, cutoff);
  await removeOlder(MARKS_COLLECTION, cutoff);
  if (count > 0) {
    await auditedWrite(user, { area: "access", action: "history.cleanup", details: { count, keepDays: days, before: cutoff.toDate().toISOString().slice(0, 10) } }, () => {});
  }
  return count;
}
