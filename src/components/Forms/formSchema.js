export const FORMS_COLLECTION = "forms";
export const RESPONSES = "responses";

export const FIELD_TYPES = [
  { value: "short", label: "Short answer" },
  { value: "long", label: "Paragraph" },
  { value: "number", label: "Number" },
  { value: "phone", label: "WhatsApp / phone" },
  { value: "date", label: "Date" },
  { value: "choice", label: "Multiple choice (one)" },
  { value: "checkbox", label: "Checkboxes (many)" },
];

export const HAS_OPTIONS = new Set(["choice", "checkbox"]);

export const STATUS = {
  draft: { label: "Draft", color: "gray", hint: "Only admins can see it." },
  open: { label: "Open", color: "teal", hint: "Anyone with the link can answer." },
  closed: { label: "Closed", color: "red", hint: "The link shows the form is closed." },
};

export const MAX_LENGTH = { short: 300, long: 3000, phone: 30, number: 30, date: 20 };

const randomId = () => Math.random().toString(36).slice(2, 10);

export const newField = (type = "short") => ({
  id: randomId(),
  type,
  label: "",
  required: true,
  ...(HAS_OPTIONS.has(type) ? { options: ["Option 1"] } : {}),
});

const field = (type, label, extra = {}) => ({ ...newField(type), label, ...extra });

export const TEMPLATES = [
  {
    key: "blank",
    title: "Blank form",
    description: "Start from nothing.",
    build: () => ({
      title: "Untitled form",
      description: "",
      fields: [newField("short")],
    }),
  },
  {
    key: "komitmen-tadarus",
    title: "Komitmen Pelaksanaan Tadarus",
    description: "Identitas peserta Duta Qur'an dan rencana Tadarus di Indonesia.",
    build: () => ({
      title: "Komitmen Pelaksanaan Tadarus",
      description:
        "Formulir komitmen bagi peserta Program Duta Qur'an Mekah untuk melaksanakan Tadarus di Indonesia.",
      fields: [
        field("short", "Nama", { placeholder: "Nama lengkap" }),
        field("number", "Umur", { placeholder: "Contoh: 27" }),
        field("long", "Alamat", { placeholder: "Alamat lengkap (kota/kabupaten, provinsi)" }),
        field("phone", "No. WA", { placeholder: "08xxxxxxxxxx" }),
        field("short", "Pendidikan Terakhir dan Jurusan", { placeholder: "Contoh: S1 Ilmu Al-Qur'an dan Tafsir" }),
        field("short", "Pekerjaan"),
        field("long", "Aktivitas Dakwah"),
        field("number", "Peserta Program Duta Qur'an Mekah Tahun", { placeholder: "Contoh: 2025" }),
        field("long", "Rencana pelaksanaan Tadarus di Indonesia"),
        field(
          "choice",
          "Dengan ini saya komitmen akan memberikan foto dokumentasi dan informasi mengenai pelaksanaan Tadarus, apabila diminta oleh Markaz Tadarus Indonesia",
          { options: ["Ya", "Tidak"] }
        ),
      ],
    }),
  },
];

export const slugify = (value) =>
  (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const isValidSlug = (value) => /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/.test(value || "");

export const formLink = (formId) => `${window.location.origin}/form/${formId}`;

// --- answers ---------------------------------------------------------------

export const isEmptyAnswer = (value) =>
  value === undefined || value === null || (Array.isArray(value) ? value.length === 0 : String(value).trim() === "");

const digits = (value) => String(value || "").replace(/\D/g, "");

// Returns an Indonesian-language error for one answer, or "" when it is fine.
export const answerError = (fieldDef, value) => {
  if (isEmptyAnswer(value)) return fieldDef.required ? "Pertanyaan ini wajib diisi." : "";
  if (fieldDef.type === "number" && !/^-?\d+([.,]\d+)?$/.test(String(value).trim())) {
    return "Masukkan angka saja.";
  }
  if (fieldDef.type === "phone") {
    const count = digits(value).length;
    if (count < 8 || count > 15) return "Nomor WhatsApp tidak valid.";
  }
  return "";
};

export const cleanAnswers = (fields, answers) => {
  const out = {};
  fields.forEach((f) => {
    const value = answers[f.id];
    if (isEmptyAnswer(value)) return;
    if (Array.isArray(value)) {
      out[f.id] = value.filter((v) => (f.options || []).includes(v));
    } else {
      out[f.id] = String(value).trim().slice(0, MAX_LENGTH[f.type] || 300);
    }
  });
  return out;
};

// 0812-3456-789 → 628123456789 for wa.me links
export const whatsappNumber = (value) => {
  let d = digits(value);
  if (d.startsWith("0")) d = `62${d.slice(1)}`;
  else if (d.startsWith("8")) d = `62${d}`;
  return d;
};

export const displayAnswer = (value) =>
  Array.isArray(value) ? value.join(", ") : value === undefined || value === null ? "" : String(value);

// --- export ------------------------------------------------------------------

const csvCell = (value) => {
  const text = displayAnswer(value).replace(/\r?\n/g, " ");
  return /[",;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const responsesToCsv = (fields, responses, formatTime) => {
  const known = new Set(fields.map((f) => f.id));
  const extra = Array.from(
    new Set(responses.flatMap((r) => Object.keys(r.answers || {}).filter((k) => !known.has(k))))
  );
  const header = ["Submitted at", ...fields.map((f) => f.label || "(untitled)"), ...extra.map((k) => `Removed question ${k}`)];
  const rows = responses.map((r) => [
    formatTime(r.submittedAt),
    ...fields.map((f) => r.answers?.[f.id]),
    ...extra.map((k) => r.answers?.[k]),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
};

export const downloadText = (filename, text, type = "text/csv;charset=utf-8") => {
  // BOM so Excel opens UTF-8 (Arabic, accents) correctly
  const blob = new Blob(["﻿", text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
