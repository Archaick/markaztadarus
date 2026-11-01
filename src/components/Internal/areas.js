import { IconUsersGroup } from "@tabler/icons-react";
import { FEATURES, featureByKey } from "./access";

// The parts of the dashboards the history and the recycle bin file things
// under: every dashboard, plus Access Control.
export const ACCESS = { key: "access", icon: IconUsersGroup, color: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)" };
export const AREAS = [...FEATURES, ACCESS];
export const areaOf = (key) => featureByKey(key) || ACCESS;

/** Whether an action made something, changed it or removed it (for filtering the history). */
export const actionKind = (action = "") => {
  const verb = action.split(".").pop();
  if (action === "trash.restore" || /^(create|invite|issue|import|duplicate|photo_add)$/.test(verb)) return "created";
  if (/^(delete|remove|clear|purge|cleanup|photo_delete|cover_remove)$/.test(verb)) return "deleted";
  return "edited";
};
