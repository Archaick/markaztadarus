import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { fiveTOf, kindOf, questionsOf, sectionTitle } from "../Belajar/belajarSchema";
import { useLearner } from "./guruData";
import { GURU, NS, TopBar } from "./GuruApp";
import Player from "./Player";
import SectionScreen from "./SectionScreen";
import styles from "./Guru.module.css";

/** One section: its text to read, then the practice player; or written tasks; or a reading. */
export default function SectionView() {
  const { sectionId } = useParams();
  const { t } = useTranslation(NS);
  const navigate = useNavigate();
  const { surahs, progress, saveProgress } = useLearner();
  const [playing, setPlaying] = useState(false);

  // the section, its surah, and whether it is open yet
  let found = null;
  surahs.forEach((s) => s.steps.forEach((step) => step.section.id === sectionId && (found = { surah: s, step })));
  if (!found) return <Navigate to={GURU} replace />;
  const { surah, step } = found;
  if (step.state === "locked") return <Navigate to={`${GURU}/surat/${surah.lesson.id}`} replace />;

  const section = step.section;
  const kind = kindOf(section);
  const title = `${surah.lesson.title} · ${sectionTitle(section, t)}`;
  const backTo = `${GURU}/surat/${surah.lesson.id}`;
  const questions = questionsOf(section);
  const mine = progress.get(section.id);

  if (playing && kind === "quiz" && questions.length) {
    return (
      <Player
        section={section}
        title={title}
        guide={{ steps: surah.steps, sectionId: section.id, tag: fiveTOf(section) }}
        onFinish={(r) => saveProgress(section, r).catch((err) => console.error("Could not save progress:", err))}
        onExit={() => navigate(backTo)}
      />
    );
  }

  return (
    <>
      <TopBar />
      <main className={styles.page}>
        <SectionScreen
          section={section}
          surahTitle={surah.lesson.title}
          mine={mine}
          back={
            <Link to={backTo} className={styles.back}>
              <IconArrowLeft size={18} className={styles.flip} /> {surah.lesson.title}
            </Link>
          }
          onStart={() => setPlaying(true)}
          onRead={() => saveProgress(section, {}).then(() => navigate(backTo))}
          onWritten={(answers) => saveProgress(section, { answers }).then(() => navigate(backTo))}
        />
      </main>
    </>
  );
}
