import { Suspense, lazy } from "react";
import { Loader } from "@mantine/core";
import { Navigate, Route, Routes } from "react-router-dom";
import { IconBook2, IconChartBar, IconDatabaseExport, IconHistory, IconSchool, IconTrash, IconUsers, IconUsersGroup } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import RequireFeature from "../Internal/RequireFeature";
import AppShell from "../Internal/AppShell";
import { TrashListProvider, useTrashList } from "../Internal/AdminShell";
import { BELAJAR_SCOPE, ScopeProvider } from "../Internal/scope";
import { useAccess } from "../Internal/accessContext";
import { BelajarProvider, useBelajar } from "./BelajarData";
import LessonsPage from "./LessonsPage";
import LessonPage from "./LessonPage";
import SectionPage from "./SectionPage";
import ClassesPage from "./ClassesPage";
import ClassPage from "./ClassPage";
import TeachersPage from "./TeachersPage";
import ProgressPage from "./ProgressPage";
import { BASE, NS } from "./belajarSchema";

// the super admin's pages, the same as the site's, for this platform's records only
const AccessPage = lazy(() => import("./AccessPage"));
const History = lazy(() => import("../Internal/History"));
const RecentlyDeleted = lazy(() => import("../Internal/RecentlyDeleted"));
const Backup = lazy(() => import("../Internal/Backup"));

function Shell({ children }) {
  const { t } = useTranslation(NS);
  const { isSuperAdmin } = useAccess();
  const { lessons, classes, learners } = useBelajar();
  const trash = useTrashList();
  const waiting = Array.isArray(trash) ? trash.filter((g) => !g.restoredAt && BELAJAR_SCOPE.includes(g.area)).length : null;
  const sections = [
    {
      label: t("nav.guru"),
      items: [
        { to: BASE, end: true, icon: IconBook2, label: t("nav.lessons"), count: lessons?.length ?? null },
        { to: `${BASE}/kelas`, icon: IconSchool, label: t("nav.classes"), count: classes?.length ?? null },
        { to: `${BASE}/guru`, icon: IconUsers, label: t("nav.teachers"), count: learners?.length ?? null },
        { to: `${BASE}/kemajuan`, icon: IconChartBar, label: t("nav.progress") },
      ],
    },
    ...(isSuperAdmin
      ? [
          {
            label: t("nav.admin"),
            items: [
              { to: `${BASE}/akses`, icon: IconUsersGroup, label: t("nav.access") },
              { to: `${BASE}/riwayat`, icon: IconHistory, label: t("nav.history") },
              { to: `${BASE}/sampah`, icon: IconTrash, label: t("nav.trash"), count: waiting || null },
              { to: `${BASE}/cadangan`, icon: IconDatabaseExport, label: t("nav.backup") },
            ],
          },
        ]
      : []),
  ];
  return (
    <AppShell brand={t("brand")} role={isSuperAdmin ? t("role.super") : t("role.admin")} sections={sections} collapseKey="mt.belajarMenu" variant="glass">
      {children}
    </AppShell>
  );
}

/** The bin is the super admin's only; other admins get no list (and no count). */
function MaybeTrash({ children }) {
  const { isSuperAdmin } = useAccess();
  return isSuperAdmin ? <TrashListProvider>{children}</TrashListProvider> : children;
}

function SuperOnly({ children }) {
  const { isSuperAdmin } = useAccess();
  return isSuperAdmin ? children : <Navigate to={BASE} replace />;
}

/**
 * /belajar/*: the learning platform's own admin (Buku Guru first, the
 * children's books later), apart from the other internal dashboards. For
 * admins given "belajar"; its access, history, recycle bin and backup are
 * the super admin's, and only ever show this platform's records.
 */
export default function BelajarApp() {
  return (
    <RequireFeature feature="belajar">
      <ScopeProvider scope={BELAJAR_SCOPE}>
        <BelajarProvider>
          <MaybeTrash>
            <Shell>
              <Suspense fallback={<Loader />}>
              <Routes>
                <Route index element={<LessonsPage />} />
                <Route path="surat/:lessonId" element={<LessonPage />} />
                <Route path="surat/:lessonId/:sectionId" element={<SectionPage />} />
                <Route path="kelas" element={<ClassesPage />} />
                <Route path="kelas/:classId" element={<ClassPage />} />
                <Route path="guru" element={<TeachersPage />} />
                <Route path="kemajuan" element={<ProgressPage />} />
                <Route path="akses" element={<SuperOnly><AccessPage /></SuperOnly>} />
                <Route path="riwayat" element={<SuperOnly><History /></SuperOnly>} />
                <Route path="sampah" element={<SuperOnly><RecentlyDeleted /></SuperOnly>} />
                <Route path="cadangan" element={<SuperOnly><Backup /></SuperOnly>} />
              </Routes>
              </Suspense>
            </Shell>
          </MaybeTrash>
        </BelajarProvider>
      </ScopeProvider>
    </RequireFeature>
  );
}
