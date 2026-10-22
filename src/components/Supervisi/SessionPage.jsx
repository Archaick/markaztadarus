import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Loader, TextInput, Textarea } from "@mantine/core";
import { IconArrowLeft, IconArrowRight, IconCheck, IconDeviceFloppy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAccess } from "../Internal/accessContext";
import { useSupervisi } from "./SupervisiData";
import { BASE } from "./SupervisiShell";
import { finishSession, loadSignatures, updateSession } from "./actions";
import SignaturePad from "./SignaturePad";
import { SCALE, formatAverage, itemNo, summarize, tr, withLiveLabels } from "./supervisiSchema";
import styles from "./Supervisi.module.css";

const NS = "internal/Supervisi";
const STEPS = ["identity", "observe", "notes", "sign"];
const SAVE_AFTER_MS = 12000;

/**
 * One supervision, the four stages of SKENARIO SUPERVISI GURU:
 * 1 Pra-observasi (identity sheet, "Mulai Observasi" → in progress),
 * 2 observation (a score 1–5 per indicator; unscored = to clarify),
 * 3 the two notes, 4 both signatures and "Selesaikan & Simpan Laporan".
 * Work is kept as a draft along the way.
 */
export default function SessionPage() {
  const { sessionId } = useParams();
  const { t, i18n } = useTranslation(NS);
  const lang = i18n.language;
  const { user } = useAccess();
  const navigate = useNavigate();
  const { sessions, instruments, loading } = useSupervisi();
  const session = (sessions || []).find((s) => s.id === sessionId);

  const [step, setStep] = useState(null);
  const [draft, setDraft] = useState(null); // identity + scores + notes being edited
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [signs, setSigns] = useState(null);
  const teacherPad = useRef(null);
  const supervisorPad = useRef(null);

  // start from the saved supervision once it arrives
  useEffect(() => {
    if (!session || draft) return;
    setDraft({
      teacherName: session.teacherName || "",
      schoolName: session.schoolName || "",
      date: session.date || "",
      className: session.className || "",
      book: session.book || "",
      surah: session.surah || "",
      supervisorName: session.supervisorName || "",
      scores: session.scores || {},
      notes: { appreciation: "", followUp: "", ...(session.notes || {}) },
    });
    setStep(session.status === "draft" ? 0 : session.status === "done" ? 3 : 1);
  }, [session, draft]);

  useEffect(() => {
    if (step === 3 && !signs && session) loadSignatures(session.id).then(setSigns).catch(() => setSigns({}));
  }, [step, signs, session]);

  const summary = useMemo(() => summarize(session?.instrument, draft?.scores), [session?.instrument, draft?.scores]);

  const save = async (extra = {}, action = "sup.session.save") => {
    if (!session || !draft) return;
    setSaving(true);
    try {
      const { scores, notes, ...identity } = draft;
      await updateSession(user, session, { ...identity, scores, notes, average: summary.average, percent: summary.percent, scored: summary.scored, ...extra }, action, {
        scored: summary.scored,
      });
      setDirty(false);
    } catch (err) {
      console.error("Could not save the supervision:", err);
      setError(t("errors.failed"));
    } finally {
      setSaving(false);
    }
  };

  // keep work safe without saving on every tap
  useEffect(() => {
    if (!dirty) return undefined;
    const timer = setTimeout(() => save(), SAVE_AFTER_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, draft]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (loading || (session && !draft)) return <Loader />;
  if (!session) return <p className={styles.empty}>{t("sessions.missing")}</p>;

  const set = (key) => (e) => {
    // read now: the event is gone by the time the update runs
    const value = e.currentTarget.value;
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };
  const setScore = (id, value) => {
    setDraft((d) => {
      const scores = { ...d.scores };
      if (scores[id] === value) delete scores[id];
      else scores[id] = value;
      return { ...d, scores };
    });
    setDirty(true);
  };
  const setNote = (key) => (e) => {
    const value = e.currentTarget.value;
    setDraft((d) => ({ ...d, notes: { ...d.notes, [key]: value } }));
    setDirty(true);
  };

  const goTo = async (next) => {
    if (dirty) await save();
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Langkah 1.3: "Mulai Observasi" — the supervision is now in progress
  const startObservation = async () => {
    setError("");
    if (!draft.teacherName.trim() || !draft.date) return setError(t("errors.identity"));
    await save(session.status === "draft" ? { status: "observing" } : {}, session.status === "draft" ? "sup.session.start" : "sup.session.save");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Langkah 4.1: "Selesaikan & Simpan Laporan"
  const finish = async () => {
    setError("");
    const teacher = teacherPad.current?.toDataUrl() || "";
    const supervisor = supervisorPad.current?.toDataUrl() || "";
    if (!teacher || !supervisor) return setError(t("errors.signatures"));
    setSaving(true);
    try {
      const { scores, notes, ...identity } = draft;
      await finishSession(
        user,
        session,
        { ...identity, scores, notes, average: summary.average, percent: summary.percent, scored: summary.scored },
        { teacher, supervisor }
      );
      setDirty(false);
      navigate(`${BASE}/laporan/${session.id}?print=1`);
    } catch (err) {
      console.error("Could not finish the supervision:", err);
      setError(t("errors.failed"));
    } finally {
      setSaving(false);
    }
  };

  let n = 0;

  return (
    <>
      <Link to={`${BASE}/sekolah/${session.schoolId}`} className={styles.crumb}>
        <IconArrowLeft size={16} className={styles.flip} /> {session.schoolName}
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle} dir="auto">
            {draft.teacherName}
          </h1>
          <p className={styles.pageSub}>{tr(session.instrument?.name, lang)}</p>
        </div>
      </div>

      <div className={styles.stepper}>
        {STEPS.map((key, i) => (
          <button
            key={key}
            type="button"
            className={`${styles.step} ${i === step ? styles.stepOn : ""} ${i < step ? styles.stepDone : ""}`}
            onClick={() => (i === 0 || session.status !== "draft" ? goTo(i) : null)}
          >
            <span className={styles.stepNum}>{i < step ? <IconCheck size={16} stroke={3} /> : i + 1}</span>
            <span className={styles.stepText}>
              {t(`steps.${key}`)}
              <small>{t(`steps.${key}Hint`)}</small>
            </span>
          </button>
        ))}
      </div>

      {error && (
        <Alert color="red" mb="md" withCloseButton onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {step === 0 && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t("identity.title")}</h2>
          <p className={styles.sectionDesc}>{t("identity.intro")}</p>
          <div className={styles.fields}>
            <TextInput label={t("fields.teacherName")} value={draft.teacherName} onChange={set("teacherName")} required dir="auto" />
            <TextInput label={t("fields.schoolName")} value={draft.schoolName} onChange={set("schoolName")} dir="auto" />
            <TextInput type="date" label={t("fields.date")} value={draft.date} onChange={set("date")} required />
            <TextInput label={t("fields.className")} value={draft.className} onChange={set("className")} dir="auto" />
            <TextInput label={t("fields.book")} value={draft.book} onChange={set("book")} dir="auto" />
            <TextInput label={t("fields.surah")} value={draft.surah} onChange={set("surah")} dir="auto" />
            <TextInput label={t("fields.supervisorName")} value={draft.supervisorName} onChange={set("supervisorName")} dir="auto" />
          </div>
        </section>
      )}

      {step === 1 && (
        <>
          {session.instrument?.note && <p className={styles.hint}>{tr(session.instrument.note, lang)}</p>}
          {(withLiveLabels(session.instrument, instruments.find((i) => i.id === session.instrumentId))?.sections || []).map((section, si) => {
            const stats = summary.sections[si];
            return (
              <section key={section.id} className={`${styles.panel} ${styles.section}`}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>{tr(section.title, lang)}</h2>
                  <span className={styles.chip}>
                    {stats.scored}/{stats.total} · ⌀ {formatAverage(stats.average)}
                  </span>
                </div>
                {section.description && <p className={styles.sectionDesc}>{tr(section.description, lang)}</p>}
                {(section.groups || []).map((group) => (
                  <div key={group.id}>
                    {tr(group.title, lang) && <div className={styles.groupTitle}>{tr(group.title, lang)}</div>}
                    {(group.items || []).map((item) => {
                      n += 1;
                      const value = draft.scores[item.id];
                      return (
                        <div key={item.id} className={`${styles.indicator} ${value ? styles.indicatorScored : ""}`}>
                          <span className={styles.indicatorNum}>{itemNo(item, n)}</span>
                          <div className={styles.indicatorText} dir="auto">
                            {tr(item.text, lang)}
                          </div>
                          <div className={styles.scale} role="radiogroup" aria-label={tr(item.text, lang)}>
                            {SCALE.slice(0, session.instrument?.scaleMax || 5).map((v) => (
                              <button
                                key={v}
                                type="button"
                                role="radio"
                                aria-checked={value === v}
                                className={value === v ? styles.picked : ""}
                                onClick={() => setScore(item.id, v)}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </section>
            );
          })}
        </>
      )}

      {step === 2 && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t("notes.title")}</h2>
          <p className={styles.sectionDesc}>{t("notes.intro")}</p>
          <div style={{ display: "grid", gap: 16 }}>
            <Textarea
              label={t("notes.appreciation")}
              description={t("notes.appreciationHint")}
              autosize
              minRows={5}
              value={draft.notes.appreciation}
              onChange={setNote("appreciation")}
              dir="auto"
            />
            <Textarea
              label={t("notes.followUp")}
              description={t("notes.followUpHint")}
              autosize
              minRows={5}
              value={draft.notes.followUp}
              onChange={setNote("followUp")}
              dir="auto"
            />
          </div>
          {summary.toClarify > 0 && <p className={styles.hint} style={{ marginTop: 16 }}>{t("notes.clarify", { count: summary.toClarify })}</p>}
        </section>
      )}

      {step === 3 && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t("sign.title")}</h2>
          <p className={styles.sectionDesc}>{t("sign.intro")}</p>
          {signs === null ? (
            <Loader size="sm" />
          ) : (
            <div className={styles.signGrid}>
              <SignaturePad ref={teacherPad} label={t("sign.teacher")} name={draft.teacherName} value={signs.teacher} />
              <SignaturePad ref={supervisorPad} label={t("sign.supervisor")} name={draft.supervisorName} value={signs.supervisor} />
            </div>
          )}
        </section>
      )}

      <div className={styles.flowBar}>
        <div className={styles.flowStats}>
          <span>
            {t("flow.scored")}: <b>{summary.scored}/{summary.total}</b>
          </span>
          <span>
            {t("flow.average")}: <b>{formatAverage(summary.average)}</b> / {summary.max}
          </span>
          {summary.toClarify > 0 && (
            <span>
              {t("flow.toClarify")}: <b>{summary.toClarify}</b>
            </span>
          )}
          <span>{saving ? t("flow.saving") : dirty ? t("flow.unsaved") : t("flow.saved")}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {step > 0 && (
            <button type="button" className={styles.ghost} onClick={() => goTo(step - 1)}>
              <IconArrowLeft size={16} className={styles.flip} /> {t("flow.back")}
            </button>
          )}
          {dirty && (
            <button type="button" className={styles.ghost} onClick={() => save()} disabled={saving}>
              <IconDeviceFloppy size={16} /> {t("flow.saveDraft")}
            </button>
          )}
          {step === 0 && (
            <button type="button" className={styles.primary} onClick={startObservation} disabled={saving}>
              {t("identity.start")} <IconArrowRight size={16} className={styles.flip} />
            </button>
          )}
          {(step === 1 || step === 2) && (
            <button type="button" className={styles.primary} onClick={() => goTo(step + 1)} disabled={saving}>
              {t("flow.next")} <IconArrowRight size={16} className={styles.flip} />
            </button>
          )}
          {step === 3 && (
            <Button size="md" radius="md" color="#003366" loading={saving} leftSection={<IconCheck size={18} />} onClick={finish}>
              {t("sign.finish")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
