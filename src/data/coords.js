/**
 * Reads a place's position from what an admin pastes out of Google Maps:
 *   -6.9175, 107.6191                                  (right-click → copy)
 *   https://www.google.com/maps/place/…/@-6.91,107.60,17z/…!3d-6.9147!4d107.6098
 *   https://maps.google.com/?q=-6.9175,107.6191
 *   6°55'03.0"S 107°36'35.0"E
 * Returns { lat, lng } or null. Short maps.app.goo.gl links cannot be read
 * without following the redirect, so the editor asks for the numbers instead.
 */
const NUM = "(-?\\d{1,3}(?:\\.\\d+)?)";

const PATTERNS = [
  // the pin itself in a place link (more exact than the map centre after @)
  new RegExp(`!3d${NUM}!4d${NUM}`),
  new RegExp(`[?&](?:q|query|ll|center|destination)=${NUM}(?:,|%2C)\\s*${NUM}`, "i"),
  new RegExp(`@${NUM},${NUM}`),
  new RegExp(`^${NUM}\\s*[,;\\s]\\s*${NUM}$`),
];

const DMS =
  /(\d{1,3})°\s*(\d{1,2})['′]\s*([\d.]+)["″]?\s*([NS])[\s,]*(\d{1,3})°\s*(\d{1,2})['′]\s*([\d.]+)["″]?\s*([EW])/i;

const valid = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

export function parseCoords(input) {
  const text = (input || "").trim();
  if (!text) return null;

  for (const pattern of PATTERNS) {
    const m = text.match(pattern);
    if (m && valid(Number(m[1]), Number(m[2]))) {
      return { lat: Number(Number(m[1]).toFixed(6)), lng: Number(Number(m[2]).toFixed(6)) };
    }
  }

  const d = text.match(DMS);
  if (d) {
    const lat = (Number(d[1]) + Number(d[2]) / 60 + Number(d[3]) / 3600) * (/s/i.test(d[4]) ? -1 : 1);
    const lng = (Number(d[5]) + Number(d[6]) / 60 + Number(d[7]) / 3600) * (/w/i.test(d[8]) ? -1 : 1);
    if (valid(lat, lng)) return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
  }
  return null;
}

// Roughly Indonesia, with a margin: a point outside is most likely a typo.
export const inIndonesia = ({ lat, lng }) => lat > -12 && lat < 7 && lng > 94 && lng < 142;

export const hasCoords = (place) => Number.isFinite(place?.lat) && Number.isFinite(place?.lng);

export const formatCoords = (place) => (hasCoords(place) ? `${place.lat}, ${place.lng}` : "");

export const mapsLink = (place) => `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

// Google's keyless embed: a small live map with a pin on the spot.
export const embedLink = (place, lang = "id") =>
  `https://maps.google.com/maps?q=${place.lat},${place.lng}&z=16&hl=${lang}&output=embed`;
