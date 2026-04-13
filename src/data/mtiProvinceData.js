/**
 * MTI (Markaz Tadarus Indonesia) Province Data
 * Maps GeoJSON province names (PROVINSI field) to MTI program information.
 * Province names must match those in indonesia-provinces.json exactly.
 */

export const mtiProvinces = {
  "Sumatera Utara": {
    city: "Medan",
    island: "Sumatera",
    programs: 2,
  },
  "DKI Jakarta": {
    city: "Jakarta",
    island: "Pulau Jawa",
    programs: 3,
  },
  "Jawa Barat": {
    city: "Bandung",
    island: "Pulau Jawa",
    programs: 5,
  },
  "Jawa Tengah": {
    city: "Semarang",
    island: "Pulau Jawa",
    programs: 4,
  },
  "Jawa Timur": {
    city: "Surabaya",
    island: "Pulau Jawa",
    programs: 6,
  },
  "Kepulauan Bangka Belitung": {
    city: "Bangka Belitung",
    island: "Kep. Bangka Belitung",
    programs: 1,
  },
  "Nusa Tenggara Barat": {
    city: "Lombok",
    island: "Nusa Tenggara",
    programs: 2,
  },
  "Sulawesi Selatan": {
    city: "Makassar",
    island: "Pulau Sulawesi",
    programs: 3,
  },
};

/**
 * Check if a province name (from GeoJSON PROVINSI field) is an MTI-active province.
 */
export const isMtiProvince = (name) => {
  return name in mtiProvinces;
};

/**
 * Get display name for a province (some provinces have alternate display names or formatting).
 */
export const getDisplayName = (name) => {
  if (mtiProvinces[name]?.displayName) {
    return mtiProvinces[name].displayName;
  }
  return name;
};
