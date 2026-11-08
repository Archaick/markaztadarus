import { Bytes, DocumentReference, GeoPoint, Timestamp, collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

// A copy of the whole database in one file, for the super admin: the free
// plan keeps no backups of its own. Every collection the rules allow, with
// the collections inside its documents.
export const TREE = [
  ["internal_admins"],
  ["internal_audit"],
  ["internal_audit_marks"],
  ["internal_trash", ["trash_items"]],
  ["internal_settings"],
  ["certificates", ["snapshot"]],
  ["certificate_public"],
  ["certificate_meta"],
  ["certificate_designs"],
  ["certificate_design_public"],
  ["certificate_signers"],
  ["redirect_manager_links"],
  ["redirect_public"],
  ["site_content"],
  ["site_private"],
  ["posts", ["images", "thumbs"]],
  ["supervisi_schools"],
  ["supervisi_teachers"],
  ["supervisi_settings"],
  ["supervisi_instruments"],
  ["supervisi_sessions", ["signatures"]],
  ["forms", ["media", "private", "responses"]],
];

// The learning platform (/belajar) is backed up apart, from its own page.
export const BELAJAR_TREE = [["belajar_lessons"], ["belajar_sections"], ["belajar_classes"], ["belajar_codes"], ["belajar_invites"], ["belajar_learners"], ["belajar_progress"]];

// documents whose inner collections are read at once
const PARALLEL = 8;

// Firestore's own types, written so they can be told apart when loaded back.
export function encode(value) {
  if (value instanceof Timestamp) return { __time__: value.toDate().toISOString() };
  if (value instanceof DocumentReference) return { __ref__: value.path };
  if (value instanceof GeoPoint) return { __geo__: [value.latitude, value.longitude] };
  if (value instanceof Bytes) return { __bytes__: value.toBase64() };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
  return value;
}

/** Which part of the system a document belongs to, by its top collection. */
export const areaOfPath = (path) => {
  const top = path.split("/")[0];
  if (top.startsWith("certificate")) return "certificates";
  if (top === "forms") return "forms";
  if (top === "posts") return "news";
  if (top.startsWith("supervisi")) return "supervision";
  if (top.startsWith("belajar")) return "learning";
  if (top.startsWith("redirect")) return "links";
  if (top.startsWith("site_")) return "site";
  if (top === "internal_admins" || top === "internal_settings") return "admins";
  return "history";
};

// Every document of `tree` (the site's by default), one at a time.
async function readAll(onDoc, onProgress, tree = TREE) {
  let count = 0;
  const add = async (snapDoc) => {
    await onDoc(snapDoc, count);
    count += 1;
  };
  for (const [name, inner = []] of tree) {
    onProgress?.({ collection: name, count });
    const snap = await getDocs(collection(db, name));
    for (const d of snap.docs) await add(d);
    if (!inner.length) continue;
    for (let i = 0; i < snap.docs.length; i += PARALLEL) {
      const slice = snap.docs.slice(i, i + PARALLEL);
      const subs = await Promise.all(slice.flatMap((d) => inner.map((sub) => getDocs(collection(d.ref, sub)))));
      for (const s of subs) for (const d of s.docs) await add(d);
      onProgress?.({ collection: name, count });
    }
  }
  return count;
}

/** Every document as it is now: path to its encoded data. */
export async function readCurrent(onProgress, tree = TREE) {
  const current = new Map();
  await readAll((d) => current.set(d.ref.path, encode(d.data())), onProgress, tree);
  return current;
}

// ---------- How much is stored ----------
// The free plan shows no figure a page can read, so it is added up from the
// documents: a whole read, as for a backup, so on its own at most once a day,
// and once a week when there is enough that the download itself starts to count.

export const STORAGE_LIMIT = 1024 * 1024 * 1024;
const DAY = 24 * 60 * 60 * 1000;
const WEEKLY_FROM = 100 * 1024 * 1024;
export const storageIsStale = (saved) =>
  !saved?.at || Date.now() - saved.at.toMillis() > (saved.bytes >= WEEKLY_FROM ? 7 * DAY : DAY);
// "storage" for the site, "storage_belajar" for the learning platform
const storageRef = (name = "storage") => doc(db, "internal_settings", name);
const encoder = new TextEncoder();

// Firestore's own measure: the path, the data and 32 bytes of its own.
const bytesOf = (path, json) => encoder.encode(path).length + encoder.encode(json).length + 32;

function tally() {
  const areas = {};
  let bytes = 0;
  let count = 0;
  return {
    add(path, json) {
      const size = bytesOf(path, json);
      const area = (areas[areaOfPath(path)] ||= { bytes: 0, count: 0 });
      area.bytes += size;
      area.count += 1;
      bytes += size;
      count += 1;
    },
    result: () => ({ bytes, count, areas }),
  };
}

export async function loadStorage(name) {
  const snap = await getDoc(storageRef(name));
  return snap.exists() ? snap.data() : null;
}

/** Saves the figure; it still shows if saving fails. */
async function saveStorage(usage, name) {
  const at = Timestamp.now();
  try {
    await setDoc(storageRef(name), { ...usage, at: serverTimestamp() });
  } catch (err) {
    console.error("Could not save the storage figure:", err);
  }
  return { ...usage, at };
}

/** `scope` (see scope.js) says which documents and where the figure is kept. */
export async function countStorage(onProgress, scope) {
  const sum = tally();
  await readAll((d) => sum.add(d.ref.path, JSON.stringify(encode(d.data()))), onProgress, scope?.tree);
  return saveStorage(sum.result(), scope?.storageDoc);
}

// A photo in Cloud Storage goes into the file too (__file__), so a backup is
// still everything. One that cannot be read stops the backup: better no file
// than one that looks complete and is not.
async function withFile(data) {
  if (!data.url || !data.file) return data;
  const res = await fetch(data.url);
  if (!res.ok) throw new Error(`Could not read ${data.file}: ${res.status}`);
  const blob = await res.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return { ...data, __file__: dataUrl };
}

/**
 * Reads everything and returns it as a JSON file:
 * { project, createdAt, createdBy, count, documents: { "<path>": data } }.
 * Built in pieces, so photos do not make one huge string.
 * `onProgress({ collection, count })` follows along.
 */
export async function buildBackup(email, onProgress, scope) {
  const parts = [];
  const sum = tally();
  const count = await readAll(async (snapDoc, index) => {
    const json = JSON.stringify(await withFile(encode(snapDoc.data())));
    parts.push(`${index ? "," : ""}\n${JSON.stringify(snapDoc.ref.path)}:${json}`);
    sum.add(snapDoc.ref.path, JSON.stringify(encode(snapDoc.data())));
  }, onProgress, scope?.tree);

  // `scope` tells a site backup from a learning-platform one when it is put back
  const head = { project: "markaz-tadarus", scope: scope?.key || "site", createdAt: new Date().toISOString(), createdBy: email, count };
  const opening = JSON.stringify(head).replace(/}$/, ',"documents":{');
  const blob = new Blob([opening, ...parts, "\n}}\n"], { type: "application/json" });
  return { blob, count, usage: await saveStorage(sum.result(), scope?.storageDoc) };
}
