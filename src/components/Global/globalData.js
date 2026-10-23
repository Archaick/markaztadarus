import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { geoCentroid, geoDistance } from "d3-geo";
import { feature, merge } from "topojson-client";
import countries110 from "world-atlas/countries-110m.json";
import { numericToAlpha2 } from "i18n-iso-countries";
import { db } from "../../../firebaseConfig";
import { SITE_COLLECTION } from "../HomePage/siteContent";

// Tadarus Global: every country of the world on one globe, with the ones that
// have Tadarus programs lit up and joined to Makkah. The countries and their
// figures are edited from the "Tadarus Global" dashboard and stored in
// site_content/global; until it has been saved, Indonesia alone is shown.

export const GLOBAL_DOC = "global";
export const JAKARTA = [106.8456, -6.2088];

// a few shapes world-atlas leaves without an ISO number
const UNNUMBERED = { Kosovo: "XK", "N. Cyprus": "CY", Somaliland: "SO" };

// Palestine is drawn as one country: world-atlas has the land of historic
// Palestine in two shapes ("Israel" 376 and "Palestine" 275); they are merged
// into a single Palestine, the country of Al-Quds.
const PALESTINE_PARTS = ["376", "275"];
const geometries = countries110.objects.countries.geometries;
const palestine = {
  type: "Feature",
  id: "275",
  properties: { name: "Palestine" },
  geometry: merge(countries110, geometries.filter((g) => PALESTINE_PARTS.includes(g.id))),
};
const shapes = [
  ...feature(countries110, { type: "GeometryCollection", geometries: geometries.filter((g) => !PALESTINE_PARTS.includes(g.id)) }).features,
  palestine,
];

/** Where Tadarus began: Makkah, in Saudi Arabia. */
export const ORIGIN = "SA";

/** Every country: its ISO alpha-2 code, shape, centre and how big it is (radians). */
export const COUNTRIES = shapes
  .map((f) => {
    const code = (f.id && numericToAlpha2(f.id)) || UNNUMBERED[f.properties.name] || null;
    const centre = geoCentroid(f);
    let radius = 0;
    const walk = (c) => (typeof c[0] === "number" ? (radius = Math.max(radius, geoDistance(centre, c))) : c.forEach(walk));
    walk(f.geometry.coordinates);
    return { code, name: f.properties.name, feature: f, centre, radius };
  })
  .filter((c) => c.code);

export const countryByCode = new Map(COUNTRIES.map((c) => [c.code, c]));

// names we give ourselves rather than the browser's
const OWN_NAMES = { PS: { id: "Palestina", en: "Palestine", ar: "فلسطين" } };

const namers = {};
/** The country's name in id, en or ar (the browser knows them all). */
export function countryName(code, lang = "id") {
  const l = (lang || "id").slice(0, 2);
  if (OWN_NAMES[code]) return OWN_NAMES[code][l] || OWN_NAMES[code].en;
  try {
    namers[l] ||= new Intl.DisplayNames([l], { type: "region" });
    return namers[l].of(code) || countryByCode.get(code)?.name || code;
  } catch {
    return countryByCode.get(code)?.name || code;
  }
}

/** Where the line from Makkah lands: the first city, Jakarta for Indonesia, else the country's centre. */
export function anchorOf(code, data) {
  const city = data?.cities?.find((c) => Number.isFinite(c.lon) && Number.isFinite(c.lat));
  if (city) return [city.lon, city.lat];
  if (code === "ID") return JAKARTA;
  return countryByCode.get(code)?.centre || null;
}

export const DEFAULT_GLOBAL = {
  countries: {
    ID: { programs: 0, cities: [], note: { id: "", en: "", ar: "" } },
  },
};

/** The stored countries, live (an admin's save shows up for every visitor at once). */
export function useGlobalContent() {
  const [data, setData] = useState(null);
  useEffect(
    () =>
      onSnapshot(
        doc(db, SITE_COLLECTION, GLOBAL_DOC),
        (snap) => setData(snap.exists() && snap.data().countries ? snap.data() : DEFAULT_GLOBAL),
        (err) => {
          console.error("Could not load Tadarus Global:", err);
          setData(DEFAULT_GLOBAL);
        }
      ),
    []
  );
  return data;
}

/**
 * Where the sun is overhead right now, [lon, lat] (good to a fraction of a
 * degree, plenty for drawing day and night).
 */
export function subsolarPoint(date = new Date()) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 10957.5; // days since J2000.0
  const g = (357.529 + 0.98560028 * d) * rad;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const e = (23.439 - 0.00000036 * d) * rad;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
  const dec = Math.asin(Math.sin(e) * Math.sin(L)) / rad;
  const gmst = (18.697374558 + 24.06570982441908 * d) * 15;
  const lon = ((((ra - gmst) % 360) + 540) % 360) - 180;
  return [lon, dec];
}

/**
 * Where the Moon is overhead right now, [lon, lat], and its phase: `phase`
 * is the Sun–Moon angle in degrees (0 new, 180 full), `waxing` whether it is
 * growing. A few-term formula, good to a degree or two, which is plenty for
 * drawing it in the sky.
 */
export function moonNow(date = new Date()) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 10957.5;
  const L = 218.316 + 13.176396 * d;
  const M = (134.963 + 13.064993 * d) * rad;
  const F = (93.272 + 13.22935 * d) * rad;
  const lambda = (L + 6.289 * Math.sin(M)) * rad;
  const beta = 5.128 * Math.sin(F) * rad;
  const e = 23.439 * rad;
  const ra = Math.atan2(Math.sin(lambda) * Math.cos(e) - Math.tan(beta) * Math.sin(e), Math.cos(lambda)) / rad;
  const dec = Math.asin(Math.sin(beta) * Math.cos(e) + Math.cos(beta) * Math.sin(e) * Math.sin(lambda)) / rad;
  const gmst = (18.697374558 + 24.06570982441908 * d) * 15;
  const lon = ((((ra - gmst) % 360) + 540) % 360) - 180;

  // the Sun's ecliptic longitude, for the phase
  const g = (357.529 + 0.98560028 * d) * rad;
  const sunLambda = 280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g);
  const elongation = ((((lambda / rad - sunLambda) % 360) + 360) % 360);
  return { at: [lon, dec], phase: elongation <= 180 ? elongation : 360 - elongation, waxing: elongation < 180 };
}
