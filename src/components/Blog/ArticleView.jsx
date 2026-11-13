import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CopyButton } from "@mantine/core";
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
import FadeImage from "./FadeImage";
import Lightbox from "./Lightbox";
import styles from "./Blog.module.css";
import { formatPostDate, localized, paragraphs, postLink } from "./blogSchema";

/**
 * One news post as visitors see it: meta, title, cover, text, gallery and
 * share buttons. Used by the public post page and by the editor's preview.
 *
 * `images` maps photo id → { dataUrl, width, height } for the full photos
 * loaded so far. `thumbs`, when given, holds the small gallery copies; then a
 * full photo is asked for with `onNeedImage(id)` only when it is opened (and
 * for the neighbours, so swiping is instant).
 *
 * The title and text follow the site's language when the post has that
 * translation; `language` overrides it (the editor's preview).
 */
export default function ArticleView({ post, images, thumbs, onNeedImage, showDraftBanner = true, language, children }) {
  const { t, i18n } = useTranslation("blog/Blog");
  const text = localized(post, language || i18n.language);
  const [viewer, setViewer] = useState(-1);

  // one tile per photo, in order; `src` is empty until its copy arrives
  const tiles = useMemo(
    () =>
      (post?.images || []).map((id) => ({
        id,
        src: thumbs?.[id]?.dataUrl || images[id]?.dataUrl || "",
        full: images[id]?.dataUrl || thumbs?.[id]?.dataUrl || "",
      })),
    [post?.images, images, thumbs]
  );
  // what the viewer can show: photos that have arrived
  const gallery = useMemo(() => tiles.filter((x) => x.full).map((x) => ({ id: x.id, dataUrl: x.full })), [tiles]);

  // a photo with no small copy falls back to its full version
  useEffect(() => {
    if (!thumbs || !onNeedImage) return;
    (post?.images || []).forEach((id) => {
      if (!thumbs[id]) onNeedImage(id);
    });
  }, [thumbs, post?.images, onNeedImage]);

  // the open photo and its neighbours in full size
  useEffect(() => {
    if (viewer < 0 || !onNeedImage || !gallery.length) return;
    [viewer, viewer + 1, viewer - 1].forEach((i) => {
      const item = gallery[(i + gallery.length) % gallery.length];
      if (item) onNeedImage(item.id);
    });
  }, [viewer, gallery, onNeedImage]);

  const cover = images[post.coverId]?.dataUrl || post.coverThumb;
  const link = postLink(post.id);
  const shareText = `${text.title}\n${link}`;

  return (
    <>
      <article className={styles.article}>
        <div className={styles.container}>
          <Link to="/berita" className={styles.backLink}>
            <IconArrowLeft size={16} className={styles.flipRtl} /> {t("back")}
          </Link>

          {showDraftBanner && post.status !== "published" && (
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
          <h1 className={styles.articleTitle} dir={text.dir.title}>
            {text.title}
          </h1>
        </div>

        {cover && (
          <div className={styles.coverWrap}>
            <img
              src={cover}
              alt=""
              decoding="async"
              className={styles.cover}
              onClick={() => {
                const i = gallery.findIndex((g) => g.id === post.coverId);
                if (i >= 0) setViewer(i);
              }}
            />
          </div>
        )}

        <div className={`${styles.container} ${styles.narrow}`}>
          <div className={styles.body} dir={text.dir.body}>
            {paragraphs(text.body).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {tiles.length > 1 && (
            <section className={styles.gallerySection}>
              <h2 className={styles.sectionHeading}>
                <IconPhoto size={20} /> {t("gallery")} · {t("photos", { count: tiles.length })}
              </h2>
              <div className={styles.galleryGrid}>
                {tiles.map((tile) => (
                  <button
                    type="button"
                    key={tile.id}
                    className={styles.galleryItem}
                    disabled={!tile.full}
                    onClick={() => setViewer(gallery.findIndex((g) => g.id === tile.id))}
                  >
                    {tile.src && <FadeImage src={tile.src} loading="lazy" decoding="async" />}
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

        {children}
      </article>

      <Lightbox images={gallery} index={viewer} onChange={setViewer} onClose={() => setViewer(-1)} />
    </>
  );
}
