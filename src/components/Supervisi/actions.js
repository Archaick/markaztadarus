import { collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { auditedWrite } from "../Internal/audit";
import { INSTRUMENTS, PQA_5T, SCHOOLS, SESSIONS, TEACHERS } from "./supervisiSchema";

// Every write of the supervision dashboard, each recorded in the activity
// history (see Internal/audit.js).

export const SIGNATURES = "signatures";
export const SIGN_DOC = "final";

const entry = (action, label, details, target = "") => ({ area: "supervisi", action, label, target, details });

export async function saveSchool(user, school, data) {
  const ref = school ? doc(db, SCHOOLS, school.id) : doc(collection(db, SCHOOLS));
  await auditedWrite(user, entry(school ? "sup.school.update" : "sup.school.create", data.name, { city: data.city }), (batch, auditId) =>
    school
      ? batch.update(ref, { ...data, auditId, updatedAt: serverTimestamp() })
      : batch.set(ref, { ...data, auditId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  );
  return ref.id;
}

export async function deleteSchool(user, school, teachers) {
  await auditedWrite(user, entry("sup.school.delete", school.name, { teachers: teachers.length }), (batch, _a, markDelete) => {
    teachers.forEach((t) => {
      batch.delete(doc(db, TEACHERS, t.id));
      markDelete(`supervisi_teachers~${t.id}`, t.auditId);
    });
    batch.delete(doc(db, SCHOOLS, school.id));
    markDelete(`supervisi_schools~${school.id}`, school.auditId);
  });
}

export async function saveTeacher(user, teacher, data) {
  const ref = teacher ? doc(db, TEACHERS, teacher.id) : doc(collection(db, TEACHERS));
  await auditedWrite(user, entry(teacher ? "sup.teacher.update" : "sup.teacher.create", data.name), (batch, auditId) =>
    teacher
      ? batch.update(ref, { ...data, auditId, updatedAt: serverTimestamp() })
      : batch.set(ref, { ...data, auditId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  );
  return ref.id;
}

export async function deleteTeacher(user, teacher) {
  await auditedWrite(user, entry("sup.teacher.delete", teacher.name), (batch, _a, markDelete) => {
    batch.delete(doc(db, TEACHERS, teacher.id));
    markDelete(`supervisi_teachers~${teacher.id}`, teacher.auditId);
  });
}

/** Saves an instrument; every save is a new version (supervisions keep the copy they used). */
export async function saveInstrument(user, instrument, data) {
  const ref = instrument ? doc(db, INSTRUMENTS, instrument.id) : doc(collection(db, INSTRUMENTS));
  const version = (instrument?.version || 0) + 1;
  await auditedWrite(user, entry(instrument ? "sup.instrument.update" : "sup.instrument.create", data.name?.id || "", { version }), (batch, auditId) =>
    instrument
      ? batch.update(ref, { ...data, version, auditId, updatedAt: serverTimestamp() })
      : batch.set(ref, { ...data, version, auditId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  );
  return ref.id;
}

export const installPqa = (user) => saveInstrument(user, null, { ...PQA_5T, active: true });

export async function deleteInstrument(user, instrument) {
  await auditedWrite(user, entry("sup.instrument.delete", instrument.name?.id || ""), (batch, _a, markDelete) => {
    batch.delete(doc(db, INSTRUMENTS, instrument.id));
    markDelete(`supervisi_instruments~${instrument.id}`, instrument.auditId);
  });
}

/** Stage 1: a new supervision, saved as a draft with its own copy of the instrument. */
export async function createSession(user, data) {
  const ref = doc(collection(db, SESSIONS));
  await auditedWrite(user, entry("sup.session.create", data.teacherName, { school: data.schoolName }), (batch, auditId) =>
    batch.set(ref, {
      ...data,
      scores: {},
      notes: { appreciation: "", followUp: "" },
      status: "draft",
      supervisorEmail: (user?.email || "").toLowerCase(),
      auditId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
  return ref.id;
}

/** Any later save of a supervision; `action` says which step it was. */
export async function updateSession(user, session, changes, action = "sup.session.save", details = {}) {
  await auditedWrite(user, entry(action, session.teacherName, { school: session.schoolName, ...details }), (batch, auditId) =>
    batch.update(doc(db, SESSIONS, session.id), { ...changes, auditId, updatedAt: serverTimestamp() })
  );
}

/** Stage 4: the signatures and the final status, in one save. */
export async function finishSession(user, session, changes, signatures) {
  await auditedWrite(user, entry("sup.session.finish", session.teacherName, { school: session.schoolName, average: changes.average }), (batch, auditId) => {
    batch.update(doc(db, SESSIONS, session.id), { ...changes, status: "done", finishedAt: serverTimestamp(), auditId, updatedAt: serverTimestamp() });
    batch.set(doc(db, SESSIONS, session.id, SIGNATURES, SIGN_DOC), { ...signatures, auditId });
  });
}

export async function deleteSession(user, session) {
  const sign = await getDoc(doc(db, SESSIONS, session.id, SIGNATURES, SIGN_DOC));
  await auditedWrite(user, entry("sup.session.delete", session.teacherName, { school: session.schoolName, status: session.status }), (batch, _a, markDelete) => {
    if (sign.exists()) {
      batch.delete(sign.ref);
      markDelete(`supervisi_sessions~${session.id}~signatures~${SIGN_DOC}`, sign.data().auditId);
    }
    batch.delete(doc(db, SESSIONS, session.id));
    markDelete(`supervisi_sessions~${session.id}`, session.auditId);
  });
}

export const loadSignatures = async (sessionId) => {
  const snap = await getDoc(doc(db, SESSIONS, sessionId, SIGNATURES, SIGN_DOC));
  return snap.exists() ? snap.data() : {};
};
