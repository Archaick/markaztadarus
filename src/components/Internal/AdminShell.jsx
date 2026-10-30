import { IconHistory, IconUsersGroup } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import AppShell from "./AppShell";

/** Access Control and Activity History: the super admin's own app, in the shared internal frame. */
export default function AdminShell({ adminCount = null, children }) {
  const { t } = useTranslation("internal/Internal");
  const sections = [
    {
      label: t("adminApp.nav"),
      items: [
        { to: "/internal/access", icon: IconUsersGroup, label: t("features.access.title"), count: adminCount },
        { to: "/internal/history", icon: IconHistory, label: t("features.history.title") },
      ],
    },
  ];
  return (
    <AppShell brand={t("adminApp.brand")} role={t("superAdmin")} sections={sections} collapseKey="mt.adminMenu">
      {children}
    </AppShell>
  );
}
