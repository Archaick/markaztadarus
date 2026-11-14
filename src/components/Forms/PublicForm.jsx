import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Checkbox, Loader, Progress, Radio, TextInput, Textarea } from "@mantine/core";
import { IconAlertCircle, IconArrowLeft, IconArrowRight, IconCircleCheck, IconChevronDown, IconCircleX, IconClock, IconEye, IconLock, IconSend, IconUpload, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { LanguageSwitcher } from "../Internal/InternalUI";
import { useLanguageDirection } from "../Internal/language";
// Despite its name this file is the navy logo; it sits on a white badge.
import logo from "../../assets/imgs/MT-logo-white.svg";
import styles from "./PublicForm.module.css";
import OwnCopy from "./OwnCopy";
import FormIntro from "./FormIntro";
import { RichText } from "./richText";
import TraceCanvas from "./TraceCanvas";
import { FILE, acceptOf, fileProblem, fileSettings, fileSizeText, sizeText, uploadAnswerFiles } from "./fileUpload";
import {
  COVER_DOC,
  FORMS_COLLECTION,
  MAX_LENGTH,
  MEDIA,
  RESPONSES,
  TRACE,
  answerError,
  cleanAnswers,
  displayAnswer,
  gradeResponse,
  quizOf,
  nextStep,
  questionsOf,
  sectionsOf,
} from "./formSchema";

const NS = "internal/Forms";

// The cover's own width : height, once the picture has loaded.
function useRatio(src) {
  const [ratio, setRatio] = useState(null);
  useEffect(() => {
    if (!src) return undefined;
    let alive = true;
    const img = new Image();
    img.onload = () => alive && img.naturalHeight && setRatio(img.naturalWidth / img.naturalHeight);
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return ratio;
}

// `hasCover` comes with the form, so the layout is right before the photo loads.
function Shell({ children, language, hasCover, cover, coverPosition }) {
  const ratio = useRatio(cover);
  const brand = (
    <>
      <a href="/" className={styles.logoLink}>
        <img src={logo} alt="Markaz Tadarus Indonesia" className={styles.logo} />
      </a>
      {/* Visitors switch for this visit only; the form's own language comes first. */}
      <LanguageSwitcher language={language} remember={false} className={styles.langCorner} />
    </>
  );
  return (
    <div className={styles.page}>
      {hasCover ? (
        // the cover keeps its own shape, so a wide banner shows whole on any screen
        <header className={styles.coverHeader}>
          <div className={styles.coverBar}>{brand}</div>
          <div
            className={styles.coverImage}
            style={{
              ...(cover && { backgroundImage: `url(${cover})`, backgroundPosition: `center ${coverPosition || "center"}` }),
              ...(ratio && { aspectRatio: String(ratio) }),
            }}
          />
        </header>
      ) : (
        <header className={styles.hero}>{brand}</header>
      )}
      <main className={`${styles.main} ${hasCover ? styles.mainBelowCover : ""}`}>{children}</main>
      <footer className={styles.footer}>Markaz Tadarus Indonesia</footer>
    </div>
  );
}

function StateCard({ icon: Icon, tone, title, text, children }) {
  return (
    <div className={`${styles.card} ${styles.stateCard}`}>
      <span className={`${styles.stateIcon} ${styles[tone]}`}>
        <Icon size={30} />
      </span>
      <h1 className={styles.stateTitle} dir="auto">
        {title}
      </h1>
      {text && <p className={styles.stateText}>{text}</p>}
      {children}
    </div>
  );
}

/** Files to send with the form: checked here, sent to Drive when the form is submitted. */
function FileInput({ field, value, onChange, error, disabled }) {
  const { t } = useTranslation(NS);
  const { maxFiles, maxMB, kinds } = fileSettings(field);
  const files = value || [];
  const [problem, setProblem] = useState("");

  const add = (event) => {
    const picked = [...event.target.files];
    event.target.value = ""; // the same file can be picked again after removing it
    const refused = picked.map((file) => fileProblem(field, file)).find(Boolean);
    const fit = picked.filter((file) => !fileProblem(field, file)).filter((file) => !files.some((f) => f.name === file.name && f.size === file.size));
    const next = [...files, ...fit];
    setProblem(refused ? `file${refused === "type" ? "Type" : "Size"}` : next.length > maxFiles ? "fileCount" : "");
    onChange(next.slice(0, maxFiles));
  };

  return (
    <div>
      {files.length > 0 && (
        <ul className={styles.fileList}>
          {files.map((file) => (
            <li key={`${file.name}${file.size}`}>
              <span className={styles.fileName} dir="auto">
                {file.name}
              </span>
              <span className={styles.fileSize}>{fileSizeText(file.size)}</span>
              <button type="button" disabled={disabled} onClick={() => onChange(files.filter((f) => f !== file))} aria-label={t("public.fileRemove", { name: file.name })}>
                <IconX size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {files.length < maxFiles && (
        <label className={`${styles.filePick} ${disabled ? styles.filePickOff : ""}`}>
          <input type="file" multiple={maxFiles > 1} accept={acceptOf(field)} onChange={add} disabled={disabled} />
          <IconUpload size={18} />
          {t("public.fileAdd")}
        </label>
      )}
      <p className={styles.fileHint}>
        {t("public.fileHint", {
          kinds: kinds.map((k) => t(`builder.fileKinds.${k}`)).join(", "),
          count: maxFiles,
          size: sizeText(maxMB),
        })}
      </p>
      {(problem || error) && <p className={styles.fileError}>{error || t(`public.errors.${problem}`, { count: maxFiles, size: sizeText(maxMB) })}</p>}
    </div>
  );
}

/** The words to trace, right to left like the worksheet. A word counts once its bar fills. */
function TraceInput({ field, value, onChange, error, disabled }) {
  const { t } = useTranslation(NS);
  const traced = value || [];
  return (
    <div>
      <div className={styles.traceGrid} dir="rtl">
        {(field.words || []).map((word) => (
          <TraceCanvas key={word} word={word} done={traced.includes(word)} disabled={disabled} onDone={() => onChange((now) => [...new Set([...(now || []), word])])} />
        ))}
      </div>
      <p className={styles.fileHint}>{t("public.traceHint")}</p>
      {error && <p className={styles.fileError}>{error}</p>}
    </div>
  );
}

function FieldInput({ field, value, onChange, error, disabled }) {
  const { t } = useTranslation(NS);
  // Answers are typed in whatever language the person uses.
  const common = { error: error || undefined, size: "md", dir: "auto", classNames: { input: styles.input } };

  switch (field.type) {
    case TRACE:
      return <TraceInput field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;
    case FILE:
      return <FileInput field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;
    case "long":
      return (
        <Textarea
          {...common}
          autosize
          minRows={3}
          maxLength={MAX_LENGTH.long}
          placeholder={field.placeholder || t("public.yourAnswer")}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <TextInput
          {...common}
          inputMode="decimal"
          maxLength={MAX_LENGTH.number}
          placeholder={field.placeholder || t("public.number")}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "phone":
      return (
        <TextInput
          {...common}
          dir="ltr"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={MAX_LENGTH.phone}
          placeholder={field.placeholder || "08xxxxxxxxxx"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "date":
      return <TextInput {...common} type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    case "choice":
      return (
        <Radio.Group value={value || ""} onChange={onChange} error={error || undefined}>
          <div className={styles.optionList}>
            {(field.options || []).map((option) => (
              <label key={option} className={`${styles.option} ${value === option ? styles.optionOn : ""}`}>
                <Radio value={option} color="teal" />
                <span dir="auto">{option}</span>
              </label>
            ))}
          </div>
        </Radio.Group>
      );
    case "checkbox":
      return (
        <Checkbox.Group value={value || []} onChange={onChange} error={error || undefined}>
          <div className={styles.optionList}>
            {(field.options || []).map((option) => (
              <label
                key={option}
                className={`${styles.option} ${(value || []).includes(option) ? styles.optionOn : ""}`}
              >
                <Checkbox value={option} color="teal" />
                <span dir="auto">{option}</span>
              </label>
            ))}
          </div>
        </Checkbox.Group>
      );
    default:
      return (
        <TextInput
          {...common}
          maxLength={MAX_LENGTH.short}
          placeholder={field.placeholder || t("public.yourAnswer")}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/**
 * A quiz's result right after sending: first just the score, in a ring, with
 * how many were right and wrong; the question-by-question list (what was
 * missed, and the right answers, as the form allows) opens with a button.
 */
function QuizResult({ form, result }) {
  const { t } = useTranslation(NS);
  const [showList, setShowList] = useState(false);
  const quiz = quizOf(form);
  if (result.later) {
    return (
      <div className={`${styles.card} ${styles.quizCard}`}>
        <IconClock size={22} />
        <p className={styles.quizLater}>{t("public.quiz.later")}</p>
      </div>
    );
  }
  const questions = questionsOf(form.fields || []).filter((q) => result.per[q.id]);
  const marks = questions.map((q) => result.per[q.id]);
  const right = marks.filter((r) => r.correct === true).length;
  const wrong = marks.filter((r) => r.correct === false).length;
  const percent = result.max > 0 ? Math.round((result.score / result.max) * 100) : 0;
  const tone = percent >= 80 ? "#10b981" : percent >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className={`${styles.card} ${styles.quizCard}`}>
      <div className={styles.quizHero}>
        {quiz.showPoints && (
          <div className={styles.quizRing} style={{ "--percent": `${percent}%`, "--tone": tone }}>
            <div>
              <b>{result.score}</b>
              <span>/ {result.max}</span>
            </div>
          </div>
        )}
        <p className={styles.quizHeroTitle}>{t("public.quiz.score")}</p>
        <div className={styles.quizChips}>
          <span className={styles.chipRight}>
            <IconCircleCheck size={15} /> {t("public.quiz.right", { count: right })}
          </span>
          <span className={styles.chipWrong}>
            <IconCircleX size={15} /> {t("public.quiz.wrong", { count: wrong })}
          </span>
          {result.pending > 0 && (
            <span className={styles.chipWait}>
              <IconClock size={15} /> {t("public.quiz.pending", { count: result.pending })}
            </span>
          )}
        </div>
        {quiz.showMissed && (
          <button type="button" className={styles.quizReview} onClick={() => setShowList((v) => !v)} aria-expanded={showList}>
            {showList ? t("public.quiz.hide") : t("public.quiz.review")}
            <IconChevronDown size={16} className={showList ? styles.quizReviewOpen : undefined} />
          </button>
        )}
      </div>

      {quiz.showMissed && showList && (
        <ul className={styles.quizList}>
          {questions.map((q) => {
            const r = result.per[q.id];
            return (
              <li key={q.id} className={r.correct ? styles.quizRight : r.correct === false ? styles.quizWrong : styles.quizWait}>
                {r.correct ? <IconCircleCheck size={18} /> : r.correct === false ? <IconCircleX size={18} /> : <IconClock size={18} />}
                <div>
                  <span dir="auto" className={styles.multiline}>
                    <RichText text={q.label} as="inline" />
                  </span>
                  {quiz.showPoints && (
                    <small>
                      {r.earned === null ? "—" : r.earned} / {r.points}
                    </small>
                  )}
                  {quiz.showCorrect && r.correct === false && r.accepted.length > 0 && (
                    <p className={styles.quizAnswer} dir="auto">
                      {t("public.quiz.correct")}: {displayAnswer(q.type === "checkbox" ? r.accepted : r.accepted[0])}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// long enough for the globe to land on Indonesia, as a short link's redirect does
const INTRO_MS = 4200;

export default function PublicForm() {
  const { t } = useTranslation(NS);
  const { formId } = useParams();
  const { hasFeature, loading: accessLoading } = useAccess();
  const isFormAdmin = hasFeature("forms");
  const [form, setForm] = useState(undefined);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({}); // fieldId → public.errors.<key>
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploading, setUploading] = useState(null); // how much of the files has gone, 0 to 1
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null); // a quiz's result after sending
  const [sent, setSent] = useState(null); // { answers, sectionIds, at }: for the person's own copy
  const [cover, setCover] = useState(null);
  // with sections: the steps taken so far, in order (Back walks it back);
  // a step's queue holds sections still to visit (several checkbox answers)
  const START = [{ index: 0, queue: [] }];
  const [path, setPath] = useState(START);
  const questionRefs = useRef({});
  const language = useLanguageDirection(form?.language);
  // the globe opening plays once per visit to a form (not again on every reload)
  const introKey = `form-intro:${formId}`;
  const [intro, setIntro] = useState(() => {
    try {
      return !sessionStorage.getItem(introKey);
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (!intro) return undefined;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(() => setIntro(false), still ? 1200 : INTRO_MS);
    return () => clearTimeout(id);
  }, [intro]);
  useEffect(() => {
    if (intro) return;
    try {
      sessionStorage.setItem(introKey, "1");
    } catch {
      /* private mode: it simply plays again next time */
    }
  }, [intro, introKey]);

  useEffect(() => {
    if (accessLoading) return;
    let alive = true;
    getDoc(doc(db, FORMS_COLLECTION, formId))
      .then((snap) => alive && setForm(snap.exists() ? { id: snap.id, ...snap.data() } : null))
      // Drafts are hidden by the rules, which looks the same as not found.
      .catch(() => alive && setForm(null));
    return () => {
      alive = false;
    };
  }, [formId, accessLoading, isFormAdmin]);

  useEffect(() => {
    if (form?.title) document.title = `${form.title} · Markaz Tadarus`;
  }, [form?.title]);

  // The cover lives in its own document; the form shows without waiting for it.
  const coverVersion = form?.coverVersion;
  useEffect(() => {
    if (!coverVersion) return undefined;
    let alive = true;
    getDoc(doc(db, FORMS_COLLECTION, formId, MEDIA, COVER_DOC))
      .then((snap) => alive && snap.exists() && setCover(snap.data().dataUrl))
      .catch((err) => console.error("Could not load cover:", err));
    return () => {
      alive = false;
    };
  }, [formId, coverVersion]);

  const shellProps = {
    language,
    hasCover: !!form?.coverVersion,
    cover,
    coverPosition: form?.coverPosition,
  };

  if (intro && form !== null) {
    return <FormIntro title={form?.title} rtl={form?.language === "ar"} onSkip={() => form && setIntro(false)} />;
  }

  if (form === undefined) {
    return (
      <Shell language={language}>
        <div className={styles.loading}>
          <Loader color="teal" />
        </div>
      </Shell>
    );
  }

  if (form === null) {
    return (
      <Shell language={language}>
        <StateCard
          icon={IconAlertCircle}
          tone="toneGray"
          title={t("public.notFoundTitle")}
          text={t("public.notFoundText")}
        />
      </Shell>
    );
  }

  const isOpen = form.status === "open";

  if (!isOpen && !isFormAdmin) {
    return (
      <Shell {...shellProps}>
        <StateCard icon={IconLock} tone="toneRed" title={form.title} text={t("public.closedText")} />
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell {...shellProps}>
        {form.allowDownload && sent && <OwnCopy form={form} answers={sent.answers} sectionIds={sent.sectionIds} sentAt={sent.at} />}
        {result && <QuizResult form={form} result={result} />}
        <StateCard icon={IconCircleCheck} tone="toneGreen" title={t("public.thanksTitle")} text={t("public.thanksText")}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => {
              setAnswers({});
              setErrors({});
              setPath(START);
              setResult(null);
              setSent(null);
              setSubmitted(false);
              window.scrollTo({ top: 0 });
            }}
          >
            {t("public.another")}
          </button>
        </StateCard>
      </Shell>
    );
  }

  // One page per section; a form without sections is a single page, as before.
  const sections = sectionsOf(form.fields || [], form.firstNext);
  const paged = sections.length > 1;
  const step = path[path.length - 1];
  const at = Math.min(step.index, sections.length - 1);
  const section = sections[at];
  const fields = paged ? section.questions : questionsOf(form.fields || []);
  const next = paged ? nextStep(sections, { index: at, queue: step.queue }, answers) : null;
  const isLast = !next;

  const setAnswer = (id, value) => {
    // a function: several words of one question can finish in quick succession
    setAnswers((prev) => ({ ...prev, [id]: typeof value === "function" ? value(prev[id]) : value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const back = () => {
    setPath((p) => (p.length > 1 ? p.slice(0, -1) : p));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const nextErrors = {};
    fields.forEach((f) => {
      const key = answerError(f, answers[f.id]);
      if (key) nextErrors[f.id] = key;
    });
    setErrors(nextErrors);

    const firstBad = fields.find((f) => nextErrors[f.id]);
    if (firstBad) {
      questionRefs.current[firstBad.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // not the last page yet: on to the next section
    if (!isLast) {
      setPath((p) => [...p, next]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!isOpen) return;

    setSubmitting(true);
    let hadFiles = false;
    try {
      const visited = paged ? path.flatMap((p) => sections[p.index].questions) : fields;
      // the files first: only their folder's link goes in the response
      const fileQuestions = visited.filter((q) => q.type === FILE && answers[q.id]?.length);
      hadFiles = fileQuestions.length > 0;
      if (hadFiles) setUploading(0);
      const folderUrl = await uploadAnswerFiles(form, visited, answers, setUploading);
      hadFiles = false; // sent: anything after this is the answers themselves
      const sent = cleanAnswers(visited, { ...answers, ...Object.fromEntries(fileQuestions.map((q) => [q.id, folderUrl])) });
      await addDoc(collection(db, FORMS_COLLECTION, form.id, RESPONSES), {
        answers: sent,
        submittedAt: serverTimestamp(),
      });
      // a quiz: graded here when results are released right away, else announced for later
      const quiz = quizOf(form);
      if (quiz.enabled) setResult(quiz.release === "immediate" && form.quizKey ? gradeResponse(form.fields, form.quizKey, sent) : { later: true });
      // their own copy names the files: the folder itself is private
      const copy = { ...sent, ...Object.fromEntries(fileQuestions.map((q) => [q.id, answers[q.id].map((file) => file.name)])) };
      setSent({ answers: copy, sectionIds: paged ? path.map((p) => sections[p.index].id) : null, at: new Date() });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitError(err.code === "permission-denied" || err.reason === "closed" ? "closedError" : hadFiles ? "uploadError" : "sendError");
    } finally {
      setSubmitting(false);
      setUploading(null);
    }
  };

  const hasRequired = questionsOf(form.fields || []).some((f) => f.required);

  return (
    <Shell {...shellProps}>
      {!isOpen && (
        <div className={styles.previewBanner}>
          <IconEye size={16} />
          {t("public.preview", {
            status: form.status === "closed" ? t("public.previewClosed") : t("public.previewDraft"),
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className={`${styles.card} ${styles.titleCard}`}>
          <h1 className={styles.title} dir="auto">
            {form.title}
          </h1>
          {form.description && <RichText text={form.description} className={styles.description} />}
          {hasRequired && at === 0 && (
            <p className={styles.requiredNote}>
              <span className={styles.star}>*</span> {t("public.requiredNote")}
            </p>
          )}
        </div>

        {paged && (section.title || section.description || at > 0) && (
          <div className={`${styles.card} ${styles.sectionCard}`}>
            <span className={styles.sectionStep}>{t("public.sectionStep", { n: path.length })}</span>
            {section.title && (
              <h2 className={styles.sectionTitle} dir="auto">
                {section.title}
              </h2>
            )}
            {section.description && <RichText text={section.description} className={styles.description} />}
          </div>
        )}

        {fields.map((f) => (
          <div
            key={f.id}
            ref={(el) => {
              questionRefs.current[f.id] = el;
            }}
            className={`${styles.card} ${styles.question} ${errors[f.id] ? styles.questionError : ""}`}
          >
            <label className={styles.questionLabel}>
              <span dir="auto" className={styles.multiline}>
                <RichText text={f.label} as="inline" />
                {f.required && <span className={styles.star}> *</span>}
              </span>
              {quizOf(form).enabled && quizOf(form).showPoints && Number(f.points) > 0 && (
                <span className={styles.pointsTag}>{t("public.quiz.points", { count: Number(f.points) })}</span>
              )}
            </label>
            <FieldInput
              field={f}
              value={answers[f.id]}
              onChange={(v) => setAnswer(f.id, v)}
              error={errors[f.id] ? t(`public.errors.${errors[f.id]}`) : ""}
              disabled={submitting}
            />
          </div>
        ))}

        {uploading !== null && (
          <div className={styles.uploadBox} role="status">
            <Progress value={uploading * 100} color="teal" size="md" animated />
            <p>{t("public.uploading", { percent: Math.round(uploading * 100) })}</p>
          </div>
        )}

        {submitError && (
          <div className={styles.submitError}>
            <IconAlertCircle size={18} />
            {t(`public.${submitError}`)}
          </div>
        )}

        <div className={styles.submitRow}>
          {paged && path.length > 1 && (
            <button type="button" className={styles.backButton} onClick={back}>
              <IconArrowLeft size={18} className={styles.flip} />
              {t("public.back")}
            </button>
          )}
          {isLast ? (
            <button type="submit" className={styles.submitButton} disabled={submitting || !isOpen}>
              {submitting ? <Loader size={18} color="white" /> : <IconSend size={18} className={styles.sendIcon} />}
              {submitting ? t("public.submitting") : t("public.submit")}
            </button>
          ) : (
            <button type="submit" className={styles.submitButton}>
              {t("public.next")}
              <IconArrowRight size={18} className={styles.flip} />
            </button>
          )}
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              setAnswers({});
              setErrors({});
              setPath(START);
            }}
          >
            {t("public.clear")}
          </button>
        </div>
      </form>
    </Shell>
  );
}
