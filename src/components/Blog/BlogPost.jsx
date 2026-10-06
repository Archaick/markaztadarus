import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CopyButton, Loader } from "@mantine/core";
import {
  IconArrowLeft,
  IconBrandWhatsapp,
  IconCalendar,
  IconCheck,
  IconEye,
  IconLink,
  IconMapPin,
  IconPhoto,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import BlogShell from "./BlogShell";
import PostCard from "./PostCard";
import Lightbox from "./Lightbox";
import styles from "./Blog.module.css";
import { IMAGES, POSTS, fetchPublished, formatPostDate, paragraphs, postLink } from "./blogSchema";

export default function BlogPost() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation("blog/Blog");
  const [post, setPost] = useState(undefined); // undefined = loading, null = not found
  const [images, setImages] = useState({}); // id → { dataUrl, width, height }
  const [related, setRelated] = useState([]);
  const [viewer, setViewer] = useState(-1);

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

  const gallery = useMemo(
    () => (post?.images || []).map((id) => images[id] && { id, ...images[id] }).filter(Boolean),
    [post?.images, images]
  );

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

  const cover = images[post.coverId]?.dataUrl || post.coverThumb;
  const link = postLink(post.id);
  const shareText = `${post.title}\n${link}`;

  return (
    <BlogShell>
      <article className={styles.article}>
        <div className={styles.container}>
          <Link to="/berita" className={styles.backLink}>
            <IconArrowLeft size={16} className={styles.flipRtl} /> {t("back")}
          </Link>

          {post.status !== "published" && (
            <div className={styles.draftBanner}>
              <IconEye size={16} /> {t("draftBanner")}
            </div>
          )}

          <div className={styles.meta}>
            <span className={styles.metaCategory}>{t(`categories.${post.category || "lainnya"}`)}</span>
            <span className={styles.metaItem}>
              <IconCalendar size={15} /> {formatPostDate(post.date, i18n.language)}
            </span>
            {post.province && (
              <span className={styles.metaItem}>
                <IconMapPin size={15} /> {post.province}
              </span>
            )}
          </div>
          <h1 className={styles.articleTitle} dir="auto">
            {post.title}
          </h1>
        </div>

        {cover && (
          <div className={styles.coverWrap}>
            <img
              src={cover}
              alt=""
              className={styles.cover}
              onClick={() => {
                const i = gallery.findIndex((g) => g.id === post.coverId);
                if (i >= 0) setViewer(i);
              }}
            />
          </div>
        )}

        <div className={`${styles.container} ${styles.narrow}`}>
          <div className={styles.body} dir="auto">
            {paragraphs(post.body).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {gallery.length > 1 && (
            <section className={styles.gallerySection}>
              <h2 className={styles.sectionHeading}>
                <IconPhoto size={20} /> {t("gallery")} · {t("photos", { count: gallery.length })}
              </h2>
              <div className={styles.galleryGrid}>
                {gallery.map((img, i) => (
                  <button type="button" key={img.id} className={styles.galleryItem} onClick={() => setViewer(i)}>
                    <img src={img.dataUrl} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className={styles.shareRow}>
            <span className={styles.shareLabel}>{t("share")}</span>
            <a
              className={`${styles.shareButton} ${styles.shareWa}`}
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
            >
              <IconBrandWhatsapp size={18} /> WhatsApp
            </a>
            <CopyButton value={link}>
              {({ copied, copy }) => (
                <button type="button" className={styles.shareButton} onClick={copy}>
                  {copied ? <IconCheck size={18} /> : <IconLink size={18} />} {copied ? t("copied") : t("copyLink")}
                </button>
              )}
            </CopyButton>
          </div>
        </div>

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
      </article>

      <Lightbox images={gallery} index={viewer} onChange={setViewer} onClose={() => setViewer(-1)} />
    </BlogShell>
  );
}
