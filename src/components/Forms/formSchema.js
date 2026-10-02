export const FORMS_COLLECTION = "forms";
export const RESPONSES = "responses";

// Labels live in public/locales/*/internal/Forms.json under types.<value>.
export const FIELD_TYPES = ["short", "long", "number", "phone", "date", "choice", "checkbox"];

export const HAS_OPTIONS = new Set(["choice", "checkbox"]);

// Labels and hints live under status.<key> in the Forms translations.
export const STATUS_COLORS = { draft: "gray", open: "teal", closed: "red" };
export const STATUSES = Object.keys(STATUS_COLORS);

export const MAX_LENGTH = { short: 300, long: 3000, phone: 30, number: 30, date: 20 };

const randomId = () => Math.random().toString(36).slice(2, 10);

export const newId = randomId;

// `optionLabel(n)` names the starter options in the admin's language.
export const newField = (type = "short", optionLabel = (n) => `Option ${n}`) => ({
  id: randomId(),
  type,
  label: "",
  required: true,
  ...(HAS_OPTIONS.has(type) ? { options: [optionLabel(1)] } : {}),
});

const field = (type, label, extra = {}) => ({ ...newField(type), label, ...extra });

// Picker labels live under templates.<key> in the Forms translations; the
// questions themselves are content, written in the form's own language.
export const TEMPLATES = [
  {
    key: "blank",
    build: (language) => ({
      title: "",
      description: "",
      language,
      fields: [newField("short")],
    }),
  },
  {
    key: "komitmen-tadarus",
    build: () => ({
      title: "Komitmen Pelaksanaan Tadarus",
      language: "id",
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

// Returns the public.errors.<key> for one answer, or "" when it is fine.
export const answerError = (fieldDef, value) => {
  if (isEmptyAnswer(value)) return fieldDef.required ? "required" : "";
  if (fieldDef.type === "number" && !/^-?\d+([.,]\d+)?$/.test(String(value).trim())) {
    return "number";
  }
  if (fieldDef.type === "phone") {
    const count = digits(value).length;
    if (count < 8 || count > 15) return "phone";
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

// `labels` = { submitted, removed: (id) => string } in the admin's language
export const responsesToCsv = (fields, responses, formatTime, labels) => {
  const known = new Set(fields.map((f) => f.id));
  const extra = Array.from(
    new Set(responses.flatMap((r) => Object.keys(r.answers || {}).filter((k) => !known.has(k))))
  );
  const header = [labels.submitted, ...fields.map((f) => f.label || "—"), ...extra.map(labels.removed)];
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

// --- cover image ----------------------------------------------------------------

// Stored as a JPEG data URL in forms/{id}/media/cover (no Storage bucket on
// this project). The form keeps coverVersion so pages know to load it.
export const MEDIA = "media";
export const COVER_DOC = "cover";
export const COVER_MAX_CHARS = 700000; // well under Firestore's 1 MiB per document

export const COVER_POSITIONS = ["top", "center", "bottom"]; // labels: cover.<value>

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });

// Scales a photo down and re-encodes it as JPEG until it fits COVER_MAX_CHARS.
export const compressCover = async (file) => {
  const img = await loadImage(file);
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  const fit = Math.min(1, 1800 / width, 1200 / height);
  width = Math.round(width * fit);
  height = Math.round(height * fit);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  for (let attempt = 0; attempt < 6; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "#ffffff"; // transparent PNGs would turn black as JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    for (let quality = 0.85; quality >= 0.55; quality -= 0.1) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= COVER_MAX_CHARS) return dataUrl;
    }
    width = Math.round(width * 0.8);
    height = Math.round(height * 0.8);
  }
  throw new Error("too-large");
};
