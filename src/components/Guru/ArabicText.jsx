import { isArabic } from "../Belajar/belajarSchema";
import styles from "./Guru.module.css";

// one run of Arabic words (with the spaces between them), so a phrase stays whole
const RUN = /([؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿](?:[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿\s]*[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])?)/;

/**
 * A sentence that mixes Indonesian with Arabic words: each Arabic phrase is set
 * larger and right to left, so the harakat are easy to read for every teacher.
 * Text written only in Arabic is left to the page's own Arabic style.
 */
export default function ArabicText({ text }) {
  const value = text || "";
  if (isArabic(value) || !RUN.test(value)) return value;
  return value.split(RUN).map((part, i) =>
    i % 2 ? (
      <span key={i} className={styles.ar} dir="rtl" lang="ar">
        {part}
      </span>
    ) : (
      part
    )
  );
}
