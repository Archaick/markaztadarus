import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Checkbox, Loader, Radio, TextInput, Textarea } from "@mantine/core";
import { IconAlertCircle, IconCircleCheck, IconEye, IconLock, IconSend } from "@tabler/icons-react";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAccess } from "../Internal/accessContext";
// Despite its name this file is the navy logo; it sits on a white badge.
import logo from "../../assets/imgs/MT-logo-white.svg";
import styles from "./PublicForm.module.css";
import { FORMS_COLLECTION, MAX_LENGTH, RESPONSES, answerError, cleanAnswers } from "./formSchema";

function Shell({ children }) {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <a href="/" className={styles.logoLink}>
          <img src={logo} alt="Markaz Tadarus Indonesia" className={styles.logo} />
        </a>
      </header>
      <main className={styles.main}>{children}</main>
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
      <h1 className={styles.stateTitle}>{title}</h1>
      {text && <p className={styles.stateText}>{text}</p>}
      {children}
    </div>
  );
}

function FieldInput({ field, value, onChange, error }) {
  const common = { error: error || undefined, size: "md", classNames: { input: styles.input } };

  switch (field.type) {
    case "long":
      return (
        <Textarea
          {...common}
          autosize
          minRows={3}
          maxLength={MAX_LENGTH.long}
          placeholder={field.placeholder || "Jawaban Anda"}
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
          placeholder={field.placeholder || "Angka"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "phone":
      return (
        <TextInput
          {...common}
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
                <span>{option}</span>
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
                <span>{option}</span>
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
          placeholder={field.placeholder || "Jawaban Anda"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export default function PublicForm() {
  const { formId } = useParams();
  const { hasFeature, loading: accessLoading } = useAccess();
  const isFormAdmin = hasFeature("forms");
  const [form, setForm] = useState(undefined);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const questionRefs = useRef({});

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

  if (form === undefined) {
    return (
      <Shell>
        <div className={styles.loading}>
          <Loader color="teal" />
        </div>
      </Shell>
    );
  }

  if (form === null) {
    return (
      <Shell>
        <StateCard
          icon={IconAlertCircle}
          tone="toneGray"
          title="Formulir tidak ditemukan"
          text="Tautan ini mungkin salah, atau formulirnya belum dibuka. Silakan hubungi pengirim tautan."
        />
      </Shell>
    );
  }

  const isOpen = form.status === "open";

  if (!isOpen && !isFormAdmin) {
    return (
      <Shell>
        <StateCard
          icon={IconLock}
          tone="toneRed"
          title={form.title}
          text="Formulir ini sudah tidak menerima jawaban. Terima kasih atas perhatian Anda."
        />
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell>
        <StateCard
          icon={IconCircleCheck}
          tone="toneGreen"
          title="Terima kasih!"
          text="Jawaban Anda telah kami terima. Jazakumullahu khairan."
        >
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => {
              setAnswers({});
              setErrors({});
              setSubmitted(false);
              window.scrollTo({ top: 0 });
            }}
          >
            Kirim jawaban lain
          </button>
        </StateCard>
      </Shell>
    );
  }

  const fields = form.fields || [];

  const setAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const nextErrors = {};
    fields.forEach((f) => {
      const message = answerError(f, answers[f.id]);
      if (message) nextErrors[f.id] = message;
    });
    setErrors(nextErrors);

    const firstBad = fields.find((f) => nextErrors[f.id]);
    if (firstBad) {
      questionRefs.current[firstBad.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!isOpen) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, FORMS_COLLECTION, form.id, RESPONSES), {
        answers: cleanAnswers(fields, answers),
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitError(
        err.code === "permission-denied"
          ? "Formulir ini sudah ditutup. Jawaban tidak dapat dikirim."
          : "Gagal mengirim. Periksa koneksi internet Anda lalu coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hasRequired = fields.some((f) => f.required);

  return (
    <Shell>
      {!isOpen && (
        <div className={styles.previewBanner}>
          <IconEye size={16} />
          Preview for admins — this form is {form.status === "closed" ? "closed" : "a draft"}, so answers cannot be sent.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className={`${styles.card} ${styles.titleCard}`}>
          <h1 className={styles.title}>{form.title}</h1>
          {form.description && <p className={styles.description}>{form.description}</p>}
          {hasRequired && (
            <p className={styles.requiredNote}>
              <span className={styles.star}>*</span> Wajib diisi
            </p>
          )}
        </div>

        {fields.map((f, index) => (
          <div
            key={f.id}
            ref={(el) => {
              questionRefs.current[f.id] = el;
            }}
            className={`${styles.card} ${styles.question} ${errors[f.id] ? styles.questionError : ""}`}
          >
            <label className={styles.questionLabel}>
              <span className={styles.questionNumber}>{index + 1}</span>
              <span>
                {f.label}
                {f.required && <span className={styles.star}> *</span>}
              </span>
            </label>
            <FieldInput field={f} value={answers[f.id]} onChange={(v) => setAnswer(f.id, v)} error={errors[f.id]} />
          </div>
        ))}

        {submitError && (
          <div className={styles.submitError}>
            <IconAlertCircle size={18} />
            {submitError}
          </div>
        )}

        <div className={styles.submitRow}>
          <button type="submit" className={styles.submitButton} disabled={submitting || !isOpen}>
            {submitting ? <Loader size={18} color="white" /> : <IconSend size={18} />}
            {submitting ? "Mengirim…" : "Kirim"}
          </button>
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              setAnswers({});
              setErrors({});
            }}
          >
            Kosongkan formulir
          </button>
        </div>
      </form>
    </Shell>
  );
}
