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
export const verifyCaption = (code) => `markaztadarus.com/verify/${code}`;

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

// The fields the verification page needs, nothing more.
export const publicFields = (cert) => ({
  name: cert.name || "",
  program: cert.program || "",
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
    want.program === pub.program &&
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
    .normalize("NFKD")
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .substring(0, 60) || "sertifikat";

// Names out of an Excel column or a pasted list: one per row, blanks and
// repeats dropped, extra spaces removed.
export const tidyNames = (values) => {
  const seen = new Set();
  const names = [];
  values.forEach((value) => {
    const name = cleanText(String(value ?? ""));
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  });
  return names;
};
