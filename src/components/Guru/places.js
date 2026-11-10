import { getAlpha2Codes } from "i18n-iso-countries";

// Where a teacher is, for the Tadarus Global map: a country, and inside
// Indonesia one of its 38 provinces, named exactly as the globe names them.
export const GURU_MAP = "guru_map";

export const PROVINCES = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung",
  "Bengkulu", "Lampung", "DKI Jakarta", "Banten", "Jawa Barat", "Jawa Tengah", "Daerah Istimewa Yogyakarta", "Jawa Timur",
  "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan",
  "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan",
  "Sulawesi Tenggara", "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Barat Daya", "Papua Pegunungan", "Papua Selatan", "Papua Tengah",
];

const names = {};
/** A country's name in the reader's language, from the browser itself. */
export function countryLabel(code, lang = "id") {
  try {
    names[lang] = names[lang] || new Intl.DisplayNames([lang], { type: "region" });
    return names[lang].of(code) || code;
  } catch {
    return code;
  }
}

/** Every country, Indonesia first, then by name in the reader's language. */
export function countryOptions(lang = "id") {
  const rest = Object.keys(getAlpha2Codes())
    .filter((c) => c !== "ID")
    .map((code) => ({ value: code, label: countryLabel(code, lang) }))
    .sort((a, b) => a.label.localeCompare(b.label, lang));
  return [{ value: "ID", label: countryLabel("ID", lang) }, ...rest];
}
