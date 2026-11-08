import {
  IconBarcode,
  IconClipboardCheck,
  IconClipboardText,
  IconLink,
  IconSchool,
  IconWorld,
  IconWorldWww,
} from "@tabler/icons-react";

// The one account that can invite admins. Mirrored in firestore.rules.
export const SUPER_ADMIN_EMAIL = "saeedhareez@gmail.com";

export const ADMINS_COLLECTION = "internal_admins";

// Every internal dashboard an admin can be given. To add a new one, add it
// here, add its key to the hasOnly() list in firestore.rules, give it a
// features.<key> title/description in public/locales/*/internal/Internal.json,
// and guard its route with <RequireFeature feature="...">.
export const FEATURES = [
  {
    key: "certificates",
    href: "/cert-admin",
    icon: IconBarcode,
    color: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
  },
  {
    key: "redirects",
    href: "/internal/redirect-manager",
    icon: IconLink,
    color: "linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)",
  },
  {
    key: "forms",
    href: "/internal/forms",
    icon: IconClipboardText,
    color: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
  },
  {
    key: "supervisi",
    href: "/internal/supervisi",
    icon: IconClipboardCheck,
    color: "linear-gradient(135deg, #cc9933 0%, #003366 100%)",
  },
  {
    key: "site",
    href: "/internal/website",
    icon: IconWorldWww,
    color: "linear-gradient(135deg, #b8960c 0%, #102141 100%)",
  },
  {
    key: "global",
    href: "/internal/global",
    icon: IconWorld,
    color: "linear-gradient(135deg, #f2c94c 0%, #0a1d4a 100%)",
  },
  {
    key: "belajar",
    href: "/belajar",
    icon: IconSchool,
    color: "linear-gradient(135deg, #10b981 0%, #003366 100%)",
  },
];

export const FEATURE_KEYS = FEATURES.map((f) => f.key);

export const featureByKey = (key) => FEATURES.find((f) => f.key === key);

export const normalizeEmail = (value) => (value || "").trim().toLowerCase();

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
