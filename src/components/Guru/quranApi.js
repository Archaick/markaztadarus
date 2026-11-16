// The Qur'an's text and its recitation, ayah by ayah, from AlQuran.cloud (free,
// no key, open to the browser). Every word of an ayah comes from the API, never
// from here. One surah with one reciter is fetched once per visit: kept in
// memory and in sessionStorage, so switching reciters back and forth is instant.
import { useCallback, useEffect, useState } from "react";

const API = "https://api.alquran.cloud/v1";
const TEXT_EDITION = "quran-uthmani";

// a short list of well-known murattal reciters (edition ids checked against
// /v1/edition?format=audio). `key` names them in guru/Guru.json (recite.reciter.*).
// Husary's teaching recitation (muallim: slow and clear, made for learners) is not on
// AlQuran.cloud; its audio comes from EveryAyah.com by its file pattern, its text still
// from AlQuran.cloud (owner, 16 Nov 2026: the default).
const EVERYAYAH = "https://everyayah.com/data";
const FOLDERS = { "everyayah.husary-muallim": "Husary_Muallim_128kbps" };
export const RECITERS = [
  { id: "everyayah.husary-muallim", key: "husaryMuallim" },
  { id: "ar.husary", key: "husary" },
  { id: "ar.alafasy", key: "alafasy" },
  { id: "ar.abdurrahmaansudais", key: "sudais" },
  { id: "ar.minshawi", key: "minshawi" },
];
export const DEFAULT_RECITER = RECITERS[0].id;
export const knownReciter = (id) => (RECITERS.some((r) => r.id === id) ? id : "");
export const reciterKey = (id) => (RECITERS.find((r) => r.id === id) || RECITERS[0]).key;

/** 12 → ١٢, for the ayah-end medallion. */
export const arabicDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

// the basmala, its harakat and the alif wasla set aside, to recognise it at
// the start of ayah 1 whichever way the edition spells it (بِسْمِ / بِّسْمِ)
const bare = (s) => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/\u0671/g, "\u0627");
const BASMALA_BARE = "بسم الله الرحمن الرحيم";

/**
 * Ayah 1 of every surah but al-Fatihah (where the basmala is ayah 1) and
 * at-Tawbah (which has none) starts with the basmala in this edition. As in a
 * mushaf it is shown on its own line above the surah, unnumbered, and ayah 1
 * keeps the rest of its text: nothing is dropped, only moved.
 */
export function splitBasmala(surah, text) {
  const clean = (text || "").replace(/^\uFEFF/, "").trim();
  if (surah === 1 || surah === 9) return { basmala: "", text: clean };
  const words = clean.split(/\s+/);
  if (words.length > 4 && bare(words.slice(0, 4).join(" ")) === BASMALA_BARE) return { basmala: words.slice(0, 4).join(" "), text: words.slice(4).join(" ") };
  return { basmala: "", text: clean };
}

// the basmala's own recitation is al-Fatihah 1:1 (ayah number 1 of the whole
// Qur'an), in the same reciter and bitrate as the surah's own files
const basmalaAudio = (url) => (url ? url.replace(/\/\d+\.mp3$/, "/1.mp3") : "");

const memory = new Map();
const pending = new Map();
const storeKey = (surah, reciter) => `quran:${surah}:${reciter}`;

function readStore(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeStore(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // full or blocked: memory still holds it for this visit
  }
}

/**
 * One surah with one reciter: { surah, name, basmala, basmalaAudio,
 * ayahs: [{ n, text, audio, fallback }] }.
 */
