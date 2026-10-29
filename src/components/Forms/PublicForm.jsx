import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Checkbox, Loader, Radio, TextInput, Textarea } from "@mantine/core";
import { IconAlertCircle, IconArrowLeft, IconArrowRight, IconCircleCheck, IconEye, IconLock, IconSend } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
import { LanguageSwitcher } from "../Internal/InternalUI";
import { useLanguageDirection } from "../Internal/language";
// Despite its name this file is the navy logo; it sits on a white badge.
import logo from "../../assets/imgs/MT-logo-white.svg";
import styles from "./PublicForm.module.css";
import {
  COVER_DOC,
  FORMS_COLLECTION,
  MAX_LENGTH,
  MEDIA,
  RESPONSES,
  answerError,
  cleanAnswers,
  nextSectionIndex,
  questionsOf,
  sectionsOf,
} from "./formSchema";

const NS = "internal/Forms";

// `hasCover` comes with the form, so the layout is right before the photo loads.
function Shell({ children, language, hasCover, cover, coverPosition }) {
  return (
    <div className={styles.page}>
      <header
        className={`${styles.hero} ${hasCover ? styles.heroCover : ""}`}
        style={cover ? { backgroundImage: `url(${cover})`, backgroundPosition: `center ${coverPosition || "center"}` } : undefined}
      >
        <a href="/" className={styles.logoLink}>
          <img src={logo} alt="Markaz Tadarus Indonesia" className={styles.logo} />
        </a>
        {/* Visitors switch for this visit only; the form's own language comes first. */}
        <LanguageSwitcher language={language} remember={false} className={styles.langCorner} />
      </header>
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

function FieldInput({ field, value, onChange, error }) {
  const { t } = useTranslation(NS);
  // Answers are typed in whatever language the person uses.
  const common = { error: error || undefined, size: "md", dir: "auto", classNames: { input: styles.input } };

  switch (field.type) {
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
  const [submitted, setSubmitted] = useState(false);
  const [cover, setCover] = useState(null);
  // with sections: the sections visited so far, in order (Back walks it back)
  const [path, setPath] = useState([0]);
  const questionRefs = useRef({});
  const language = useLanguageDirection(form?.language);

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
        <StateCard icon={IconCircleCheck} tone="toneGreen" title={t("public.thanksTitle")} text={t("public.thanksText")}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => {
              setAnswers({});
              setErrors({});
              setPath([0]);
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
  const at = Math.min(path[path.length - 1], sections.length - 1);
  const section = sections[at];
  const fields = paged ? section.questions : questionsOf(form.fields || []);
  const nextIndex = paged ? nextSectionIndex(sections, at, answers) : -1;
  const isLast = nextIndex === -1;
  // numbers run on across pages
  const numberOf = new Map(questionsOf(form.fields || []).map((q, i) => [q.id, i + 1]));

  const setAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
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
      setPath((p) => [...p, nextIndex]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!isOpen) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, FORMS_COLLECTION, form.id, RESPONSES), {
        answers: cleanAnswers(paged ? path.flatMap((i) => sections[i].questions) : fields, answers),
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitError(err.code === "permission-denied" ? "closedError" : "sendError");
    } finally {
      setSubmitting(false);
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
          {form.description && (
            <p className={styles.description} dir="auto">
              {form.description}
            </p>
          )}
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
            {section.description && (
              <p className={styles.description} dir="auto">
                {section.description}
              </p>
            )}
          </div>
        )}

        {fields.map((f, index) => (
          <div
            key={f.id}
            ref={(el) => {
              questionRefs.current[f.id] = el;
            }}
            className={`${styles.card} ${styles.question} ${errors[f.id] ? styles.questionError : ""}`}
          >
            <label className={styles.questionLabel}>
              <span className={styles.questionNumber}>{numberOf.get(f.id) || index + 1}</span>
              <span dir="auto">
                {f.label}
                {f.required && <span className={styles.star}> *</span>}
              </span>
            </label>
            <FieldInput
              field={f}
              value={answers[f.id]}
              onChange={(v) => setAnswer(f.id, v)}
              error={errors[f.id] ? t(`public.errors.${errors[f.id]}`) : ""}
            />
          </div>
        ))}

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
              setPath([0]);
            }}
          >
            {t("public.clear")}
          </button>
        </div>
      </form>
    </Shell>
  );
}
