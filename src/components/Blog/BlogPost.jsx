import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import BlogShell from "./BlogShell";
import PostCard from "./PostCard";
import ArticleView from "./ArticleView";
import styles from "./Blog.module.css";
import { IMAGES, POSTS, THUMBS, fetchPublished, localized } from "./blogSchema";
import { photoOf } from "./photoFiles";

export default function BlogPost() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation("blog/Blog");
  const [post, setPost] = useState(undefined); // undefined = loading, null = not found
  const [images, setImages] = useState({}); // full photos loaded so far: id → { dataUrl, width, height }
  const [thumbs, setThumbs] = useState(null); // gallery copies, for posts that have them
  const requested = useRef(new Set());
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let alive = true;
    setPost(undefined);
    setImages({});
    setThumbs(null);
    requested.current = new Set();
    getDoc(doc(db, POSTS, slug))
      .then((snap) => alive && setPost(snap.exists() ? { id: snap.id, ...snap.data() } : null))
      // Drafts are hidden from visitors by the rules, which reads as not found.
      .catch(() => alive && setPost(null));
    return () => {
      alive = false;
    };
  }, [slug]);

  // One full photo, fetched once.
  const postId = post?.id;
  const loadImage = useCallback(
    (id) => {
      if (!postId || !id || requested.current.has(id)) return;
      requested.current.add(id);
      getDoc(doc(db, POSTS, postId, IMAGES, id))
        .then((snap) => snap.exists() && setImages((m) => ({ ...m, [id]: photoOf(snap.data()) })))
        .catch((err) => {
          requested.current.delete(id);
          console.error("Could not load photo:", err);
        });
    },
    [postId]
  );

  // Photos load after the text, so the article shows straight away. Posts with
  // gallery copies load those and the full cover only; older posts load every
  // photo as before.
  const thumbsReady = !!post?.thumbsReady;
  const coverId = post?.coverId;
  useEffect(() => {
    if (!postId) return undefined;
    let alive = true;
    if (thumbsReady) {
      getDocs(collection(db, POSTS, postId, THUMBS))
        .then((snap) => alive && setThumbs(Object.fromEntries(snap.docs.map((d) => [d.id, photoOf(d.data())]))))
        .catch((err) => console.error("Could not load photos:", err));
      if (coverId) loadImage(coverId);
    } else {
      getDocs(collection(db, POSTS, postId, IMAGES))
        .then((snap) => alive && setImages(Object.fromEntries(snap.docs.map((d) => [d.id, photoOf(d.data())]))))
        .catch((err) => console.error("Could not load photos:", err));
    }
    fetchPublished({ size: 4 })
      .then((page) => alive && setRelated(page.posts.filter((p) => p.id !== postId).slice(0, 3)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [postId, thumbsReady, coverId, loadImage]);

  const pageTitle = post ? localized(post, i18n.language).title : "";
  useEffect(() => {
    if (pageTitle) document.title = `${pageTitle} · Markaz Tadarus Indonesia`;
  }, [pageTitle]);

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
      <ArticleView post={post} images={images} thumbs={thumbs || undefined} onNeedImage={thumbs ? loadImage : undefined}>
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
