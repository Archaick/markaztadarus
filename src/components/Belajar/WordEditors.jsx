import { ActionIcon, Button, Group, SegmentedControl, Text, TextInput, Textarea } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconBulb, IconCheck, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { BLANK_RE, LIMITS, NS, bankOf, blankCount, isArabic, keyOf } from "./belajarSchema";
import { CircleRows } from "../Guru/WordQuestions";
import styles from "./Belajar.module.css";

// Arabic typed in a field is shown large, in a typeface made for harakat
const AR_INPUT = { input: { fontFamily: '"Scheherazade New", "Amiri", "Traditional Arabic", serif', fontSize: "1.35rem", lineHeight: 1.6 } };
const arStyles = (v) => (isArabic(v) ? AR_INPUT : undefined);
const dirOf = (v) => (isArabic(v) ? "rtl" : "auto");

/** The short "how to fill it in" box, with an example. */
function HowTo({ steps, example, exampleDir = "rtl" }) {
  const { t } = useTranslation(NS);
  return (
    <div className={styles.howTo}>
      <b className={styles.howToTitle}>
        <IconBulb size={16} /> {t("words.how")}
      </b>
      <ol className={styles.howToSteps}>
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {example && (
        <>
          <span className={styles.howToLabel}>{t("words.example")}</span>
          <div className={styles.howToExample} dir={exampleDir}>
            {example}
          </div>
        </>
      )}
    </div>
  );
}

/** The question's own line: optional for these types, which say what to do by themselves. */
function StemField({ q, set, fallback, autoFocus }) {
  const { t } = useTranslation(NS);
  return (
    <TextInput
      mb="sm"
      label={t("words.stem")}
      description={t("words.stemHint", { fallback })}
      data-autofocus={autoFocus || undefined}
      value={q.stem || ""}
      dir="auto"
      onChange={(e) => set({ stem: e.currentTarget.value })}
    />
  );
}

/** Extra words in the bank that are not answers. */
function Decoys({ q, set }) {
  const { t } = useTranslation(NS);
  const list = q.decoys || [];
  const bank = bankOf(q).length;
  const places = keyOf(q).length;
  return (
    <div className={styles.wordBlock}>
      <Text size="sm" fw={700}>
        {t("words.decoys")}
      </Text>
      <Text size="xs" c="dimmed" mb={6}>
        {t("words.decoysHint")}
      </Text>
      <div className={styles.chipInputs}>
        {list.map((w, i) => (
          <div key={i} className={styles.chipInput}>
            <input value={w} dir={dirOf(w)} placeholder={t("words.decoyPh")} className={isArabic(w) ? styles.chipInputAr : undefined} onChange={(e) => set({ decoys: list.map((x, j) => (j === i ? e.currentTarget.value : x)) })} />
            <button type="button" aria-label={t("words.remove")} onClick={() => set({ decoys: list.filter((_, j) => j !== i) })}>
              ×
            </button>
          </div>
        ))}
        {list.length < LIMITS.decoys && (
          <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} onClick={() => set({ decoys: [...list, ""] })}>
            {t("words.addDecoy")}
          </Button>
        )}
      </div>
      {bank > places && places > 0 && (
        <Text size="xs" c="dimmed" mt={6}>
          {t("words.bankCount", { count: bank, places })}
        </Text>
      )}
    </div>
  );
}

/** Fill in the Blanks: the sentence with __ for each gap, then the answers in that order. */
export function FillBlankEditor({ q, set, autoFocus }) {
  const { t } = useTranslation(NS);
  const { t: tg } = useTranslation("guru/Guru");
  const n = blankCount(q.sentence);
  const answers = q.answers || [];
  const sized = (len) => Array.from({ length: Math.min(len, LIMITS.blanks) }, (_, i) => answers[i] ?? "");
  const parts = (q.sentence || "").split(BLANK_RE);
  return (
    <>
      <StemField q={q} set={set} fallback={tg("player.do.fillblank")} autoFocus={autoFocus} />
      <HowTo steps={[t("words.fillHow1"), t("words.fillHow2"), t("words.fillHow3")]} example="لا __ إلا __" />
      <Textarea
        label={t("words.fillSentence")}
        autosize
        minRows={2}
        placeholder="لا __ إلا __"
        value={q.sentence || ""}
        dir={dirOf(q.sentence)}
        styles={arStyles(q.sentence)}
        onChange={(e) => {
          const sentence = e.currentTarget.value;
          set({ sentence, answers: sized(blankCount(sentence)) });
        }}
      />
      {(q.sentence || "").trim() && n === 0 && (
        <Text size="xs" c="orange.8" mt={4}>
          {t("words.fillNone")}
        </Text>
      )}
      {n > 0 && (
        <div className={styles.wordBlock}>
          <Text size="sm" fw={700} mb={6}>
            {t("words.fillAnswers")}
          </Text>
          {sized(n).map((a, i) => (
            <Group key={i} mb={6} wrap="nowrap" gap="xs">
              <span className={styles.wordNo}>{t("words.blankN", { n: i + 1 })}</span>
              <TextInput
                style={{ flex: 1 }}
                value={a}
                dir={dirOf(a || q.sentence)}
                styles={arStyles(a || q.sentence)}
                classNames={{ input: a.trim() ? styles.inputRight : undefined }}
                onChange={(e) => set({ answers: sized(n).map((x, j) => (j === i ? e.currentTarget.value : x)) })}
              />
            </Group>
          ))}
        </div>
      )}
      <Decoys q={q} set={set} />
      {n > 0 && (
        <div className={styles.wordPreview}>
          <span className={styles.howToLabel}>{t("words.preview")}</span>
          <p dir={isArabic(q.sentence) ? "rtl" : "auto"} className={isArabic(q.sentence) ? styles.previewAr : undefined}>
            {parts.map((part, i) => (
              <span key={i}>
                {part}
                {i < parts.length - 1 && <span className={styles.previewBlank}>{answers[i] || "…"}</span>}
              </span>
            ))}
          </p>
        </div>
      )}
    </>
  );
}

