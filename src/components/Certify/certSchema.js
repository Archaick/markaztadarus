import { Timestamp } from "firebase/firestore";

/*
 * Certificates live in two places:
 *  - `certificates`: the admin's records (only admins may read them once the
 *    move below is done), and
 *  - `certificate_public/{CODE}`: what the verification page shows, one
 *    document per code. Anyone may open a single code, nobody may list them,
 *    so the participant list cannot be copied out.
 * `certificate_meta/migration` records that every certificate has been copied
 * over; from then on the rules close public reading of `certificates`.
 */
export const CERTS = "certificates";
export const PUBLIC = "certificate_public";
export const META = "certificate_meta";
export const MIGRATION_DOC = "migration";

export const SITE_ORIGIN = "https://markaztadarus.com";
export const verifyLink = (code) => `${SITE_ORIGIN}/verify/${code}`;

// No 0/O or 1/I/L, so a code read off paper is never ambiguous.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const newCode = (taken) => {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
    if (!taken.has(code)) {
      taken.add(code);
      return code;
    }
  }
};

export const MAX_TEXT = 200;
export const cleanText = (s) =>
  (s || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, MAX_TEXT);

export const normCode = (code) => (code || "").trim().toUpperCase();

const toDate = (v) => (v && typeof v.toDate === "function" ? v.toDate() : v ? new Date(v) : null);
export const certDate = toDate;
const millis = (v) => toDate(v)?.getTime() ?? null;

export const isRevoked = (cert) => cert.status === "revoked";

// Each certificate may carry its name and description in Latin script and in
// Arabic. Arabic pages show the Arabic text, the others the Latin one; either
// falls back to the other when only one was written.
export const CERT_LANGS = ["id", "en", "ar"];
export const certLang = (cert) => (CERT_LANGS.includes(cert?.lang) ? cert.lang : "id");
export const displayName = (cert, lang) =>
  (lang === "ar" ? cert?.nameAr || cert?.name : cert?.name || cert?.nameAr) || "";
export const displayProgram = (cert, lang) =>
  (lang === "ar" ? cert?.programAr || cert?.program : cert?.program || cert?.programAr) || "";
// The label a certificate is grouped and searched under.
export const programKey = (cert) => cert?.program || cert?.programAr || "";

// The fields the verification page needs, nothing more.
export const publicFields = (cert) => ({
  name: cert.name || "",
  nameAr: cert.nameAr || "",
  program: cert.program || "",
  programAr: cert.programAr || "",
  lang: certLang(cert),
  code: normCode(cert.code),
  eventDate: cert.eventDate || null,
  issuedAt: cert.createdAt || null,
  signerIds: Array.isArray(cert.signerIds) ? cert.signerIds : [],
  status: isRevoked(cert) ? "revoked" : "valid",
  revokedReason: isRevoked(cert) ? cert.revokedReason || "" : "",
  title: cert.title || "",
  description: cert.description || "",
});

// Whether the public copy still matches the record (scans are left alone).
export const publicUpToDate = (cert, pub) => {
  if (!pub) return false;
  const want = publicFields(cert);
  return (
    want.name === pub.name &&
    want.nameAr === (pub.nameAr || "") &&
    want.program === pub.program &&
    want.programAr === (pub.programAr || "") &&
    want.lang === (pub.lang || "id") &&
    want.status === pub.status &&
    want.revokedReason === (pub.revokedReason || "") &&
    want.title === (pub.title || "") &&
    want.description === (pub.description || "") &&
    millis(want.eventDate) === millis(pub.eventDate) &&
    millis(want.issuedAt) === millis(pub.issuedAt) &&
    JSON.stringify(want.signerIds) === JSON.stringify(pub.signerIds || [])
  );
};

const pad = (n) => String(n).padStart(2, "0");
export const toDateInput = (value) => {
  const d = toDate(value);
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "";
};
// Noon, so the day never shifts across time zones.
export const fromDateInput = (value) => {
  const [y, m, d] = (value || "").split("-").map(Number);
  return y && m && d ? Timestamp.fromDate(new Date(y, m - 1, d, 12)) : null;
};

export const safeFileName = (s) =>
  (s || "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\- ]+/gu, "") // keeps Arabic letters too
    .trim()
    .replace(/\s+/g, "_")
    .substring(0, 60) || "sertifikat";

const ARABIC = /[؀-ۿ]/;

// People out of an Excel sheet or a pasted list: each row is [latin, arabic]
// (either may be missing). A lone name written in Arabic script goes to the
// Arabic field. Blank rows and repeats are dropped.
export const tidyPeople = (rows) => {
  const seen = new Set();
  const people = [];
  rows.forEach(([first, second]) => {
    let name = cleanText(String(first ?? ""));
    let nameAr = cleanText(String(second ?? ""));
    if (name && !nameAr && ARABIC.test(name)) [name, nameAr] = ["", name];
    const key = `${name}|${nameAr}`.toLowerCase();
    if ((name || nameAr) && !seen.has(key)) {
      seen.add(key);
      people.push({ name, nameAr });
    }
  });
  return people;
};
