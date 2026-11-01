import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { countryByCode } from "./globalData";

/*
 * Tadarus Live: a partner place (one of Indonesia's map locations, or a city
 * of another country) may hold an online Tadarus. Its `session` is public:
 *   { title, days: [0-6, Sunday 0], start: "19:30", end: "21:00", utc: 7,
 *     liveUntil: ms, activity: url, zoomPublic: bool, zoom: url (only when public) }
 * Whether it is live is worked out from the clock in the browser, so it costs
 * no reads. The Zoom link itself is kept in `site_private/links` (admins only)
 * under the place's `id`, and copied into the public session only when the
 * admin switches "show on /global" on.
 */

export const PRIVATE_COLLECTION = "site_private";
export const LINKS_DOC = "links";

// Indonesia's three zones; other countries pick a UTC offset
export const ID_ZONES = [
  { value: 7, label: "WIB" },
  { value: 8, label: "WITA" },
  { value: 9, label: "WIT" },
];
export const OFFSETS = Array.from({ length: 27 }, (_, i) => i - 12);
// WIB/WITA/WIT in Indonesia, a UTC offset elsewhere
export const zoneLabel = (utc, indonesia = true) =>
  (indonesia && ID_ZONES.find((z) => z.value === utc)?.label) || `UTC${utc >= 0 ? "+" : "−"}${Math.abs(utc)}`;

// Monday first, as the week is read in Indonesia
export const WEEK = [1, 2, 3, 4, 5, 6, 0];
export const LIVE_HOURS = 2;

export const newId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

