import { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import MapEditor from "./MapEditor";
import StatsEditor from "./StatsEditor";
import PostsPanel from "./PostsPanel";
import WebsiteShell, { VIEWS, viewOf } from "./WebsiteShell";
import app from "./WebsiteApp.module.css";

// where "view on site" opens for each section
const ON_SITE = { map: "/#map", stats: "/#achievements", blog: "/berita" };

/**
 * The website's editable parts, one per menu item. The editors stay mounted
 * (only the open one is shown), so moving between them keeps unsaved edits;
 * the menu marks the ones that have some.
 */
export default function WebsiteAdmin() {
  const { t } = useTranslation(["internal/Website", "internal/Internal"]);
  const { email } = useAccess();
  const location = useLocation();
  const view = viewOf(location.search);
  const [unsaved, setUnsaved] = useState({});
  const markMap = useCallback((dirty) => setUnsaved((u) => ({ ...u, map: dirty })), []);
  const markStats = useCallback((dirty) => setUnsaved((u) => ({ ...u, stats: dirty })), []);

  return (
    <WebsiteShell unsaved={unsaved}>
      <div className={app.page}>
        <header className={app.head}>
          <div>
            <h1 className={app.title}>{t(`views.${view}.title`)}</h1>
            <p className={app.sub}>{t(`views.${view}.text`)}</p>
          </div>
          <Button variant="default" radius="md" component="a" href={ON_SITE[view]} target="_blank" rel="noreferrer" leftSection={<IconExternalLink size={16} />}>
            {t("viewOnSite")}
          </Button>
        </header>

        {VIEWS.map((key) => (
          <div key={key} className={app.view} hidden={key !== view}>
            {key === "map" && <MapEditor editorEmail={email} onDirty={markMap} />}
            {key === "stats" && <StatsEditor editorEmail={email} onDirty={markStats} />}
            {key === "blog" && <PostsPanel editorEmail={email} />}
          </div>
        ))}
      </div>
    </WebsiteShell>
  );
}
