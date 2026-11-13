import { Link } from "react-router-dom";
import { IconArrowRight, IconCalendar, IconPhoto } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import logo from "../../assets/imgs/MT-logo-white.svg";
import FadeImage from "./FadeImage";
import styles from "./Blog.module.css";
import { formatPostDate, localized, localizedExcerpt } from "./blogSchema";

// `preview` draws the card without a link, for the editor's preview.
// `language` picks the language of the post's text (the editor's preview);
// by default it follows the site.
export default function PostCard({ post, preview = false, language }) {
  const { t, i18n } = useTranslation("blog/Blog");
  const lang = language || i18n.language;
  const text = localized(post, lang);
  const summary = localizedExcerpt(post, lang);
  const photos = (post.images || []).length;
  const Wrapper = preview ? "div" : Link;

  return (
    <Wrapper {...(preview ? {} : { to: `/berita/${post.id}` })} className={styles.card}>
      <div className={styles.cardImage}>
        {post.coverThumb ? (
          <FadeImage src={post.coverThumb} loading="lazy" decoding="async" />
        ) : (
          <div className={styles.cardPlaceholder}>
            <img src={logo} alt="" />
          </div>
        )}
        <span className={styles.cardCategory}>{t(`categories.${post.category || "lainnya"}`)}</span>
        {photos > 1 && (
          <span className={styles.cardPhotos}>
            <IconPhoto size={13} /> {t("photos", { count: photos })}
          </span>
        )}
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardDate}>
          <IconCalendar size={14} /> {formatPostDate(post.date, i18n.language)}
        </span>
        <h3 className={styles.cardTitle} dir={text.dir.title}>
          {text.title}
        </h3>
        <p className={styles.cardExcerpt} dir={summary.dir}>
          {summary.text}
        </p>
        <span className={styles.cardMore}>
          {t("readMore")} <IconArrowRight size={15} className={styles.flipRtl} />
        </span>
      </div>
    </Wrapper>
  );
}
