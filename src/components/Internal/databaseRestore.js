import { Bytes, GeoPoint, Timestamp, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { auditedWrite } from "./audit";
import { storePhoto } from "../Blog/photoFiles";
import { TREE, areaOfPath, readCurrent } from "./databaseBackup";

// Putting a backup file back. It only ever adds or replaces documents, never
// deletes, and goes through the same rules and history as any admin's save.
// The history and the bin keep their own record of what happened, and the
// rules refuse rewriting them, so a backup's copies of those stay in the file.
const NEVER = new Set(["internal_audit", "internal_audit_marks", "internal_trash"]);
const STORAGE_FIGURE = "internal_settings/storage";

// One request carries at most 10 MiB and the rules look at a limited number of
// other documents per request; each short link's copy looks at its link.
const BATCH_DOCS = 100;
const BATCH_BYTES = 6 * 1024 * 1024;
const BATCH_LINK_COPIES = 5;

const INNER = new Map(TREE.map(([name, inner = []]) => [name, inner]));

// a path the backup would have written: collection/doc or collection/doc/inner/doc
const isKnownPath = (path) => {
  const parts = path.split("/");
  if (parts.some((p) => !p) || (parts.length !== 2 && parts.length !== 4)) return false;
  if (!INNER.has(parts[0])) return false;
  return parts.length === 2 || INNER.get(parts[0]).includes(parts[2]);
};

// The reverse of encode() in databaseBackup.js.
function decode(value) {
  if (Array.isArray(value)) return value.map(decode);
  if (!value || typeof value !== "object") return value;
  const keys = Object.keys(value);
  if (keys.length === 1) {
    if (keys[0] === "__time__") return Timestamp.fromDate(new Date(value.__time__));
    if (keys[0] === "__ref__") return doc(db, value.__ref__);
    if (keys[0] === "__geo__") return new GeoPoint(value.__geo__[0], value.__geo__[1]);
    if (keys[0] === "__bytes__") return Bytes.fromBase64String(value.__bytes__);
  }
  return Object.fromEntries(keys.map((k) => [k, decode(value[k])]));
}

// The same data in any key order gives the same text. Which history entry last
// saved a document says nothing about its content.
const sameKeysText = (value) => {
  if (Array.isArray(value)) return value.map(sameKeysText);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((k) => [k, sameKeysText(value[k])])
  );
};
const contentOf = (data) => {
  const rest = { ...data };
  delete rest.auditId;
  delete rest.__file__; // the backup's copy of a Cloud Storage photo
  return JSON.stringify(sameKeysText(rest));
};

/** The backup in a file, or null when it is not one of this site's. */
export async function readBackupFile(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (parsed?.project !== "markaz-tadarus" || !parsed.documents || typeof parsed.documents !== "object") return null;
    return { name: file.name, createdAt: parsed.createdAt, documents: parsed.documents };
  } catch {
    return null;
  }
}

/** What differs from the database now, per part of the system. Reads only. */
export async function comparePlan(backup, onProgress) {
  const current = await readCurrent(onProgress);
  const areas = {};
  Object.entries(backup.documents).forEach(([path, data]) => {
    if (!isKnownPath(path) || NEVER.has(path.split("/")[0]) || path === STORAGE_FIGURE) return;
    const area = (areas[areaOfPath(path)] ||= { missing: [], changed: [], same: 0 });
    if (!current.has(path)) area.missing.push(path);
    else if (contentOf(current.get(path)) !== contentOf(data)) area.changed.push(path);
    else area.same += 1;
  });
  return areas;
}

// What a document looks like when written back: each write names its history entry.
function restoredData(path, data, auditId) {
  // the marker that every link has its copy holds only the time it was written
  if (path === "redirect_public/_secured") return { at: serverTimestamp() };
  const value = decode(data);
  if (path.startsWith("redirect_public/")) return value;
  delete value.__file__;
  return { ...value, auditId };
}

function intoBatches(paths, documents) {
  const batches = [];
  let current = [];
  let bytes = 0;
  let links = 0;
  paths.forEach((path) => {
    const size = JSON.stringify(documents[path]).length * 2;
    const link = path.startsWith("redirect_public/") ? 1 : 0;
    if (current.length && (current.length >= BATCH_DOCS || bytes + size > BATCH_BYTES || links + link > BATCH_LINK_COPIES)) {
      batches.push(current);
      current = [];
      bytes = 0;
      links = 0;
    }
    current.push(path);
    bytes += size;
    links += link;
  });
  if (current.length) batches.push(current);
  return batches;
}

/**
 * Writes `paths` from the backup, keeping the file's order so a form comes back
 * before its answers. A refused batch is tried one document at a time, so one
 * bad record does not hold the others back. Returns { restored, failed: [path] }.
 */
export async function runRestore(user, backup, paths, onProgress) {
  const wanted = new Set(paths);
  const ordered = Object.keys(backup.documents).filter((p) => wanted.has(p));
  let restored = 0;
  const failed = [];

  // a photo whose file is gone comes back from the backup's copy first
  const putFilesBack = async (group) => {
    for (const path of group) {
      const data = backup.documents[path];
      if (!data.__file__) continue;
      // asks the server: the browser keeps its own copy of a photo long after the file has gone
      const alive = await fetch(data.url, { method: "HEAD", cache: "no-store" }).then((r) => r.ok).catch(() => false);
      if (!alive) backup.documents[path] = { ...data, ...(await storePhoto(data.file, data.__file__)) };
    }
  };

  const write = async (group) => {
    await putFilesBack(group);
    return auditedWrite(
      user,
      { area: "access", action: "backup.restore", label: backup.name, details: { documents: group.length, from: backup.createdAt } },
      (batch, auditId) => group.forEach((path) => batch.set(doc(db, path), restoredData(path, backup.documents[path], auditId)))
    );
  };

  for (const group of intoBatches(ordered, backup.documents)) {
    try {
      await write(group);
      restored += group.length;
    } catch (err) {
      console.error("Restore batch refused:", err);
      for (const path of group) {
        try {
          await write([path]);
          restored += 1;
        } catch (one) {
          console.error("Could not restore", path, one);
          failed.push(path);
        }
      }
    }
    onProgress?.({ done: restored + failed.length, total: ordered.length });
  }
  return { restored, failed };
}