/** Word Ordering: one word per row in the right order; the teacher sees them shuffled. */
export function OrderEditor({ q, set, autoFocus }) {
  const { t } = useTranslation(NS);
  const { t: tg } = useTranslation("guru/Guru");
  const words = q.words || [];
  const dir = q.dir === "ltr" ? "ltr" : "rtl";
  const setWord = (i, v) => set({ words: words.map((x, j) => (j === i ? v : x)) });
  const moveWord = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= words.length) return;
    const out = [...words];
    [out[i], out[j]] = [out[j], out[i]];
    set({ words: out });
  };
  // Enter goes to the next word, adding a row at the end
  const onEnter = (e, i) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const box = e.currentTarget.closest("[data-words]");
    if (i === words.length - 1 && words.length < LIMITS.words) {
      set({ words: [...words, ""] });
      setTimeout(() => box?.querySelectorAll("input")[i + 1]?.focus(), 0);
    } else box?.querySelectorAll("input")[i + 1]?.focus();
  };
  return (
    <>
      <StemField q={q} set={set} fallback={tg("player.do.order")} autoFocus={autoFocus} />
      <HowTo steps={[t("words.orderHow1"), t("words.orderHow2"), t("words.orderHow3")]} example="بِسْمِ ↵ اللَّهِ ↵ الرَّحْمَٰنِ ↵ الرَّحِيمِ" />
      <Text size="sm" fw={700} mb={4}>
        {t("words.orderDir")}
      </Text>
      <SegmentedControl
        mb="sm"
        color="#003366"
        value={dir}
        onChange={(v) => set({ dir: v })}
        data={[
          { value: "rtl", label: t("words.rtl") },
          { value: "ltr", label: t("words.ltr") },
        ]}
      />
      <Text size="sm" fw={700} mb={6}>
        {t("words.orderWords")}
      </Text>
      <div data-words>
        {words.map((w, i) => (
          <Group key={i} mb={6} wrap="nowrap" gap="xs">
            <span className={styles.wordNo}>#{i + 1}</span>
            <TextInput style={{ flex: 1 }} value={w} dir={dir} placeholder={t("words.wordPh")} styles={dir === "rtl" ? AR_INPUT : undefined} onKeyDown={(e) => onEnter(e, i)} onChange={(e) => setWord(i, e.currentTarget.value)} />
            <ActionIcon variant="subtle" disabled={i === 0} onClick={() => moveWord(i, -1)} aria-label="↑">
              <IconArrowUp size={15} />
            </ActionIcon>
            <ActionIcon variant="subtle" disabled={i === words.length - 1} onClick={() => moveWord(i, 1)} aria-label="↓">
              <IconArrowDown size={15} />
            </ActionIcon>
            {words.length > 2 && (
              <ActionIcon variant="subtle" color="red" onClick={() => set({ words: words.filter((_, j) => j !== i) })} aria-label={t("words.remove")}>
                <IconTrash size={15} />
              </ActionIcon>
            )}
          </Group>
        ))}
      </div>
      {words.length < LIMITS.words && (
        <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} onClick={() => set({ words: [...words, ""] })}>
          {t("words.addWord")}
        </Button>
      )}
      <Decoys q={q} set={set} />
      {keyOf(q).length > 0 && (
        <div className={styles.wordPreview}>
          <span className={styles.howToLabel}>{t("words.preview")}</span>
          <p dir={dir} className={dir === "rtl" ? styles.previewAr : undefined}>
            {keyOf(q).join(" ")}
          </p>
        </div>
      )}
    </>
  );
}

