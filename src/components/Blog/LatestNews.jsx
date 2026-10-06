import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import Gallery from "../HomePage/Gallery/Gallery";
import PostCard from "./PostCard";
import styles from "./Blog.module.css";
import { fetchPublished } from "./blogSchema";

// Home page section with the newest posts. Until anything is published (or
// if loading fails) the old photo gallery keeps its place.
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

  if (posts === undefined) return <div className={styles.latestPlaceholder} id="news" />;
  if (posts.length === 0) return <Gallery />;

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
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
