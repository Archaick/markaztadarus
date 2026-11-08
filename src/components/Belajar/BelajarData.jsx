import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { LESSONS, SECTIONS, SECTION_TYPES, byOrder } from "./belajarSchema";

const DataContext = createContext(null);

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

const sectionRank = (s) => {
  const i = SECTION_TYPES.findIndex((x) => x.key === s.key);
  return i < 0 ? 99 : i;
};

/** The lessons and their sections, kept live (`null` while loading). */
export function BelajarProvider({ children }) {
  const [lessons, setLessons] = useState(null);
  const [sections, setSections] = useState(null);

  useEffect(() => {
    const offs = [live(LESSONS, (l) => setLessons(l.sort(byOrder))), live(SECTIONS, setSections)];
    return () => offs.forEach((off) => off());
  }, []);

  const value = useMemo(
    () => ({
      lessons,
      sections,
      loading: !lessons || !sections,
      lessonById: new Map((lessons || []).map((l) => [l.id, l])),
      sectionsOf: (lessonId) => (sections || []).filter((s) => s.lessonId === lessonId).sort((a, b) => sectionRank(a) - sectionRank(b)),
    }),
    [lessons, sections]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
