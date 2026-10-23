import { useEffect, useState } from "react";
import i18n from "../../i18n";

export const LANGUAGES = [
  { code: "id", label: "ID", name: "Bahasa Indonesia" },
  { code: "en", label: "EN", name: "English" },
  { code: "ar", label: "AR", name: "العربية" },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export const INTERNAL_NS = ["internal/Internal", "internal/Forms", "internal/Website", "internal/Redirects", "internal/Certificates", "internal/Supervisi", "internal/Global"];

const STORAGE_KEY = "mt.internalLang";

export const savedLanguage = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return LANGUAGE_CODES.includes(value) ? value : null;
  } catch {
    return null;
  }
};

const saveLanguage = (code) => {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // private mode or storage blocked: the choice just is not remembered
  }
};

export const isRtl = (lng) => (lng || "").startsWith("ar");

// Number-friendly locales for dates and "3 days ago" (Latin digits in Arabic,
// matching the rest of the numbers on screen).
export const intlLocale = (lng) =>
  ({ id: "id-ID", en: "en-GB", ar: "ar-u-nu-latn" })[(lng || "id").slice(0, 2)] || "en-GB";

export const changeLanguage = (code, { remember = true } = {}) => {
  if (remember) saveLanguage(code);
  return i18n.changeLanguage(code);
};

// Keeps <html dir/lang> in step with the language while an internal page or
// form is on screen, and loads every language up front so switching is instant.
export function useLanguageDirection(initial) {
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    i18n.loadNamespaces(INTERNAL_NS).then(() => i18n.loadLanguages(LANGUAGE_CODES));
    const onChange = (lng) => setLanguage(lng);
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  useEffect(() => {
    if (initial && initial !== i18n.language) i18n.changeLanguage(initial);
  }, [initial]);

  useEffect(() => {
    const html = document.documentElement;
    html.dir = isRtl(language) ? "rtl" : "ltr";
    html.lang = language;
    return () => {
      html.dir = "ltr";
    };
  }, [language]);

  return language;
}
