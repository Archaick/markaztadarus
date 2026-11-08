import { createContext, useContext } from "react";
import AdminShell from "./AdminShell";
import { BELAJAR_TREE, TREE } from "./databaseBackup";

// Which part of the system the History, Recently deleted and Backup pages
// look after. /internal (the site's dashboards) is the default; the learning
// platform (/belajar) has the same pages for its own records only, in its
// own frame. Underneath it is one history and one bin, filtered by area.

export const SITE_SCOPE = {
  key: "site",
  framed: false,
  includes: (area) => area !== "belajar",
  tree: TREE,
  storageDoc: "storage",
  auditArea: "access",
  backupAction: "backup.download",
  restoreAction: "backup.restore",
  fileName: "markaztadarus-backup",
  introKey: "backup.intro",
  areaOrder: ["news", "forms", "certificates", "supervision", "links", "site", "admins", "history"],
  restoreOrder: ["certificates", "forms", "news", "supervision", "links", "site", "admins"],
  restoreOff: ["admins"], // a removed admin must not come back unnoticed
};

export const BELAJAR_SCOPE = {
  key: "belajar",
  framed: true,
  includes: (area) => area === "belajar",
  tree: BELAJAR_TREE,
  storageDoc: "storage_belajar",
  auditArea: "belajar",
  backupAction: "bel.backup.download",
  restoreAction: "bel.backup.restore",
  fileName: "markaztadarus-belajar-backup",
  introKey: "backup.introBelajar",
  areaOrder: ["learning"],
  restoreOrder: ["learning"],
  restoreOff: [],
};

const ScopeContext = createContext(SITE_SCOPE);

export const ScopeProvider = ({ scope, children }) => <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>;

export const useScope = () => useContext(ScopeContext);

/** The page in the site's admin frame, or as it is when its own app already frames it. */
export function ScopeFrame({ children }) {
  const scope = useScope();
  return scope.framed ? children : <AdminShell>{children}</AdminShell>;
}
