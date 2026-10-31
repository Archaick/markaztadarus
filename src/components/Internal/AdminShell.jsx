import { createContext, useContext, useEffect, useState } from "react";
import { IconHistory, IconTrash, IconUsersGroup } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import AppShell from "./AppShell";
import { TRASH_COLLECTION } from "./audit";

// the recycle bin's entries, live (null while loading, "error" if refused)
const TrashList = createContext(null);
export const useTrashList = () => useContext(TrashList);

/**
 * Access Control, Activity History and Recently deleted: the super admin's
 * own app, in the shared internal frame. The menu shows how many deletes are
 * waiting in the bin.
 */
export default function AdminShell({ adminCount = null, children }) {
  const { t } = useTranslation("internal/Internal");
  const [trash, setTrash] = useState(null);

  useEffect(
    () =>
      onSnapshot(
        collection(db, TRASH_COLLECTION),
        (snap) => setTrash(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error("Could not load the recycle bin:", err);
          setTrash("error");
        }
      ),
    []
  );

  const waiting = Array.isArray(trash) ? trash.filter((g) => !g.restoredAt).length : null;
  const sections = [
    {
      label: t("adminApp.nav"),
      items: [
        { to: "/internal/access", icon: IconUsersGroup, label: t("features.access.title"), count: adminCount },
        { to: "/internal/history", icon: IconHistory, label: t("features.history.title") },
        { to: "/internal/trash", icon: IconTrash, label: t("trash.title"), count: waiting || null },
      ],
    },
  ];
  return (
    <TrashList.Provider value={trash}>
      <AppShell brand={t("adminApp.brand")} role={t("superAdmin")} sections={sections} collapseKey="mt.adminMenu">
        {children}
      </AppShell>
    </TrashList.Provider>
  );
}
