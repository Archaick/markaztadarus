import { useState } from "react";
import styles from "./Blog.module.css";

// An <img> that fades in once it has loaded, over the shimmer behind it.
export default function FadeImage({ className = "", onLoad, ...props }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      {...props}
      alt={props.alt ?? ""}
      className={`${styles.fadeImg} ${loaded ? styles.loaded : ""} ${className}`}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}

// A grey stand-in for a news card while the list loads.
export function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={`${styles.skeletonImage} ${styles.shimmer}`} />
      <div className={styles.skeletonBody}>
        <span className={`${styles.skeletonLine} ${styles.shimmer}`} />
        <span className={`${styles.skeletonLine} ${styles.shimmer}`} />
        <span className={`${styles.skeletonLine} ${styles.shimmer}`} />
      </div>
    </div>
  );
}
