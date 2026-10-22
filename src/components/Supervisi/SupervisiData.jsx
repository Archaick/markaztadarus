import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { INSTRUMENTS, SCHOOLS, SESSIONS, TEACHERS } from "./supervisiSchema";

const DataContext = createContext(null);

export const useSupervisi = () => useContext(DataContext);

const live = (name, setter, order) =>
  onSnapshot(
    order ? query(collection(db, name), orderBy(order, "desc")) : collection(db, name),
    (snap) => setter(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error(`Could not load ${name}:`, err);
      setter([]);
    }
  );

const byName = (a, b) => (a.name || "").localeCompare(b.name || "");

/**
 * Everything the supervision dashboard shows, kept live: schools, teachers,
 * instruments and supervisions (signatures are kept apart and loaded only for
 * a report). `null` while loading.
 */
export function SupervisiProvider({ children }) {
  const [schools, setSchools] = useState(null);
  const [teachers, setTeachers] = useState(null);
  const [instruments, setInstruments] = useState(null);
  const [sessions, setSessions] = useState(null);

  useEffect(() => {
    const offs = [
      live(SCHOOLS, (l) => setSchools(l.sort(byName))),
      live(TEACHERS, (l) => setTeachers(l.sort(byName))),
      live(INSTRUMENTS, setInstruments, "createdAt"),
      live(SESSIONS, setSessions, "updatedAt"),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  const value = useMemo(() => {
    const schoolById = new Map((schools || []).map((s) => [s.id, s]));
    const teacherById = new Map((teachers || []).map((t) => [t.id, t]));
    return {
      schools,
      teachers,
      instruments,
      sessions,
      loading: !schools || !teachers || !instruments || !sessions,
      schoolById,
      teacherById,
      teachersOf: (schoolId) => (teachers || []).filter((t) => t.schoolId === schoolId),
      sessionsOf: (filter) => (sessions || []).filter(filter),
    };
  }, [schools, teachers, instruments, sessions]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
