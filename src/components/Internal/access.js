import {
  IconBarcode,
  IconClipboardText,
  IconLink,
} from "@tabler/icons-react";

// The one account that can invite admins. Mirrored in firestore.rules.
export const SUPER_ADMIN_EMAIL = "saeedhareez@gmail.com";

export const ADMINS_COLLECTION = "internal_admins";

// Every internal dashboard an admin can be given. To add a new one, add it
// here, add its key to the hasOnly() list in firestore.rules, and guard its
// route with <RequireFeature feature="...">.
export const FEATURES = [
  {
    key: "certificates",
    title: "Certificate Dashboard",
    description: "Issue certificates, QR codes, signers and stamps.",
    href: "/cert-admin",
    loginPath: "/cert-login",
    icon: IconBarcode,
    color: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
  },
  {
    key: "redirects",
    title: "Redirect Manager",
    description: "Short links that forward to any URL.",
    href: "/internal/redirect-manager",
    loginPath: "/internal/redirect-login",
    icon: IconLink,
    color: "linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)",
  },
  {
    key: "forms",
    title: "Forms",
    description: "Build forms, share a link, and read the responses.",
    href: "/internal/forms",
    loginPath: "/internal",
    icon: IconClipboardText,
    color: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
  },
];

export const FEATURE_KEYS = FEATURES.map((f) => f.key);

export const featureByKey = (key) => FEATURES.find((f) => f.key === key);

export const normalizeEmail = (value) => (value || "").trim().toLowerCase();

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
