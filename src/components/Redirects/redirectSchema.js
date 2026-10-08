import { redirects as legacyRedirects } from "./config";

export const REDIRECT_COLLECTION = "redirect_manager_links";

// One segment of lowercase letters, numbers and hyphens: markaztadarus.com/<path>
export const PATH_PATTERN = /^\/[a-z0-9-]+$/;

// Pages and folders the site already uses: a short link with one of these
// names would never be reached.
export const RESERVED_PATHS = [
  "umrah",
  "ut",
  "ts",
  "dq",
  "ilmiah",
  "pelatihan",
  "seminar",
  "majelis",
  "linktree",
  "hidayah",
  "internal",
  "cert-admin",
  "cert-login",
  "verify",
  "form",
  "berita",
  "assets",
  "locales",
  "og",
];

export const SITE_ORIGIN = "https://markaztadarus.com";
export const SITE_HOST = "markaztadarus.com";

export const shortLink = (source) => `${SITE_ORIGIN}${source}`;

export const normalizePath = (value) => {
  let path = (value || "").trim().toLowerCase().replace(/\s+/g, "-");
  path = path.replace(/^https?:\/\/[^/]+/, ""); // a whole short link was pasted
  if (path && !path.startsWith("/")) path = `/${path}`;
  return path;
};

export const isReserved = (source) => RESERVED_PATHS.includes(source.replace(/^\//, ""));

// Returns the cleaned URL, or null when it is not an http(s) address.
export const normalizeUrl = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
};

// What kind of place a link leads to, for its icon and the waiting page.
export function destinationKind(url) {
  let host = "";
  let path = "";
  try {
    const parsed = new URL(url);
    host = parsed.hostname.replace(/^www\./, "");
    path = parsed.pathname;
  } catch {
    return { kind: "link", host: "" };
  }
  if (host === "docs.google.com" && path.startsWith("/forms")) return { kind: "form", host };
  if (host === "forms.gle") return { kind: "form", host };
  if (host === "drive.google.com") return { kind: "drive", host };
  if (host === "docs.google.com") return { kind: "docs", host };
  if (/(^|\.)youtube\.com$|^youtu\.be$/.test(host)) return { kind: "youtube", host };
  if (/^(wa\.me|chat\.whatsapp\.com|api\.whatsapp\.com)$/.test(host)) return { kind: "whatsapp", host };
  if (host === SITE_HOST || host.endsWith(".markaztadarus.com")) return { kind: "site", host };
  return { kind: "link", host };
}

const toDate = (value) => (value && typeof value.toDate === "function" ? value.toDate() : value ? new Date(value) : null);

// "active", "paused" (switched off) or "expired" (past its end date)
export function linkState(link, now = new Date()) {
  if (link.active === false) return "paused";
  const ends = toDate(link.expiresAt);
  if (ends && ends < now) return "expired";
  return "active";
}

export const expiryDate = (link) => toDate(link.expiresAt);

// The links that used to live in the code, as they would be stored.
export const LEGACY_LINKS = Object.entries(legacyRedirects)
  .filter(([key, url]) => key && url)
  .map(([key, url]) => ({
    source: normalizePath(key),
    destination: url,
    title: key.replace(/[-_]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim(),
  }))
  .filter((link) => PATH_PATTERN.test(link.source));

// A code link by its short name, matched without regard to case.
export const legacyDestination = (shortCode) => {
  const wanted = (shortCode || "").toLowerCase();
  const entry = Object.entries(legacyRedirects).find(([key, url]) => key && url && key.toLowerCase() === wanted);
  return entry ? entry[1] : null;
};
