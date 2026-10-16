import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader } from "@mantine/core";
import { IconNews } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import BlogShell from "./BlogShell";
import PostCard from "./PostCard";
import { SkeletonCard } from "./FadeImage";
import styles from "./Blog.module.css";
import { CATEGORIES, fetchPublished } from "./blogSchema";

export default function BlogList() {
  const { t } = useTranslation("blog/Blog");
  const [params, setParams] = useSearchParams();
  const category = CATEGORIES.includes(params.get("kategori")) ? params.get("kategori") : "";
  const [state, setState] = useState({ posts: [], last: null, hasMore: false, loading: true, error: false });

  useEffect(() => {
    document.title = `${t("pageTitle")} · Markaz Tadarus Indonesia`;
  }, [t]);

  useEffect(() => {
    let alive = true;
    setState({ posts: [], last: null, hasMore: false, loading: true, error: false });
    fetchPublished({ category })
      .then((page) => alive && setState({ ...page, loading: false, error: false }))
      .catch((err) => {
        console.error("Could not load news:", err);
        if (alive) setState((s) => ({ ...s, loading: false, error: true }));
      });
    return () => {
      alive = false;
    };
  }, [category]);

  const loadMore = async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const page = await fetchPublished({ category, after: state.last });
      setState((s) => ({ posts: [...s.posts, ...page.posts], last: page.last, hasMore: page.hasMore, loading: false, error: false }));
    } catch (err) {
      console.error("Could not load more news:", err);
      setState((s) => ({ ...s, loading: false, error: true }));
    }
  };

  const pick = (key) => setParams(key ? { kategori: key } : {}, { replace: true });

  return (
    <BlogShell>
      <header className={styles.listHero}>
        <span className={styles.eyebrow}>
          <IconNews size={15} /> Markaz Tadarus Indonesia
        </span>
        <h1 className={styles.listTitle}>{t("pageTitle")}</h1>
        <p className={styles.listSubtitle}>{t("pageSubtitle")}</p>
      </header>

      <div className={styles.container}>
        <div className={styles.filters} role="tablist">
          {["", ...CATEGORIES].map((key) => (
            <button
              type="button"
              role="tab"
              key={key || "all"}
              aria-selected={key === category}
              className={`${styles.filter} ${key === category ? styles.filterOn : ""}`}
              onClick={() => pick(key)}
            >
              {key ? t(`categories.${key}`) : t("all")}
            </button>
          ))}
        </div>

        {state.error && <p className={styles.notice}>{t("loadFailed")}</p>}

        {!state.loading && !state.error && state.posts.length === 0 && (
          <p className={styles.notice}>{t("empty")}</p>
        )}

        <div className={styles.grid}>
          {state.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {state.loading && state.posts.length === 0 && [0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>

        <div className={styles.moreRow}>
          {state.loading && state.posts.length > 0 ? (
            <Loader color="yellow" />
          ) : (
            state.hasMore && (
              <button type="button" className={styles.moreButton} onClick={loadMore}>
                {t("loadMore")}
              </button>
            )
          )}
        </div>
      </div>
    </BlogShell>
  );
}
