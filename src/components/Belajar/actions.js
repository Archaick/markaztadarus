import { collection, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { auditedWrite } from "../Internal/audit";
import { CLASSES, CODES, INVITES, LEARNERS, LESSONS, PROGRESS, SECTIONS, newCode, sectionType } from "./belajarSchema";

// Every write of the learning platform's admin, each recorded in the
// activity history and deletes kept in the recycle bin (see Internal/audit.js).

const entry = (action, label, details, target = "") => ({ area: "belajar", action, label, target, details });

// Firestore refuses `undefined`; questions edited in the browser may carry it
const plain = (value) => JSON.parse(JSON.stringify(value ?? null));

export async function saveLesson(user, lesson, data) {
  const ref = lesson ? doc(db, LESSONS, lesson.id) : doc(collection(db, LESSONS));
  const clean = plain(data);
  await auditedWrite(user, entry(lesson ? "bel.lesson.update" : "bel.lesson.create", clean.title || "", {}, ref.id), (batch, auditId) =>
    lesson
      ? batch.update(ref, { ...clean, auditId, updatedAt: serverTimestamp() })
      : batch.set(ref, { program: "guru", published: false, tamhid: { text: [], themes: [] }, ayat: [], ...clean, auditId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  );
  return ref.id;
}

export async function deleteLesson(user, lesson, sections) {
  await auditedWrite(user, entry("bel.lesson.delete", lesson.title || "", { sections: sections.length }, lesson.id), (batch, _a, markDelete) => {
    sections.forEach((s) => {
      batch.delete(doc(db, SECTIONS, s.id));
      markDelete(`${SECTIONS}~${s.id}`, s.auditId);
    });
    batch.delete(doc(db, LESSONS, lesson.id));
    markDelete(`${LESSONS}~${lesson.id}`, lesson.auditId);
  });
}

const sectionData = (lesson, key, data) => {
  const type = sectionType(key);
  return plain({
    lessonId: lesson.id,
    key,
    kind: type?.kind || "quiz",
    order: type ? undefined : 99,
    reading: [],
    parts: [],
    tasks: [],
    instructions: "",
    ...data,
  });
};

export async function saveSection(user, lesson, section, key, data) {
  const ref = section ? doc(db, SECTIONS, section.id) : doc(collection(db, SECTIONS));
  const clean = sectionData(lesson, key, data);
  await auditedWrite(user, entry(section ? "bel.section.update" : "bel.section.create", `${lesson.title} · ${key}`, {}, ref.id), (batch, auditId) =>
    section
      ? batch.update(ref, { ...clean, auditId, updatedAt: serverTimestamp() })
      : batch.set(ref, { ...clean, auditId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  );
  return ref.id;
}

export async function deleteSection(user, lesson, section) {
  await auditedWrite(user, entry("bel.section.delete", `${lesson.title} · ${section.key}`, {}, section.id), (batch, _a, markDelete) => {
    batch.delete(doc(db, SECTIONS, section.id));
    markDelete(`${SECTIONS}~${section.id}`, section.auditId);
  });
}

// ---------- classes (Kelas), their codes, invites and learners ----------

/** A new class with its own join code (both in one save). */
export async function createClass(user, data) {
  const ref = doc(collection(db, CLASSES));
  const code = newCode();
  await auditedWrite(user, entry("bel.class.create", data.name, { lessons: data.lessonIds.length, code }, ref.id), (batch, auditId) => {
    batch.set(ref, { ...plain(data), code, active: true, program: "guru", auditId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    batch.set(doc(db, CODES, code), { classId: ref.id, active: true, auditId, createdAt: serverTimestamp() });
  });
  return ref.id;
}

export async function updateClass(user, klass, changes, details = {}) {
  await auditedWrite(user, entry("bel.class.update", klass.name, details, klass.id), (batch, auditId) => {
    batch.update(doc(db, CLASSES, klass.id), { ...plain(changes), auditId, updatedAt: serverTimestamp() });
    // the code follows the class being open or closed
    if ("active" in changes) batch.update(doc(db, CODES, klass.code), { active: !!changes.active, auditId, updatedAt: serverTimestamp() });
  });
}

/** A fresh code; the old one stops working at once. */
export async function renewCode(user, klass, oldCodeDoc) {
  const code = newCode();
  await auditedWrite(user, entry("bel.class.update", klass.name, { code }, klass.id), (batch, auditId, markDelete) => {
    batch.update(doc(db, CLASSES, klass.id), { code, auditId, updatedAt: serverTimestamp() });
    batch.set(doc(db, CODES, code), { classId: klass.id, active: klass.active !== false, auditId, createdAt: serverTimestamp() });
    batch.delete(doc(db, CODES, klass.code));
    markDelete(`${CODES}~${klass.code}`, oldCodeDoc?.auditId);
  });
  return code;
}

export async function deleteClass(user, klass, codeDoc) {
  await auditedWrite(user, entry("bel.class.delete", klass.name, {}, klass.id), (batch, _a, markDelete) => {
    batch.delete(doc(db, CODES, klass.code));
    markDelete(`${CODES}~${klass.code}`, codeDoc?.auditId);
    batch.delete(doc(db, CLASSES, klass.id));
    markDelete(`${CLASSES}~${klass.id}`, klass.auditId);
  });
}

/** Invites emails to a class; each one joins it the first time they sign in at /guru. */
export async function inviteEmails(user, klass, emails, existing) {
  await auditedWrite(user, entry("bel.invite", klass.name, { emails: emails.slice(0, 20) }, klass.id), (batch, auditId) =>
    emails.forEach((email) => {
      const before = existing.get(email)?.classIds || [];
      batch.set(doc(db, INVITES, email), { classIds: Array.from(new Set([...before, klass.id])), auditId, updatedAt: serverTimestamp() });
    })
  );
}

export async function removeLearner(user, klass, learner) {
  await auditedWrite(user, entry("bel.learner.remove", learner.name || learner.email, { class: klass.name }, learner.id), (batch, auditId) =>
    batch.update(doc(db, LEARNERS, learner.id), { classIds: (learner.classIds || []).filter((c) => c !== klass.id), auditId, updatedAt: serverTimestamp() })
  );
}

/** The admin's note on a written answer, shown to the teacher. */
export async function saveNote(user, progress, note, label) {
  await auditedWrite(user, entry("bel.note", label, {}, progress.id), (batch, auditId) =>
    batch.update(doc(db, PROGRESS, progress.id), { note: note.slice(0, 2000), noteBy: user?.displayName || user?.email || "", noteAt: serverTimestamp(), auditId })
  );
}
