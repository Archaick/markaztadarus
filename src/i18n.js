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
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    ns: [
      "common/Footer",
      "homepage/Navbar",
      "homepage/Hero",
      "homepage/Methods",
      "homepage/About",
      "homepage/Map",
      "homepage/Gallery",
      "homepage/Programs"
    ], 
    defaultNS: "homepage/Navbar",
    interpolation: {
      escapeValue: false,
    },
  });
export default i18n;