/** Circle the Word: rows of a sentence and its words; tap the circle to mark the right one. */
export function CircleEditor({ q, set, autoFocus }) {
  const { t } = useTranslation(NS);
  const { t: tg } = useTranslation("guru/Guru");
  const rows = q.rows || [];
  const mode = q.mode === "underline" ? "underline" : "circle";
  const setRow = (r, patch) => set({ rows: rows.map((x, j) => (j === r ? { ...x, ...patch } : x)) });
  const setChoice = (r, k, v) => setRow(r, { options: rows[r].options.map((x, j) => (j === k ? v : x)) });
  const removeChoice = (r, k) => {
    const row = rows[r];
    const correct = row.correct === k ? null : row.correct > k ? row.correct - 1 : row.correct;
    setRow(r, { options: row.options.filter((_, j) => j !== k), correct });
  };
  const modes = [
    { v: "circle", name: t("words.modeCircle"), note: t("words.modeCircleNote"), ex: "هٰذَا …… صَغِيرٌ   بَيْتٌ · مَدْرَسَةٌ" },
    { v: "underline", name: t("words.modeUnderline"), note: t("words.modeUnderlineNote"), ex: "(هٰذَا / هٰذِهِ) بَيْتٌ" },
  ];
  return (
    <>
      <StemField q={q} set={set} fallback={tg(mode === "underline" ? "player.do.circleLine" : "player.do.circle")} autoFocus={autoFocus} />
      <div className={styles.modeCards}>
        {modes.map((m) => (
          <button key={m.v} type="button" className={`${styles.modeCard} ${mode === m.v ? styles.modeCardOn : ""}`} onClick={() => set({ mode: m.v })} aria-pressed={mode === m.v}>
            <b>
              {m.v === "circle" ? "◯" : "‗"} {m.name}
            </b>
            <span>{m.note}</span>
            <span className={styles.modeEx} dir="rtl">
              {m.ex}
            </span>
          </button>
        ))}
      </div>
      <HowTo
        steps={[
          t("words.circleHow1"),
          <>
            {t("words.circleHow2")}{" "}
            <span dir="rtl" className={styles.howToAr}>
              هٰذَا الْبَيْتُ *صَغِيرٌ*
            </span>
          </>,
          t("words.circleHow3"),
        ]}
      />
      {rows.map((row, r) => (
        <div key={r} className={styles.circleRow}>
          <Group wrap="nowrap" gap="xs" mb={8}>
            <span className={styles.wordNo}>{r + 1}.</span>
            <TextInput style={{ flex: 1 }} value={row.sentence || ""} dir={dirOf(row.sentence)} styles={arStyles(row.sentence)} placeholder={t("words.rowPh")} onChange={(e) => setRow(r, { sentence: e.currentTarget.value })} />
            {rows.length > 1 && (
              <ActionIcon variant="subtle" color="red" onClick={() => set({ rows: rows.filter((_, j) => j !== r) })} aria-label={t("words.remove")}>
                <IconTrash size={15} />
              </ActionIcon>
            )}
          </Group>
          <div className={styles.choiceList} dir={isArabic(row.sentence || row.options.join("")) ? "rtl" : "ltr"}>
            {row.options.map((opt, k) => {
              const right = row.correct === k;
              return (
                <div key={k} className={`${styles.choice} ${right ? styles.choiceRight : ""}`}>
                  <button type="button" className={`${styles.choiceMark} ${right ? styles.choiceMarkOn : ""}`} title={t("words.markRight")} aria-label={t("words.markRight")} aria-pressed={right} onClick={() => setRow(r, { correct: k })}>
                    {right ? <IconCheck size={14} stroke={3} /> : null}
                  </button>
                  <input value={opt} dir={dirOf(opt)} placeholder={t("words.choicePh")} className={isArabic(opt) ? styles.chipInputAr : undefined} onChange={(e) => setChoice(r, k, e.currentTarget.value)} />
                  {row.options.length > 2 && (
                    <button type="button" className={styles.choiceDel} aria-label={t("words.remove")} onClick={() => removeChoice(r, k)}>
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            {row.options.length < LIMITS.rowWords && (
              <Button size="compact-xs" variant="subtle" leftSection={<IconPlus size={12} />} onClick={() => setRow(r, { options: [...row.options, ""] })}>
                {t("words.addChoice")}
              </Button>
            )}
          </div>
        </div>
      ))}
      {rows.length < LIMITS.rows && (
        <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} onClick={() => set({ rows: [...rows, { sentence: "", options: ["", ""], correct: null }] })}>
          {t("words.addRow")}
        </Button>
      )}
      {rows.some((x) => (x.sentence || "").trim()) && (
        <div className={styles.wordPreview}>
          <span className={styles.howToLabel}>{t("words.preview")}</span>
          <CircleRows q={{ ...q, rows: rows.filter((x) => (x.sentence || "").trim()) }} picks={{}} onPick={() => {}} preview readOnly t={tg} />
        </div>
      )}
    </>
  );
}
