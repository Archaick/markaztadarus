import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@mantine/core";
import { IconCircleCheck, IconMap2, IconNews, IconPencil, IconPlus, IconTrophy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import AppShell from "../Internal/AppShell";
import { useAccess } from "../Internal/accessContext";
import { POSTS } from "../Blog/blogSchema";

export const SITE_BASE = "/internal/website";
export const VIEWS = ["map", "stats", "blog"];
const NS = ["internal/Website", "internal/Internal"];

/** The view in the address (`?view=`, or the older `?tab=`), map by default. */
export const viewOf = (search) => {
  const params = new URLSearchParams(search);
  const view = params.get("view") || params.get("tab");
  return VIEWS.includes(view) ? view : "map";
};

// every news item, live, for the pages inside the frame (null while loading, "error" if refused)
const PostsList = createContext(null);
export const usePostsList = () => useContext(PostsList);

/**
 * The Website app's frame: the shared internal app shell, with "Write news"
 * at the top of the menu, the home page's sections (map, achievements) and
 * the news by status with how many there are. `unsaved` marks the sections
 * with edits not yet saved.
 */
export default function WebsiteShell({ unsaved = {}, children }) {
  const { t } = useTranslation(NS);
  const { isSuperAdmin } = useAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState(null);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, POSTS), orderBy("date", "desc")),
        (snap) => setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error("Could not load posts:", err);
          setPosts("error");
        }
      ),
    []
  );

  const list = Array.isArray(posts) ? posts : [];
  const loaded = Array.isArray(posts);
  const onHome = location.pathname === SITE_BASE;
  const view = onHome ? viewOf(location.search) : "blog"; // a news item's own page belongs to the news
  const status = onHome ? new URLSearchParams(location.search).get("status") : null;
  const published = list.filter((p) => p.status === "published").length;
  const dot = (key) => (unsaved[key] ? "●" : undefined);

  const sections = [
    {
      label: t("nav.home"),
      items: [
        { to: `${SITE_BASE}?view=map`, icon: IconMap2, label: t("tabs.map"), count: dot("map"), active: view === "map" },
        { to: `${SITE_BASE}?view=stats`, icon: IconTrophy, label: t("tabs.stats"), count: dot("stats"), active: view === "stats" },
      ],
    },
    {
      label: t("tabs.blog"),
      items: [
        { to: `${SITE_BASE}?view=blog`, icon: IconNews, label: t("nav.allNews"), count: loaded ? list.length : null, active: view === "blog" && !status },
        { to: `${SITE_BASE}?view=blog&status=published`, icon: IconCircleCheck, label: t("blog.status.published"), count: loaded ? published : null, active: view === "blog" && status === "published" },
        { to: `${SITE_BASE}?view=blog&status=draft`, icon: IconPencil, label: t("blog.status.draft"), count: loaded ? list.length - published : null, active: view === "blog" && status === "draft" },
      ],
    },
  ];

  const newButton = (
    <Button fullWidth size="md" radius="md" color="yellow" c="dark" leftSection={<IconPlus size={18} />} onClick={() => navigate(`${SITE_BASE}?view=blog&new=1`)}>
      {t("blog.newPost")}
    </Button>
  );

  return (
    <PostsList.Provider value={posts}>
      <AppShell
        brand={t("shellBrand")}
        role={isSuperAdmin ? t("internal/Internal:superAdmin") : t("nav.admin")}
        sections={sections}
        action={newButton}
        collapseKey="mt.siteMenu"
      >
        {children}
      </AppShell>
    </PostsList.Provider>
  );
}
