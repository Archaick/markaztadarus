import { cleanText, normCode } from "../certSchema";
import { resolveCertificateSigners } from "../signerUtils";
import { DEFAULT_CERTIFICATE } from "./CertificateSheet";

/*
 * Certificate Studio: a design is one event's certificate (its words, logos,
 * signers and numbering). Each participant issued from it is an ordinary
 * certificate (in `certificates` and `certificate_public`, so its QR code
 * opens /verify like every other) that also carries `designId`, `kind:
 * "studio"`, its running `seq` and its printed `number`. The printed page is
 * drawn from the design when it is downloaded, so fixing a typo in the design
 * fixes every certificate of that event.
 */

export const DESIGNS = "certificate_designs";
export const STUDIO = "studio";
export const MAX_LOGOS = 4;
export const MAX_SIGNERS = 3;
export const MAX_DESCRIPTION = 600;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const pad = (n) => String(n).padStart(2, "0");
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** A new design: the original Markaz Tadarus wording, numbered like 001/MTI/SERT/X/2026. */
export const newDesign = () => {
  const d = new Date();
  return {
    name: "",
    title: DEFAULT_CERTIFICATE.title,
    numberLabel: DEFAULT_CERTIFICATE.numberLabel,
    numberPattern: `{no}/MTI/SERT/${ROMAN[d.getMonth()]}/${d.getFullYear()}`,
    givenTo: DEFAULT_CERTIFICATE.givenTo,
    description: DEFAULT_CERTIFICATE.description,
    place: DEFAULT_CERTIFICATE.place,
    issueDate: today(),
    eventDate: "",
    signerIds: [],
    showInk: true,
    logos: [],
    seal: true,
  };
};

/** The design's fields, tidied for saving. */
export const cleanDesign = (d) => ({
  name: cleanText(d.name),
  title: cleanText(d.title),
  numberLabel: cleanText(d.numberLabel),
  numberPattern: cleanText(d.numberPattern),
  givenTo: cleanText(d.givenTo),
  // the sentence keeps its own length limit (cleanText stops at 200)
  description: String(d.description || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, MAX_DESCRIPTION),
  place: cleanText(d.place),
  issueDate: d.issueDate || "",
  eventDate: d.eventDate || "",
  signerIds: (d.signerIds || []).slice(0, MAX_SIGNERS),
  showInk: d.showInk !== false,
  logos: (d.logos || []).slice(0, MAX_LOGOS),
  seal: d.seal !== false,
});

/** "{no}/MTI/SERT/X/2026" for participant 7 → "007/MTI/SERT/X/2026". */
export const numberFor = (pattern, seq) => {
  const no = String(seq).padStart(3, "0");
  const p = pattern || "{no}";
  return p.includes("{no}") ? p.replace(/\{no\}/g, no) : `${p}${p ? "-" : ""}${no}`;
};

/** "2026-10-30" → "30 Oktober 2026" (the certificate is written in Indonesian). */
export const longDate = (value) => {
  const [y, m, d] = String(value || "").split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(y, m - 1, d, 12));
};

/** What the certificate shows, for a design and (optionally) one participant's certificate. */
export const sheetData = (design, cert, signers) => {
  // none picked: the default signers, as on the verification page
  const chosen = resolveCertificateSigners({ signerIds: design.signerIds || [] }, signers || []).slice(0, MAX_SIGNERS);
  return {
    title: design.title,
    numberLabel: design.numberLabel,
    number: cert?.number || "",
    givenTo: design.givenTo,
    name: cert ? cert.name || cert.nameAr || "" : "",
    description: design.description,
    place: design.place,
    issueDate: longDate(design.issueDate),
    signers: chosen.map((s) => ({
      name: s.name,
      role: s.position,
      signature: design.showInk !== false ? s.signatureImg || "" : "",
      stamp: design.showInk !== false ? s.stampImg || "" : "",
    })),
    logos: design.logos || [],
    seal: design.seal !== false,
    code: cert ? normCode(cert.code) : "",
  };
};

export const certsOf = (certs, designId) =>
  (certs || []).filter((c) => c.designId === designId).sort((a, b) => (a.seq || 0) - (b.seq || 0));
