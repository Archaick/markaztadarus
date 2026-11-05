// Markaz Tadarus Forms: file uploads into the nonprofit's private Shared Drive.
// A Google Apps Script web app (Execute as: Me, Who has access: Anyone), because
// the site has no server of its own. It checks a form accepts the files, makes
// the response's folder and opens a resumable upload for each file; the browser
// then sends the bytes straight to Drive. Only the folder's link is saved.
//
//   Markaz Tadarus Forms / <form title> / 2026-11-05 14.30 - <name>
//
// After changing this file: Deploy > Manage deployments > edit > New version.
// The address stays the same.

const ROOT_FOLDER_ID = '0ACfd0c48tjRDUk9PVA';
const FORMS_URL = 'https://firestore.googleapis.com/v1/projects/markaz-tadarus/databases/(default)/documents/forms/';
const TIME_ZONE = 'Asia/Jakarta';
const MAX_UPLOADS_PER_HOUR = 300; // per form: a limit on someone hammering it
const MAX_MB_ALLOWED = 1024;

// Local testing against a form that only exists on the emulator. Off when empty,
// and it stops by itself after the date.
const TEST_KEY = '';
const TEST_UNTIL = '2026-11-12';

// Keep these in step with src/components/Forms/fileUpload.js.
const KINDS = {
  image: { mime: /^image\//, ext: /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?)$/i },
  video: { mime: /^video\//, ext: /\.(mp4|mov|m4v|avi|mkv|webm|3gp|wmv)$/i },
  audio: { mime: /^audio\//, ext: /\.(mp3|m4a|wav|aac|ogg|opus|flac)$/i },
  pdf: { mime: /pdf$/, ext: /\.pdf$/i },
  document: { mime: /word|opendocument\.text|^text\/plain$|rtf/, ext: /\.(docx?|odt|rtf|txt)$/i },
  spreadsheet: { mime: /sheet|excel|csv/, ext: /\.(xlsx?|ods|csv)$/i },
  presentation: { mime: /presentation|powerpoint/, ext: /\.(pptx?|odp)$/i },
};

const reply = (data) => ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
const refuse = (error) => ({ ok: false, error });

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    return reply(body.action === 'begin' ? begin(body) : refuse('action'));
  } catch (err) {
    console.error(err);
    return reply(refuse('failed'));
  }
}

// A Firestore REST value as a plain value.
function plain(value) {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(plain);
  if ('mapValue' in value) {
    const out = {};
    Object.entries(value.mapValue.fields || {}).forEach(([k, v]) => (out[k] = plain(v)));
    return out;
  }
  return undefined;
}

// The form as anyone may read it; the rules hide drafts.
function loadForm(formId) {
  if (!/^[a-z0-9-]{1,80}$/i.test(formId || '')) return null;
  const res = UrlFetchApp.fetch(FORMS_URL + encodeURIComponent(formId), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  return plain({ mapValue: { fields: JSON.parse(res.getContentText()).fields } });
}

function testing(body) {
  return !!TEST_KEY && body.key === TEST_KEY && new Date() < new Date(TEST_UNTIL);
}

function isAllowed(question, file) {
  const kinds = question.kinds && question.kinds.length ? question.kinds : ['image', 'video'];
  return kinds.some((k) => KINDS[k] && (KINDS[k].mime.test(file.mimeType || '') || KINDS[k].ext.test(file.name || '')));
}

// Every file is checked against its question before anything is made.
function check(form, files) {
  if (form.status !== 'open') return 'closed';
  if (!Array.isArray(files) || !files.length) return 'nothing';
  const questions = {};
  (form.fields || []).forEach((f) => {
    if (f.type === 'file') questions[f.id] = f;
  });
  const counts = {};
  for (const file of files) {
    const q = questions[file.questionId];
    if (!q) return 'question';
    counts[q.id] = (counts[q.id] || 0) + 1;
    if (counts[q.id] > (Number(q.maxFiles) || 5)) return 'count';
    const size = Number(file.size);
    const maxMb = Math.min(Number(q.maxMB) || 100, MAX_MB_ALLOWED);
    if (!(size > 0) || size > maxMb * 1024 * 1024) return 'size';
    if (!isAllowed(q, file)) return 'type';
  }
  return '';
}

function underLimit(formId, count) {
  const cache = CacheService.getScriptCache();
  const key = 'count:' + formId;
  const used = Number(cache.get(key)) || 0;
  if (used + count > MAX_UPLOADS_PER_HOUR) return false;
  cache.put(key, String(used + count), 3600);
  return true;
}

const cleanName = (value, fallback) =>
  String(value || '')
    .replace(/[\u0000-\u001f/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || fallback;

// One folder per form, found by its id so renaming the form keeps it.
function formFolder(form, formId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const props = PropertiesService.getScriptProperties();
    const key = 'form:' + formId;
    const known = props.getProperty(key);
    if (known) {
      try {
        const folder = DriveApp.getFolderById(known);
        if (!folder.isTrashed()) return folder;
      } catch (err) {
        console.warn('Form folder is gone, making a new one', err);
      }
    }
    const folder = DriveApp.getFolderById(ROOT_FOLDER_ID).createFolder(cleanName(form.title, formId));
    props.setProperty(key, folder.getId());
    return folder;
  } finally {
    lock.releaseLock();
  }
}

function openUpload(file, folderId, origin) {
  const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'X-Upload-Content-Type': file.mimeType || 'application/octet-stream',
      'X-Upload-Content-Length': String(file.size),
      Origin: origin, // Drive then lets this page send the bytes
    },
    payload: JSON.stringify({ name: cleanName(file.name, 'file'), parents: [folderId] }),
    muteHttpExceptions: true,
    followRedirects: false,
  });
  const headers = res.getAllHeaders();
  const url = headers.Location || headers.location;
  if (!url) throw new Error('No upload address: ' + res.getResponseCode() + ' ' + res.getContentText().slice(0, 200));
  return url;
}

function begin(body) {
  const form = testing(body) ? body.testForm : loadForm(body.formId);
  if (!form) return refuse('form');
  const problem = check(form, body.files);
  if (problem) return refuse(problem);
  if (!underLimit(body.formId, body.files.length)) return refuse('busy');

  const when = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd HH.mm');
  const name = when + ' - ' + cleanName(body.label, 'Response ' + Utilities.getUuid().slice(0, 6));
  const folder = formFolder(form, body.formId).createFolder(name);
  const uploads = body.files.map((file) => openUpload(file, folder.getId(), body.origin));
  return { ok: true, folderUrl: 'https://drive.google.com/drive/folders/' + folder.getId(), uploads };
}
