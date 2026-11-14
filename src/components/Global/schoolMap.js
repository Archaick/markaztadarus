import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { GURU_MAP } from "../Guru/places";

// Tadarus Global's live teachers, by school. Each school the admin pinned has
// a public copy in `school_map/{schoolId}` holding only what the globe shows
// (its name, where it is and its cover), never the join code: the schools
// themselves (belajar_classes) stay private. A teacher's `guru_map` entry
// names their school by id, so the globe counts them there; teachers with no
// school, or whose school has no pin, are counted by province as before.

export const SCHOOL_MAP = "school_map";
// the admin-only teachers' records, read for their names (never stored on the public map)
const LEARNERS = "belajar_learners";

/** "Studying now": the teacher's app touched the map in the last ten minutes. */
export const ACTIVE_MS = 10 * 60 * 1000;

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** A school's location as saved, or null when it has none (or a broken one). */
export function cleanLocation(loc) {
  if (!loc || typeof loc !== "object") return null;
  const lat = num(loc.lat);
  const lng = num(loc.lng);
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const country = typeof loc.country === "string" && loc.country.length === 2 ? loc.country : "ID";
  return {
    country,
    province: country === "ID" ? String(loc.province || "").slice(0, 60) : "",
    city: String(loc.city || "").slice(0, 120),
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
  };
}

/** What the public copy of a pinned school holds (no code, no teachers). */
export const schoolProjection = (school, location) => ({
  name: String(school.name || "").slice(0, 120),
  ...location,
  scene: String(school.scene || "").slice(0, 30),
});

/** Every pinned school, live (public). */
export function useSchoolMap() {
  const [list, setList] = useState([]);
  useEffect(
    () =>
      onSnapshot(
        collection(db, SCHOOL_MAP),
        (snap) => setList(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => cleanLocation(s))),
        () => setList([])
      ),
    []
  );
  return list;
}

/** Teachers on Tadarus Guru, counted by country, province and school (no names are stored on the map). */
export function useGuruMap() {
  const [list, setList] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(
    () =>
      onSnapshot(
        collection(db, GURU_MAP),
        (snap) => setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        () => setList([])
      ),
    []
  );
  return useMemo(() => {
    const byCountry = {};
    const byProvince = {};
    const activeByCountry = {};
    const activeByProvince = {};
    const add = (o, k) => (o[k] = (o[k] || 0) + 1);
    const places = list
      .filter((x) => x.country)
      .map((x) => ({
        id: x.id,
        country: x.country,
        province: x.province || "",
        schoolId: typeof x.schoolId === "string" ? x.schoolId : "",
        active: x.online !== false && now - (x.updatedAt?.toMillis?.() || 0) < ACTIVE_MS,
      }));
    places.forEach((x) => {
      add(byCountry, x.country);
      if (x.province) add(byProvince, x.province);
      if (x.active) {
        add(activeByCountry, x.country);
        if (x.province) add(activeByProvince, x.province);
      }
    });
    return { total: places.length, list: places, byCountry, byProvince, activeByCountry, activeByProvince };
  }, [list, now]);
}

/**
 * The pinned schools with who of theirs is studying now (`active`: their
 * uids), and the active teachers left over (no school, or one with no pin),
 * who are shown by province or country.
 */
export function schoolGroups(teachers, schools) {
  const byId = new Map(schools.map((s) => [s.id, { ...s, at: [s.lng, s.lat], active: [] }]));
  const rest = [];
  teachers.forEach((x) => {
    const school = x.schoolId && byId.get(x.schoolId);
    if (school) {
      if (x.active) school.active.push(x.id);
    } else rest.push(x);
  });
  const list = [...byId.values()].sort((a, b) => b.active.length - a.active.length || a.name.localeCompare(b.name));
  return { schools: list, rest };
}

/**
 * The names of these teachers, for an admin of the teachers (Belajar) only:
 * read from their private records, one by one, and kept while the page is open.
 */
export function useTeacherNames(uids, enabled) {
  const [names, setNames] = useState({});
  const key = enabled ? [...uids].sort().join(",") : "";
  useEffect(() => {
    if (!key) return undefined;
    let gone = false;
    const missing = key.split(",").filter((uid) => uid && !(uid in names));
    missing.forEach((uid) =>
      getDoc(doc(db, LEARNERS, uid))
        .then((snap) => !gone && setNames((n) => ({ ...n, [uid]: snap.exists() ? snap.data().name || snap.data().email || "" : "" })))
        .catch(() => !gone && setNames((n) => ({ ...n, [uid]: "" })))
    );
    return () => {
      gone = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return enabled ? names : {};
}
