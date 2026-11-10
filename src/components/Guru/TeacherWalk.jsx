import { useEffect, useRef, useState } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { fiveTOf, learnerSections, sectionTitle } from "../Belajar/belajarSchema";
import Player from "./Player";
import SectionScreen from "./SectionScreen";
import { useScrollLock } from "./scrollLock";
import styles from "./Guru.module.css";

/**
 * For the admin: every section of a surah in the teachers' order, on the
 * teachers' own screens (readings, questions, written tasks). Nothing is saved.
 */
export default function TeacherWalk({ lesson, sections, onClose }) {
  const { t } = useTranslation("guru/Guru");
  const list = learnerSections(sections, lesson.id);
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const finished = useRef(false);

  useScrollLock();

  const box = useRef(null);
  useEffect(() => {
    box.current?.scrollTo(0, 0);
  }, [at, playing]);

  const section = list[at];
  if (!section) return null;

  const next = () => {
    finished.current = false;
    setPlaying(false);
    if (at + 1 >= list.length) onClose();
    else setAt(at + 1);
  };

  return (
    <div ref={box} className={`${styles.app} ${styles.walk}`}>
      <div className={styles.backdrop} />
      {playing ? (
        <Player
          section={section}
          title={`${lesson.title} · ${sectionTitle(section, t)}`}
          guide={{ steps: list.map((s, i) => ({ section: s, state: i < at ? "done" : i === at ? "open" : "locked" })), sectionId: section.id, tag: fiveTOf(section) }}
          onFinish={() => {
            finished.current = true;
          }}
          onExit={() => (finished.current ? next() : setPlaying(false))}
          preview
        />
      ) : (
        <main className={styles.page}>
          <span className={styles.previewBadge}>{t("player.preview")}</span>
          <SectionScreen
            key={section.id}
            section={section}
            surahTitle={lesson.title}
            back={
              <button type="button" className={`${styles.back} ${styles.walkBack}`} onClick={onClose}>
                <IconArrowLeft size={18} className={styles.flip} /> {lesson.title}
              </button>
            }
            onStart={() => setPlaying(true)}
            onRead={next}
            onWritten={async () => next()}
          />
        </main>
      )}
    </div>
  );
}
