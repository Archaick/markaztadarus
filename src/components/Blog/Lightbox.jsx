import { useEffect, useRef } from "react";
import { Modal } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./Blog.module.css";

// Full-screen photo viewer: arrows or keys on desktop, swipe on phones.
export default function Lightbox({ images, index, onChange, onClose }) {
  const { t } = useTranslation("blog/Blog");
  const touchStart = useRef(null);
  const open = index >= 0 && index < images.length;
  const count = images.length;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowRight") onChange((index + 1) % count);
      if (e.key === "ArrowLeft") onChange((index - 1 + count) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, count, onChange]);

  const onTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) < 50) return;
    onChange(dx < 0 ? (index + 1) % count : (index - 1 + count) % count);
  };

  return (
    <Modal
      opened={open}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      zIndex={1200} // above the site's fixed navbar (z-index 1000)
      classNames={{ content: styles.lightbox, body: styles.lightboxBody }}
      transitionProps={{ transition: "fade", duration: 150 }}
    >
      {open && (
        <div
          className={styles.lightboxStage}
          dir="ltr"
          onTouchStart={(e) => {
            touchStart.current = e.touches[0].clientX;
          }}
          onTouchEnd={onTouchEnd}
        >
          <img src={images[index].dataUrl} alt="" className={styles.lightboxImage} />
          <button type="button" className={styles.lightboxClose} onClick={onClose} aria-label={t("close")}>
            <IconX size={22} />
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={() => onChange((index - 1 + count) % count)}
                aria-label={t("prev")}
              >
                <IconChevronLeft size={26} />
              </button>
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={() => onChange((index + 1) % count)}
                aria-label={t("next")}
              >
                <IconChevronRight size={26} />
              </button>
              <span className={styles.lightboxCount}>
                {index + 1} / {count}
              </span>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
