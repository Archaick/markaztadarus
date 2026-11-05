// File-upload questions: the files go to the nonprofit's private Shared Drive,
// not the database, and only the response folder's link is saved with the answers
// (see scripts/drive-upload/Code.gs). They stay as they were sent: documentation,
// on 100 TB of Drive, so they are not compressed like images kept in Firestore.

export const FILE = "file";

// The web app's address; public, like the form itself.
const UPLOAD_URL = "https://script.google.com/macros/s/AKfycbxHG9D6e-FUyjOz1f1YA3L8-U0u3nQ7uY3P0Q2NvG47F3A23teAHn_bcEzrW1sNraGFpg/exec";
const CHUNK = 8 * 1024 * 1024; // whole multiples of 256 KB, as Drive asks
const RETRIES = 4;

// Keep these in step with scripts/drive-upload/Code.gs. Labels: builder.fileKinds.<key>.
const KINDS = {
  image: { mime: /^image\//, ext: /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?)$/i, accept: "image/*" },
  video: { mime: /^video\//, ext: /\.(mp4|mov|m4v|avi|mkv|webm|3gp|wmv)$/i, accept: "video/*" },
  audio: { mime: /^audio\//, ext: /\.(mp3|m4a|wav|aac|ogg|opus|flac)$/i, accept: "audio/*" },
  pdf: { mime: /pdf$/, ext: /\.pdf$/i, accept: ".pdf" },
  document: { mime: /word|opendocument\.text|^text\/plain$|rtf/, ext: /\.(docx?|odt|rtf|txt)$/i, accept: ".doc,.docx,.odt,.rtf,.txt" },
  spreadsheet: { mime: /sheet|excel|csv/, ext: /\.(xlsx?|ods|csv)$/i, accept: ".xls,.xlsx,.ods,.csv" },
  presentation: { mime: /presentation|powerpoint/, ext: /\.(pptx?|odp)$/i, accept: ".ppt,.pptx,.odp" },
};
export const FILE_KINDS = Object.keys(KINDS);
export const MAX_FILES_CHOICES = [1, 5, 10];
export const MAX_MB_CHOICES = [10, 100, 500, 1024];
export const FILE_DEFAULTS = { kinds: ["image", "video"], maxFiles: 5, maxMB: 100, nameFrom: "" };

export const fileSettings = (field) => ({ ...FILE_DEFAULTS, ...field });
export const acceptOf = (field) =>
  fileSettings(field)
    .kinds.map((k) => KINDS[k]?.accept)
    .filter(Boolean)
    .join(",");
export const sizeText = (mb) => (mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`);
export const fileSizeText = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Why this file cannot be added to this question: "type", "size", or "" when it can. */
export const fileProblem = (field, file) => {
  const { kinds, maxMB } = fileSettings(field);
  if (!kinds.some((k) => KINDS[k] && (KINDS[k].mime.test(file.type || "") || KINDS[k].ext.test(file.name)))) return "type";
  return file.size > maxMB * 1024 * 1024 ? "size" : "";
};

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// How far Drive got after a piece failed partway (null when it cannot say).
async function resumeFrom(url, size) {
  const res = await fetch(url, { method: "PUT", headers: { "Content-Range": `bytes */${size}` } });
  if (res.status === 200 || res.status === 201) return size;
  const range = res.headers.get("Range");
  if (range) return Number(range.split("-")[1]) + 1;
  return res.status === 308 ? 0 : null;
}

// One file, piece by piece; a dropped connection retries from where Drive got to.
async function sendFile(url, file, onBytes) {
  let from = 0;
  let tries = 0;
  while (from < file.size) {
    const part = file.slice(from, from + CHUNK);
    try {
      const res = await fetch(url, { method: "PUT", headers: { "Content-Range": `bytes ${from}-${from + part.size - 1}/${file.size}` }, body: part });
      if (![200, 201, 308].includes(res.status)) throw new Error(`Drive answered ${res.status}`);
      from += part.size;
      tries = 0;
      onBytes(from);
    } catch (err) {
      tries += 1;
      if (tries > RETRIES) throw err;
      await pause(1000 * 2 ** tries);
      const got = await resumeFrom(url, file.size).catch(() => null);
      if (got !== null) {
        from = got;
        onBytes(from);
      }
    }
  }
}

/**
 * Sends every file of the visited questions to Drive. `answers[id]` holds the
 * chosen File objects. Returns the response folder's link, or "" when no question
 * has files. Throws an error whose `reason` is what the script refused.
 */
export async function uploadAnswerFiles(form, questions, answers, onProgress) {
  const chosen = questions.filter((q) => q.type === FILE).flatMap((q) => (answers[q.id] || []).map((file) => ({ questionId: q.id, file })));
  if (!chosen.length) return "";
  const nameFrom = questions.map((q) => (q.type === FILE ? fileSettings(q).nameFrom : "")).find(Boolean);

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" }, // a simple request, which Apps Script can answer
    body: JSON.stringify({
      action: "begin",
      formId: form.id,
      label: nameFrom ? String(answers[nameFrom] || "") : "",
      origin: window.location.origin,
      files: chosen.map(({ questionId, file }) => ({ questionId, name: file.name, mimeType: file.type, size: file.size })),
    }),
  });
  const started = await res.json();
  if (!started.ok) throw Object.assign(new Error(`Upload refused: ${started.error}`), { reason: started.error });

  const total = chosen.reduce((sum, c) => sum + c.file.size, 0);
  let finished = 0;
  for (const [i, { file }] of chosen.entries()) {
    await sendFile(started.uploads[i], file, (bytes) => onProgress?.((finished + bytes) / total));
    finished += file.size;
  }
  return started.folderUrl;
}
