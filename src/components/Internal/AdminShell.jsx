import { createContext, useContext, useEffect, useRef, useState } from "react";
import { IconDatabaseExport, IconHistory, IconTrash, IconUsersGroup } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import AppShell from "./AppShell";
import { TRASH_COLLECTION } from "./audit";
import { purgeExpired } from "./trash";
import { cleanHistory, loadKeepDays } from "./historyCleanup";
import { useAccess } from "./accessContext";

// the recycle bin's entries, live (null while loading, "error" if refused)
const TrashList = createContext(null);
export const useTrashList = () => useContext(TrashList);

/**
 * The recycle bin's entries, live, for the pages inside (the site's admin
 * app and the learning platform's). Entries past their 30 days go once per visit.
 */
export function TrashListProvider({ children }) {
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

  // entries past their 30 days go now (once per visit)
  const purged = useRef(false);
  useEffect(() => {
    if (!Array.isArray(trash) || purged.current) return;
    purged.current = true;
    purgeExpired(trash).catch((err) => console.error("Could not empty expired bin entries:", err));
  }, [trash]);

  return <TrashList.Provider value={trash}>{children}</TrashList.Provider>;
}

/**
 * Access Control, Activity History and Recently deleted: the super admin's
 * own app, in the shared internal frame. The menu shows how many deletes are
 * waiting in the bin.
 */
export default function AdminShell({ adminCount = null, children }) {
  return (
    <TrashListProvider>
      <AdminFrame adminCount={adminCount}>{children}</AdminFrame>
    </TrashListProvider>
  );
}

function AdminFrame({ adminCount, children }) {
  const { t } = useTranslation("internal/Internal");
  const trash = useTrashList();
  const { user } = useAccess();

  // history entries older than the chosen period go now (once per visit)
  const cleaned = useRef(false);
  useEffect(() => {
    if (!user || cleaned.current) return;
    cleaned.current = true;
    loadKeepDays()
      .then((days) => cleanHistory(user, days))
      .catch((err) => console.error("Could not clean the old history:", err));
  }, [user]);

  // the learning platform's deletes are counted in its own app
  const waiting = Array.isArray(trash) ? trash.filter((g) => !g.restoredAt && g.area !== "belajar").length : null;
  const sections = [
    {
      label: t("adminApp.nav"),
      items: [
        { to: "/internal/access", icon: IconUsersGroup, label: t("features.access.title"), count: adminCount },
        { to: "/internal/history", icon: IconHistory, label: t("features.history.title") },
        { to: "/internal/trash", icon: IconTrash, label: t("trash.title"), count: waiting || null },
        { to: "/internal/backup", icon: IconDatabaseExport, label: t("backup.title") },
      ],
    },
  ];
  return (
    <AppShell brand={t("adminApp.brand")} role={t("superAdmin")} sections={sections} collapseKey="mt.adminMenu">
      {children}
    </AppShell>
  );
}
