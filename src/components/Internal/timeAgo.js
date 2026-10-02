import i18n from "../../i18n";
import { intlLocale } from "./language";

const STEPS = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

const formatters = {};
const relative = (locale) =>
  (formatters[locale] ||= new Intl.RelativeTimeFormat(locale, { numeric: "auto" }));

const toDate = (value) => (typeof value.toDate === "function" ? value.toDate() : new Date(value));

// Firestore Timestamp, Date, or millis → "3 days ago" in the current language
export const timeAgo = (value) => {
  if (!value) return "";
  const rtf = relative(intlLocale(i18n.language));
  const seconds = Math.round((toDate(value).getTime() - Date.now()) / 1000);
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "second");
};

export const formatDateTime = (value) => {
  if (!value) return "";
  return toDate(value).toLocaleString(intlLocale(i18n.language), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
