import { Route, Routes } from "react-router-dom";
import RequireFeature from "../Internal/RequireFeature";
import { SupervisiProvider } from "./SupervisiData";
import SupervisiShell from "./SupervisiShell";
import OverviewPage from "./OverviewPage";
import SchoolsPage from "./SchoolsPage";
import SchoolPage from "./SchoolPage";
import SessionsPage from "./SessionsPage";
import SessionPage from "./SessionPage";
import ReportPage from "./ReportPage";
import InstrumentsPage from "./InstrumentsPage";

/**
 * /internal/supervisi/*: teacher supervision after SKENARIO SUPERVISI GURU,
 * for admins given the "supervisi" dashboard.
 */
export default function SupervisiApp() {
  return (
    <RequireFeature feature="supervisi">
      <SupervisiProvider>
        <SupervisiShell>
          <Routes>
            <Route index element={<OverviewPage />} />
            <Route path="sekolah" element={<SchoolsPage />} />
            <Route path="sekolah/:schoolId" element={<SchoolPage />} />
            <Route path="supervisi" element={<SessionsPage />} />
            <Route path="sesi/:sessionId" element={<SessionPage />} />
            <Route path="laporan/:sessionId" element={<ReportPage />} />
            <Route path="instrumen" element={<InstrumentsPage />} />
          </Routes>
        </SupervisiShell>
      </SupervisiProvider>
    </RequireFeature>
  );
}
