import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import BlogShell from "./BlogShell";
import PostCard from "./PostCard";
import ArticleView from "./ArticleView";
import styles from "./Blog.module.css";
import { IMAGES, POSTS, fetchPublished } from "./blogSchema";

export default function BlogPost() {
  const { slug } = useParams();
  const { t } = useTranslation("blog/Blog");
  const [post, setPost] = useState(undefined); // undefined = loading, null = not found
  const [images, setImages] = useState({}); // id → { dataUrl, width, height }
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let alive = true;
    setPost(undefined);
    setImages({});
    getDoc(doc(db, POSTS, slug))
      .then((snap) => alive && setPost(snap.exists() ? { id: snap.id, ...snap.data() } : null))
      // Drafts are hidden from visitors by the rules, which reads as not found.
      .catch(() => alive && setPost(null));
    return () => {
      alive = false;
    };
  }, [slug]);

  // Photos load after the text, so the article shows straight away.
  const postId = post?.id;
  useEffect(() => {
    if (!postId) return undefined;
    let alive = true;
    getDocs(collection(db, POSTS, postId, IMAGES))
      .then((snap) => alive && setImages(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))))
      .catch((err) => console.error("Could not load photos:", err));
    fetchPublished({ size: 4 })
      .then((page) => alive && setRelated(page.posts.filter((p) => p.id !== postId).slice(0, 3)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [postId]);

  useEffect(() => {
    if (post?.title) document.title = `${post.title} · Markaz Tadarus Indonesia`;
  }, [post?.title]);

  if (post === undefined) {
    return (
      <BlogShell>
        <div className={styles.center}>
          <Loader color="yellow" />
        </div>
      </BlogShell>
    );
  }

  if (post === null) {
    return (
      <BlogShell>
        <div className={`${styles.container} ${styles.center}`}>
          <h1 className={styles.notFoundTitle}>{t("notFoundTitle")}</h1>
          <p className={styles.notice}>{t("notFoundText")}</p>
          <Link to="/berita" className={styles.moreButton}>
            {t("back")}
          </Link>
        </div>
      </BlogShell>
    );
  }

  return (
    <BlogShell>
      <ArticleView post={post} images={images}>
        {related.length > 0 && (
          <section className={styles.related}>
            <div className={styles.container}>
              <h2 className={styles.sectionHeading}>{t("related")}</h2>
              <div className={styles.grid}>
                {related.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </ArticleView>
    </BlogShell>
  );
}