export async function loadSurah(surah, reciter) {
  const key = storeKey(surah, reciter);
  if (memory.has(key)) return memory.get(key);
  const stored = readStore(key);
  if (stored?.ayahs?.length) {
    memory.set(key, stored);
    return stored;
  }
  if (pending.has(key)) return pending.get(key);
  const job = (async () => {
    const folder = FOLDERS[reciter];
    const res = await fetch(`${API}/surah/${surah}/editions/${folder ? TEXT_EDITION : `${TEXT_EDITION},${reciter}`}`);
    if (!res.ok) throw new Error(`quran-api-${res.status}`);
    const body = await res.json();
    const list = Array.isArray(body?.data) ? body.data : [body?.data].filter(Boolean);
    const textEd = list.find((e) => e?.edition?.identifier === TEXT_EDITION);
    // EveryAyah: one file per ayah, named by surah and ayah (001007.mp3)
    const pad = (x) => String(x).padStart(3, "0");
    const audioEd = folder
      ? { ayahs: (textEd?.ayahs || []).map((a) => ({ numberInSurah: a.numberInSurah, audio: `${EVERYAYAH}/${folder}/${pad(surah)}${pad(a.numberInSurah)}.mp3`, audioSecondary: [] })) }
      : list.find((e) => e?.edition?.identifier === reciter);
    if (!textEd?.ayahs?.length || !audioEd?.ayahs?.length) throw new Error("quran-api-shape");
    const audioOf = new Map(audioEd.ayahs.map((a) => [a.numberInSurah, a]));
    let basmala = "";
    const ayahs = textEd.ayahs.map((a) => {
      const split = a.numberInSurah === 1 ? splitBasmala(surah, a.text) : { basmala: "", text: (a.text || "").replace(/^\uFEFF/, "") };
      if (split.basmala) basmala = split.basmala;
      const audio = audioOf.get(a.numberInSurah) || {};
      return { n: a.numberInSurah, text: split.text, audio: audio.audio || "", fallback: (audio.audioSecondary || [])[0] || "" };
    });
    const basmalaUrl = !basmala ? "" : folder ? `${EVERYAYAH}/${folder}/001001.mp3` : basmalaAudio(ayahs[0]?.audio);
    const out = { surah, reciter, name: textEd.name || "", basmala, basmalaAudio: basmalaUrl, ayahs };
    memory.set(key, out);
    writeStore(key, out);
    return out;
  })();
  pending.set(key, job);
  try {
    return await job;
  } finally {
    pending.delete(key);
  }
}

/** The surah for the panel and the listening question: { data, error, loading, retry }. */
export function useSurah(surah, reciter) {
  const n = Number(surah) || 0;
  const key = n ? storeKey(n, reciter) : "";
  const [state, setState] = useState(() => ({ key, data: key ? memory.get(key) || null : null, error: null }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!n) return undefined;
    let live = true;
    const ready = memory.get(key);
    if (ready) {
      setState({ key, data: ready, error: null });
      return undefined;
    }
    setState({ key, data: null, error: null });
    loadSurah(n, reciter).then(
      (data) => live && setState({ key, data, error: null }),
      (error) => live && setState({ key, data: null, error })
    );
    return () => {
      live = false;
    };
  }, [n, reciter, key, attempt]);

  const retry = useCallback(() => setAttempt((x) => x + 1), []);
  const current = state.key === key ? state : { data: null, error: null };
  return { data: current.data, error: current.error, loading: !!n && !current.data && !current.error, retry };
}

// the teacher's own reciter, kept on this device; it wins over the item's default
const CHOICE = "guru.reciter";
const readChoice = () => {
  try {
    return knownReciter(localStorage.getItem(CHOICE) || "");
  } catch {
    return "";
  }
};

/** [reciter in use, choose]: the teacher's choice, else the item's default, else al-Husary. */
export function useReciter(itemDefault) {
  const [own, setOwn] = useState(readChoice);
  const choose = useCallback((id) => {
    const ok = knownReciter(id);
    if (!ok) return;
    try {
      localStorage.setItem(CHOICE, ok);
    } catch {
      // private mode: the choice lasts for this page only
    }
    setOwn(ok);
  }, []);
  return [own || knownReciter(itemDefault) || DEFAULT_RECITER, choose];
}
