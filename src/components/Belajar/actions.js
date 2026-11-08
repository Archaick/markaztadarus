import { collection, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { auditedWrite } from "../Internal/audit";
import { LESSONS, SECTIONS, sectionType } from "./belajarSchema";

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