/** An https link, tidied; "" when it is not one. */
export const cleanUrl = (text) => {
  const s = String(text || "").trim();
  return /^https:\/\/[^\s<>"]+$/i.test(s) ? s.slice(0, 500) : "";
};
export const badUrl = (text) => !!String(text || "").trim() && !cleanUrl(text);

const minutesOf = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
export const badTime = (s) => s && (s.days || []).length > 0 && (minutesOf(s.start) === null || minutesOf(s.end) === null);

export const emptySession = (utc = 7) => ({ title: "", days: [], start: "19:30", end: "21:00", utc, liveUntil: 0, activity: "", zoomPublic: false });

/** The public copy of a session: tidy, with the Zoom link only when it may show. */
export function publicSession(s, zoom) {
  if (!s) return null;
  const out = {
    title: String(s.title || "").trim().slice(0, 80),
    days: WEEK.filter((d) => (s.days || []).includes(d)),
    start: minutesOf(s.start) === null ? "" : s.start,
    end: minutesOf(s.end) === null ? "" : s.end,
    utc: Number.isFinite(s.utc) ? s.utc : 7,
    liveUntil: Number(s.liveUntil) > Date.now() ? Number(s.liveUntil) : 0,
    activity: cleanUrl(s.activity),
    zoomPublic: !!s.zoomPublic,
  };
  const link = cleanUrl(zoom);
  if (out.zoomPublic && link) out.zoom = link;
  return out;
}

/**
 * Live or not at `now` (ms): { live, endsAt, nextAt }. A weekly slot that runs
 * past midnight belongs to the day it starts.
 */
export function liveState(s, now = Date.now()) {
  if (!s) return { live: false, endsAt: null, nextAt: null };
  if (Number(s.liveUntil) > now) return { live: true, endsAt: Number(s.liveUntil), nextAt: null };
  const start = minutesOf(s.start);
  const end = minutesOf(s.end);
  const days = s.days || [];
  if (start === null || end === null || !days.length) return { live: false, endsAt: null, nextAt: null };
  const shift = (Number(s.utc) || 0) * 3600e3;
  const local = new Date(now + shift); // read with getUTC* = the session's own clock
  const dayStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - shift;
  const length = (end > start ? end - start : end + 1440 - start) * 60e3;
  let nextAt = null;
  // yesterday's slot may still be running; then the next seven days
  for (let k = -1; k <= 7; k++) {
    const day = (local.getUTCDay() + k + 7) % 7;
    if (!days.includes(day)) continue;
    const from = dayStart + k * 86400e3 + start * 60e3;
    if (now >= from && now < from + length) return { live: true, endsAt: from + length, nextAt: null };
    if (from > now && nextAt === null) nextAt = from;
  }
  return { live: false, endsAt: null, nextAt };
}

/** Every place with an online session, from Indonesia's provinces and the other countries' cities. */
export function sessionPlaces(provinces = {}, countries = {}) {
  const out = [];
  Object.entries(provinces || {}).forEach(([province, data]) =>
    (data?.locations || []).forEach((l, i) => {
      if (!l?.session) return;
      out.push({
        key: l.id || `${province}-${i}`,
        code: "ID",
        province,
        name: [l.institution, l.city].filter(Boolean).join(" · ") || province,
        at: Number.isFinite(l.lng) && Number.isFinite(l.lat) ? [l.lng, l.lat] : null,
        session: l.session,
      });
    })
  );
  Object.entries(countries || {}).forEach(([code, data]) => {
    if (code === "ID") return;
    (data?.cities || []).forEach((c, i) => {
      if (!c?.session) return;
      out.push({
        key: c.id || `${code}-${i}`,
        code,
        name: c.name || code,
        at: Number.isFinite(c.lon) && Number.isFinite(c.lat) ? [c.lon, c.lat] : countryByCode.get(code)?.centre || null,
        session: c.session,
      });
    });
  });
  return out;
}

/** The clock, ticking every `ms`. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** The places with sessions and their state now: { all, live, next } (next: soonest first). */
export function useLiveSessions(provinces, countries) {
  const now = useNow();
  const places = useMemo(() => sessionPlaces(provinces, countries), [provinces, countries]);
  return useMemo(() => {
    const all = places.map((p) => ({ ...p, ...liveState(p.session, now) }));
    return {
      all,
      live: all.filter((p) => p.live),
      next: all.filter((p) => !p.live && p.nextAt).sort((a, b) => a.nextAt - b.nextAt),
    };
  }, [places, now]);
}

/** "21:00 WIB" for a moment, on the session's own clock. */
export function clockAt(ms, utc, indonesia = true) {
  const d = new Date(ms + (Number(utc) || 0) * 3600e3);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} ${zoneLabel(utc, indonesia)}`;
}
/** The weekday of a moment, on the session's own clock (0 Sunday). */
export const dayAt = (ms, utc) => new Date(ms + (Number(utc) || 0) * 3600e3).getUTCDay();

/**
 * The private Zoom links, for an editor whose places' ids start with `prefix`
 * (p: Indonesia's map locations, c: other countries' cities). Edits wait here
 * until saved with the editor's own document, in the same audited write.
 */
export function usePrivateLinks(prefix) {
  const [stored, setStored] = useState({});
  const [edits, setEdits] = useState({});
  useEffect(
    () =>
      onSnapshot(
        doc(db, PRIVATE_COLLECTION, LINKS_DOC),
        (snap) => setStored(snap.data()?.links || {}),
        (err) => console.error("Could not load the Zoom links:", err)
      ),
    []
  );
  const value = (id) => (id in edits ? edits[id] : stored[id] || "");
  const dirty = Object.keys(edits).some((id) => (edits[id] || "") !== (stored[id] || ""));
  return {
    value,
    set: (id, url) => setEdits((e) => ({ ...e, [id]: url })),
    dirty,
    discard: () => setEdits({}),
    done: () => setEdits({}),
    /** Adds the links document to a save: this editor's places keep theirs, the rest stay as they are. */
    write: (batch, auditId, ids) => {
      const keep = new Set(ids);
      const links = {};
      Object.entries(stored).forEach(([id, url]) => {
        if (!id.startsWith(`${prefix}-`)) links[id] = url;
      });
      ids.forEach((id) => {
        const url = cleanUrl(value(id));
        if (url && keep.has(id)) links[id] = url;
      });
      batch.set(doc(db, PRIVATE_COLLECTION, LINKS_DOC), { links, auditId, updatedAt: serverTimestamp() });
    },
  };
}
