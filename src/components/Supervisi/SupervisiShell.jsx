import { IconBuildingCommunity, IconLayoutGrid, IconListCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import AppShell from "../Internal/AppShell";
import { useAccess } from "../Internal/accessContext";

export const BASE = "/internal/supervisi";
const NS = "internal/Supervisi";

/** The supervision dashboard's frame: the shared internal app shell with its pages. */
export default function SupervisiShell({ children }) {
  const { t } = useTranslation(NS);
  const { isSuperAdmin } = useAccess();

  const sections = [
    {
      label: t("nav.overview"),
      items: [
        { to: BASE, end: true, icon: IconLayoutGrid, label: t("nav.home") },
        { to: `${BASE}/sekolah`, icon: IconBuildingCommunity, label: t("nav.schools") },
        { to: `${BASE}/instrumen`, icon: IconListCheck, label: t("nav.instruments") },
      ],
    },
  ];

  return (
    <AppShell brand={t("brand")} role={isSuperAdmin ? t("role.super") : t("role.supervisor")} sections={sections} collapseKey="mt.supervisiMenu">
      {children}
    </AppShell>
  );
}
