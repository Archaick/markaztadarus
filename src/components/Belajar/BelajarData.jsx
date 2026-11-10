import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { CLASSES, CODES, INVITES, LEARNERS, LESSONS, SECTIONS, byOrder, bySectionOrder } from "./belajarSchema";

export const DataContext = createContext(null);

export const useBelajar = () => useContext(DataContext);

const live = (name, setter) =>
  onSnapshot(
    collection(db, name),
    (snap) => setter(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error(`Could not load ${name}:`, err);
      setter([]);
    }
  );

/** Everything the admin works with, kept live (`null` while loading). */
export function BelajarProvider({ children }) {
  const [lessons, setLessons] = useState(null);
  const [sections, setSections] = useState(null);
  const [classes, setClasses] = useState(null);
  const [codes, setCodes] = useState(null);
  const [learners, setLearners] = useState(null);
  const [invites, setInvites] = useState(null);

  useEffect(() => {
    const offs = [
      live(LESSONS, (l) => setLessons(l.sort(byOrder))),
      live(SECTIONS, setSections),
      live(CLASSES, (l) => setClasses(l.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))),
      live(CODES, setCodes),
      live(LEARNERS, (l) => setLearners(l.sort((a, b) => (a.name || a.email || "").localeCompare(b.name || b.email || "")))),
      live(INVITES, setInvites),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  const value = useMemo(
    () => ({
      lessons,
      sections,
      classes,
      learners,
      loading: !lessons || !sections,
      lessonById: new Map((lessons || []).map((l) => [l.id, l])),
      classById: new Map((classes || []).map((c) => [c.id, c])),
      codeById: new Map((codes || []).map((c) => [c.id, c])),
      inviteByEmail: new Map((invites || []).map((i) => [i.id, i])),
      sectionsOf: (lessonId) => (sections || []).filter((s) => s.lessonId === lessonId).sort(bySectionOrder),
      learnersOf: (classId) => (learners || []).filter((l) => (l.classIds || []).includes(classId)),
      invitedTo: (classId) => (invites || []).filter((i) => (i.classIds || []).includes(classId)),
    }),
    [lessons, sections, classes, codes, learners, invites]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
