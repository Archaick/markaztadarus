import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import PostCard from "./PostCard";
import { SkeletonCard } from "./FadeImage";
import styles from "./Blog.module.css";
import { fetchPublished } from "./blogSchema";

// Home page section with the newest posts; hidden until something is published.
export default function LatestNews() {
  const { t, i18n } = useTranslation("blog/Blog");
  const [posts, setPosts] = useState(undefined);

  useEffect(() => {
    let alive = true;
    fetchPublished({ size: 3 })
      .then((page) => alive && setPosts(page.posts))
      .catch((err) => {
        console.error("Could not load latest news:", err);
        if (alive) setPosts([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (posts?.length === 0) return null;

  return (
    <section className={styles.latest} id="news" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <div className={styles.container}>
        <div className={styles.latestHead}>
          <div>
            <h2 className={styles.latestTitle}>{t("sectionTitle")}</h2>
            <p className={styles.latestSubtitle}>{t("sectionSubtitle")}</p>
          </div>
          <Link to="/berita" className={styles.seeAll}>
            {t("seeAll")} <IconArrowRight size={16} className={styles.flipRtl} />
          </Link>
        </div>
        <div className={`${styles.grid} ${styles.latestGrid}`}>
          {posts === undefined
            ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
            : posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </div>
    </section>
  );
}
