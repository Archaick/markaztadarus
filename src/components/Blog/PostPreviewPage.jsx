import { useEffect, useState } from "react";
import { Loader } from "@mantine/core";
import { useTranslation } from "react-i18next";
import BlogShell from "./BlogShell";
import ArticleView from "./ArticleView";
import PostCard from "./PostCard";
import styles from "./Blog.module.css";

export const PREVIEW_MESSAGE = "mt-post-preview";

/**
 * Runs inside the editor's preview frame. The editor (same origin) sends the
 * post as it is being edited — saved or not — and this draws it with the
 * public page's own layout, so the phone view uses the real mobile styles.
 * `?view=card` shows the card from the news list instead of the article.
 */
export default function PostPreviewPage() {
  const { i18n } = useTranslation("blog/Blog");
  const [data, setData] = useState(null); // { post, images, language }
  const view = new URLSearchParams(window.location.search).get("view") === "card" ? "card" : "article";

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== PREVIEW_MESSAGE) return;
      setData(event.data);
    };
    window.addEventListener("message", onMessage);
    // tell the editor we are ready for the first copy
    window.parent?.postMessage({ type: `${PREVIEW_MESSAGE}-ready` }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (data?.language && data.language !== i18n.language) i18n.changeLanguage(data.language);
  }, [data?.language, i18n]);

  if (!data) {
    return (
      <div className={styles.center} style={{ minHeight: "100vh" }}>
        <Loader color="yellow" />
      </div>
    );
  }

  if (view === "card") {
    return (
      <main className={styles.page} dir={i18n.language === "ar" ? "rtl" : "ltr"} style={{ paddingTop: 32, minHeight: "100vh" }}>
        <div className={styles.container}>
          <div className={styles.grid} style={{ maxWidth: 380 }}>
            <PostCard post={data.post} preview />
          </div>
        </div>
      </main>
    );
  }

  return (
    <BlogShell>
      <ArticleView post={data.post} images={data.images} showDraftBanner={false} />
    </BlogShell>
  );
}
