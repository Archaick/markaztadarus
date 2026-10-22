import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

// src/i18n.js
i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: "id",
    fallbackLng: "id",
    supportedLngs: ["id", "en", "ar"],
    backend: {
      // ?v= is the build id, so every deploy fetches its own translations;
      // in dev it changes on every page load, so edited files show at once.
      loadPath: `/locales/{{lng}}/{{ns}}.json?v=${import.meta.env.DEV ? Date.now().toString(36) : import.meta.env.VITE_BUILD_ID}`,
    },
    ns: [
      "common/Footer",
      "homepage/Navbar",
      "homepage/Hero",
      "homepage/Methods",
      "homepage/About",
      "homepage/Map",
      "homepage/Programs",
      "homepage/Stats",
      "certify/CertificateVerify",
      "hidayah/Hidayah"
    ], 
    defaultNS: "homepage/Navbar",
    interpolation: {
      escapeValue: false,
    },
  });
export default i18n;
