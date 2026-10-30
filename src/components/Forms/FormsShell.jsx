import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@mantine/core";
import { IconCircleCheck, IconClipboardText, IconLock, IconPencil, IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import AppShell from "../Internal/AppShell";
import { useAccess } from "../Internal/accessContext";
import { FORMS_COLLECTION, STATUS_COLORS } from "./formSchema";

export const FORMS_BASE = "/internal/forms";
const NS = ["internal/Forms", "internal/Internal"];

// every form, live, for the pages inside the frame (null while loading, "error" if refused)
const FormsList = createContext(null);
export const useFormsList = () => useContext(FormsList);

/**
 * The Forms app's frame: the shared internal app shell, with "New form" at
 * the top of the menu and the forms by status (all, open, draft, closed),
 * each with how many there are.
 */
export default function FormsShell({ children }) {
  const { t } = useTranslation(NS);
  const { isSuperAdmin } = useAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [forms, setForms] = useState(null);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, FORMS_COLLECTION), orderBy("updatedAt", "desc")),
        (snap) => setForms(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error("Could not load forms:", err);
          setForms("error");
        }
      ),
    []
  );

  const list = Array.isArray(forms) ? forms : [];
  const statusOf = (f) => (STATUS_COLORS[f.status] ? f.status : "draft");
  const countOf = (status) => (Array.isArray(forms) ? list.filter((f) => statusOf(f) === status).length : null);
  const onList = location.pathname === FORMS_BASE;
  const filter = new URLSearchParams(location.search).get("status");

  const sections = [
    {
      label: t("nav.forms"),
      items: [
        { to: FORMS_BASE, end: true, icon: IconClipboardText, label: t("nav.all"), count: Array.isArray(forms) ? list.length : null, active: !onList || !filter }, // a form's own page counts as "all forms"
        { to: `${FORMS_BASE}?status=open`, icon: IconCircleCheck, label: t("status.open"), count: countOf("open"), active: onList && filter === "open" },
        { to: `${FORMS_BASE}?status=draft`, icon: IconPencil, label: t("status.draft"), count: countOf("draft"), active: onList && filter === "draft" },
        { to: `${FORMS_BASE}?status=closed`, icon: IconLock, label: t("status.closed"), count: countOf("closed"), active: onList && filter === "closed" },
      ],
    },
  ];

  const newButton = (
    <Button fullWidth size="md" radius="md" color="yellow" c="dark" leftSection={<IconPlus size={18} />} onClick={() => navigate(`${FORMS_BASE}?new=1`)}>
      {t("newForm")}
    </Button>
  );

  return (
    <FormsList.Provider value={forms}>
      <AppShell
        brand={t("title")}
        role={isSuperAdmin ? t("internal/Internal:superAdmin") : t("nav.admin")}
        sections={sections}
        action={newButton}
        collapseKey="mt.formsMenu"
      >
        {children}
      </AppShell>
    </FormsList.Provider>
  );
}
