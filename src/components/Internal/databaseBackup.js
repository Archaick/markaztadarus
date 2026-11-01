import { Bytes, DocumentReference, GeoPoint, Timestamp, collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

// A copy of the whole database in one file, for the super admin: the free
// plan keeps no backups of its own. Every collection the rules allow, with
// the collections inside its documents.
const TREE = [
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

// documents whose inner collections are read at once
const PARALLEL = 8;

// Firestore's own types, written so they can be told apart when loaded back.
function encode(value) {
  if (value instanceof Timestamp) return { __time__: value.toDate().toISOString() };
  if (value instanceof DocumentReference) return { __ref__: value.path };
  if (value instanceof GeoPoint) return { __geo__: [value.latitude, value.longitude] };
  if (value instanceof Bytes) return { __bytes__: value.toBase64() };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
  return value;
}

/**
 * Reads everything and returns it as a JSON file:
 * { project, createdAt, createdBy, count, documents: { "<path>": data } }.
 * Built in pieces, so photos do not make one huge string.
 * `onProgress({ collection, count })` follows along.
 */
export async function buildBackup(email, onProgress) {
  const parts = [];
  let count = 0;
  const add = (snapDoc) => {
    parts.push(`${count ? "," : ""}\n${JSON.stringify(snapDoc.ref.path)}:${JSON.stringify(encode(snapDoc.data()))}`);
    count += 1;
  };

  for (const [name, inner = []] of TREE) {
    onProgress?.({ collection: name, count });
    const snap = await getDocs(collection(db, name));
    snap.docs.forEach(add);
    if (!inner.length) continue;
    for (let i = 0; i < snap.docs.length; i += PARALLEL) {
      const slice = snap.docs.slice(i, i + PARALLEL);
      const subs = await Promise.all(slice.flatMap((d) => inner.map((sub) => getDocs(collection(d.ref, sub)))));
      subs.forEach((s) => s.docs.forEach(add));
      onProgress?.({ collection: name, count });
    }
  }

  const head = { project: "markaz-tadarus", createdAt: new Date().toISOString(), createdBy: email, count };
  const opening = JSON.stringify(head).replace(/}$/, ',"documents":{');
  const blob = new Blob([opening, ...parts, "\n}}\n"], { type: "application/json" });
  return { blob, count };
}
