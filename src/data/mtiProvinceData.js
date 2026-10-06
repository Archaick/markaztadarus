/**
 * MTI (Markaz Tadarus Indonesia) Province Data
 *
 * Keys must match the PROVINSI names in indonesia-provinces.topo.json exactly.
 * Each province lists where programs run: one entry per city/institution.
 * `programs` is the number of program locations shown on the map; when it is
 * missing, the number of `locations` is used.
 *
 * This file is the fallback; the Website dashboard will store the same shape
 * in Firestore so admins can edit it without a deploy.
 */

export const mtiProvinces = {
  "Sumatera Utara": {
    island: "Sumatera",
    programs: 2,
    locations: [{ city: "Medan", institution: "" }],
  },
  "DKI Jakarta": {
    island: "Pulau Jawa",
    programs: 3,
    locations: [{ city: "Jakarta", institution: "" }],
  },
  "Jawa Barat": {
    island: "Pulau Jawa",
    programs: 5,
    locations: [{ city: "Bandung", institution: "" }],
  },
  "Jawa Tengah": {
    island: "Pulau Jawa",
    programs: 4,
    locations: [{ city: "Semarang", institution: "" }],
  },
  "Jawa Timur": {
    island: "Pulau Jawa",
    programs: 6,
    locations: [{ city: "Surabaya", institution: "" }],
  },
  "Kepulauan Bangka Belitung": {
    island: "Kep. Bangka Belitung",
    programs: 1,
    locations: [{ city: "Bangka Belitung", institution: "" }],
  },
  "Nusa Tenggara Barat": {
    island: "Nusa Tenggara",
    programs: 2,
    locations: [{ city: "Lombok", institution: "" }],
  },
  "Sulawesi Selatan": {
    island: "Pulau Sulawesi",
    programs: 3,
    locations: [{ city: "Makassar", institution: "" }],
  },
};

export const programCount = (province) =>
  Number(province?.programs) || province?.locations?.length || 0;

// Active provinces as [{ name, ...data, programs }], most programs first.
export const provinceList = (provinces = mtiProvinces) =>
  Object.entries(provinces)
    .map(([name, data]) => ({ name, ...data, programs: programCount(data) }))
    .sort((a, b) => b.programs - a.programs || a.name.localeCompare(b.name));

export const provinceTotals = (provinces = mtiProvinces) => {
  const list = provinceList(provinces);
  return {
    provinces: list.length,
    locations: list.reduce((sum, p) => sum + p.programs, 0),
    islands: new Set(list.map((p) => p.island).filter(Boolean)).size,
    maxPrograms: Math.max(1, ...list.map((p) => p.programs)),
  };
};

/**
 * Check if a province name (from the map's PROVINSI field) is an MTI-active province.
 */
export const isMtiProvince = (name) => name in mtiProvinces;

/**
 * Get display name for a province (some provinces have alternate display names or formatting).
 */
export const getDisplayName = (name, provinces = mtiProvinces) => provinces[name]?.displayName || name;
