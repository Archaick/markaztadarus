import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { CLASSES, CODES, INVITES, LEARNERS, LESSONS, PROGRESS, SECTIONS, normalizeCode, surahState } from "../Belajar/belajarSchema";
import { GURU_MAP } from "./places";

// What a learner sees at /guru: the classes they joined, the surahs those
// classes were given (published ones only), their sections and the
// learner's own progress, all live. Writes go only to their own learner
// record and progress (see firestore.rules).

const LearnerContext = createContext(null);
export const useLearner = () => useContext(LearnerContext);

const chunks = (list, size) => {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

// A teacher who has started signing out: nothing may mark them "studying" again on
// Tadarus Global until the sign-out has finished (the app re-renders, and even
// re-mounts, while it happens, with the account still there for a moment).
let leaving = null;

export function LearnerProvider({ children }) {
  const { user } = useAccess();
  const uid = user?.uid;
  // signed out at last: the next sign-in may be counted again
  if (!uid) leaving = null;
  const email = (user?.email || "").toLowerCase();
  const [learner, setLearner] = useState(undefined); // undefined loading · null none yet
  const [classes, setClasses] = useState({});
  const [lessons, setLessons] = useState({});
  const [sections, setSections] = useState(null);
  const [progressList, setProgressList] = useState(null);
  const claimed = useRef(false);

  // the learner record
  useEffect(() => {
    if (!uid) return undefined;
    // only what the server has confirmed: the classes are read with the
    // rules checking this record, so a join still on its way would be refused
    return onSnapshot(
      doc(db, LEARNERS, uid),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        setLearner(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      },
      (err) => {
        console.error("Could not load the learner:", err);
        setLearner(null);
      }
    );
  }, [uid]);

  const base = useCallback(
    () => ({ uid, email, name: (user?.displayName || "").slice(0, 120), photoURL: user?.photoURL || "", lastSeenAt: serverTimestamp() }),
    [uid, email, user]
  );

  // classes an admin invited this email to join by themselves; and "last seen"
  useEffect(() => {
    if (!uid || learner === undefined || claimed.current) return;
    claimed.current = true;
    (async () => {
      try {
        const invite = await getDoc(doc(db, INVITES, email));
        const have = learner?.classIds || [];
        const extra = invite.exists() ? (invite.data().classIds || []).filter((c) => !have.includes(c)) : [];
        if (!learner && !extra.length) return;
        await setDoc(
          doc(db, LEARNERS, uid),
          { ...base(), classIds: [...have, ...extra], ...(learner ? {} : { joinedAt: serverTimestamp() }) },
          { merge: true }
        );
      } catch (err) {
        console.error("Could not check invites:", err);
      }
    })();
  }, [uid, email, learner, base]);

  const classIds = useMemo(() => learner?.classIds || [], [learner]);
  const classKey = classIds.join(",");

  // each class (one the learner was taken out of simply stops loading)
  useEffect(() => {
    const offs = classIds.map((id) =>
      onSnapshot(
        doc(db, CLASSES, id),
        (snap) => setClasses((c) => ({ ...c, [id]: snap.exists() ? { id, ...snap.data() } : false })),
        () => setClasses((c) => ({ ...c, [id]: false }))
      )
    );
    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classKey]);

  const myClasses = useMemo(() => classIds.map((id) => classes[id]).filter(Boolean), [classIds, classes]);
  const lessonIds = useMemo(() => Array.from(new Set(myClasses.flatMap((c) => c.lessonIds || []))), [myClasses]);
  const lessonKey = lessonIds.join(",");

  // the surahs (an unpublished one is refused by the rules and stays hidden)
  useEffect(() => {
    const offs = lessonIds.map((id) =>
      onSnapshot(
        doc(db, LESSONS, id),
        (snap) => setLessons((l) => ({ ...l, [id]: snap.exists() && snap.data().published ? { id, ...snap.data() } : false })),
        () => setLessons((l) => ({ ...l, [id]: false }))
      )
    );
    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonKey]);

  // their sections
  useEffect(() => {
    if (!lessonIds.length) {
      setSections([]);
      return undefined;
    }
    const parts = chunks(lessonIds, 30);
    const found = parts.map(() => []);
    const offs = parts.map((part, n) =>
      onSnapshot(
        query(collection(db, SECTIONS), where("lessonId", "in", part)),
        (snap) => {
          found[n] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setSections(found.flat());
        },
        (err) => {
          console.error("Could not load sections:", err);
          setSections([]);
        }
      )
    );
    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonKey]);

  // my progress
  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(
      query(collection(db, PROGRESS), where("uid", "==", uid)),
      (snap) => setProgressList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("Could not load progress:", err);
        setProgressList([]);
      }
    );
  }, [uid]);

  /** Joins the class a code belongs to. Returns "ok" | "unknown" | "closed" | "already". */
  const join = useCallback(
    async (raw) => {
      const code = normalizeCode(raw);
      const snap = await getDoc(doc(db, CODES, code));
      if (!snap.exists()) return "unknown";
      if (!snap.data().active) return "closed";
      const classId = snap.data().classId;
      if (classIds.includes(classId)) return "already";
      await setDoc(
        doc(db, LEARNERS, uid),
        { ...base(), classIds: [...classIds, classId], joinCode: code, ...(learner ? {} : { joinedAt: serverTimestamp() }) },
        { merge: true }
      );
      return "ok";
    },
    [uid, classIds, learner, base]
  );

  const progress = useMemo(() => new Map((progressList || []).map((p) => [p.sectionId, p])), [progressList]);

  /** Saves a finished section: best score kept, attempts counted, done once and for good. */
  const saveProgress = useCallback(
    async (section, result) => {
      // a teacher deleted while answering keeps nothing: they start over if invited again
      if (!learner) return;
      const old = progress.get(section.id);
      const data = {
        uid,
        lessonId: section.lessonId,
        sectionId: section.id,
        sectionKey: section.key,
        done: true,
        updatedAt: serverTimestamp(),
        attempts: (old?.attempts || 0) + 1,
        ...(old?.doneAt ? {} : { doneAt: serverTimestamp() }),
      };
      if (result.max) Object.assign(data, { best: Math.max(old?.best || 0, result.score), last: result.score, max: result.max });
      if (result.answers) Object.assign(data, { answers: result.answers, submittedAt: serverTimestamp() });
      await setDoc(doc(db, PROGRESS, `${uid}_${section.id}`), data, { merge: true });
    },
    [uid, learner, progress]
  );

  // the school they are counted at on Tadarus Global: the one they joined last that is still there
  const schoolId = myClasses.length ? myClasses[myClasses.length - 1].id : "";
  // their place on the Tadarus Global map: a country, province and school only, never a name
  const mapEntry = useCallback(
    (c, online = true) =>
      online && leaving === uid
        ? Promise.resolve()
        : setDoc(doc(db, GURU_MAP, uid), { country: c.country, province: c.country === "ID" ? c.province || "" : "", schoolId, online, updatedAt: serverTimestamp() }),
    [uid, schoolId]
  );
  // their school known (or changed) while they study: the map follows at once, not at the next heartbeat
  const mappedSchool = useRef(null);
  useEffect(() => {
    if (!uid || !learner?.country || !schoolId || mappedSchool.current === schoolId) return;
    mappedSchool.current = schoolId;
    if (typeof document !== "undefined" && document.visibilityState === "visible") mapEntry(learner).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, schoolId]);
  // left the app (tab hidden, closed or signed out): no longer "studying now" on Tadarus Global
  // `signingOut`: the account is leaving for good, so nothing marks it online again before it has gone
  const offline = useCallback(
    (signingOut = false) => {
      if (signingOut === true && uid) leaving = uid;
      return uid && learner?.country ? mapEntry(learner, false).catch(() => {}) : Promise.resolve();
    },
    [uid, learner, mapEntry]
  );
  const touch = useCallback(() => {
    if (!uid || !learner) return null;
    updateDoc(doc(db, LEARNERS, uid), { lastSeenAt: serverTimestamp() }).catch(() => {});
    // a map entry lost (e.g. the teacher was restored from the bin) comes back by itself
    if (learner.country) mapEntry(learner).catch(() => {});
    return null;
  }, [uid, learner, mapEntry]);

  /** Name, country, province and city, asked once after joining. */
  const saveProfile = useCallback(
    async (p) => {
      const place = { name: p.name.trim().slice(0, 120), country: p.country, province: p.country === "ID" ? p.province : "", city: p.city.trim().slice(0, 120) };
      await updateDoc(doc(db, LEARNERS, uid), { ...place, updatedAt: serverTimestamp() });
      await mapEntry(place).catch(() => {});
    },
    [uid, mapEntry]
  );

  const value = useMemo(() => {
    const surahs = lessonIds.map((id) => lessons[id]).filter(Boolean);
    const list = sections || [];
    const states = surahs.map((lesson) => ({ lesson, ...surahState(list, lesson.id, progress) }));
    const done = states.reduce((n, s) => n + s.done, 0);
    const total = states.reduce((n, s) => n + s.total, 0);
    const next = states.find((s) => s.next) || null;
    return {
      learner,
      classes: myClasses,
      surahs: states,
      sections: list,
      progress,
      overall: { done, total, percent: total ? Math.round((done / total) * 100) : 0 },
      next: next ? { lesson: next.lesson, step: next.next } : null,
      loading: learner === undefined || (classIds.length > 0 && (classIds.some((id) => classes[id] === undefined) || sections === null || progressList === null || lessonIds.some((id) => lessons[id] === undefined))),
      join,
      saveProfile,
      saveProgress,
      touch,
      offline,
    };
  }, [learner, myClasses, classes, lessonIds, lessons, sections, progress, progressList, classIds, join, saveProgress, touch, offline, saveProfile]);

  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>;
}
