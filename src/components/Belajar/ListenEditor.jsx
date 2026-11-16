import { Alert, Button, Group, Loader, MultiSelect, Select, Switch, Text, Textarea } from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconRefresh, IconWand } from "@tabler/icons-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NS } from "./belajarSchema";
import { DEFAULT_RECITER, arabicDigits, useSurah } from "../Guru/quranApi";
import { pickOthers } from "./ayahTools";
import AyahPicker, { useAyahInsert } from "./AyahPicker";
import { StemField } from "./WordEditors";
import { ListenButton } from "../Guru/Recitation";
import rec from "../Guru/Recitation.module.css";
import styles from "./Belajar.module.css";

const MAX_OTHERS = 3;
const snippet = (text, words = 6) => {
  const w = (text || "").split(/\s+/);
  return w.length > words ? `${w.slice(0, words).join(" ")} …` : text || "";
};

/** Up to three other ayat of the surah (all of them in a short surah), picked at random, in ascending order. */
const autoPick = (count, ayah) => pickOthers(count, ayah, MAX_OTHERS);

/** The lesson's surah for the two ayah types, kept on the question too (the player needs no lesson). */
function useQuestionSurah(q, set, surah) {
  const n = Number(surah) || Number(q.surah) || 0;
  const loaded = useSurah(n, DEFAULT_RECITER);
  useEffect(() => {
    if (Number(surah) > 0 && Number(q.surah) !== Number(surah)) set({ surah: Number(surah) });
  }, [surah, q.surah, set]);
  return { n, ...loaded };
}

/** No surah number, a network error, or still loading: what to show instead of the editor. */
function SurahState({ n, error, retry }) {
  const { t } = useTranslation(NS);
  const { t: tg } = useTranslation("guru/Guru");
  if (!n)
    return (
      <Alert color="orange" icon={<IconAlertTriangle size={18} />}>
        {t("listen.noSurah")}
      </Alert>
    );
  if (error)
    return (
      <Alert color="red" icon={<IconAlertTriangle size={18} />}>
        <Group justify="space-between">
          <span>{tg("recite.errorBody")}</span>
          <Button size="xs" variant="light" color="red" leftSection={<IconRefresh size={14} />} onClick={retry}>
            {tg("recite.retry")}
          </Button>
        </Group>
      </Alert>
    );
  return <Loader size="sm" />;
}

/**
 * "Dengarkan & pilih": the ayah to play, and the other ayat of the same surah
 * shown beside its text. The texts come from AlQuran.cloud, never typed here.
 * The surah is the lesson's (`surah`); a question keeps its own copy of it.
 */
export function ListenEditor({ q, set, surah, autoFocus }) {
  const { t } = useTranslation(NS);
  const { t: tg } = useTranslation("guru/Guru");
  const state = useQuestionSurah(q, set, surah);
  const [caret, insert] = useAyahInsert(q.stem);
  const { n, data } = state;
  if (!n || !data) return <SurahState {...state} />;

  const ayat = data.ayahs;
  const ayah = Number(q.ayah) || null;
  const others = (q.options || []).filter((x) => x !== ayah);
  const label = (a) => `${tg("recite.ayahNo", { n: a.n })} · ${snippet(a.text)}`;
  const withOptions = (nextAyah, nextOthers) => ({ ayah: nextAyah, answer: nextAyah, options: nextAyah ? [nextAyah, ...nextOthers.filter((x) => x !== nextAyah)] : nextOthers });
  const textOf = (no) => ayat.find((a) => a.n === no)?.text || "";
  const current = ayat.find((a) => a.n === ayah);

  return (
    <>
      <Group justify="flex-end" mb={4}>
        <AyahPicker surah={n} audioOption={false} onPick={(a) => set({ stem: insert(a) })} />
      </Group>
      <Textarea autosize minRows={1} data-autofocus={autoFocus || undefined} placeholder={tg("player.do.listen")} value={q.stem || ""} onChange={(e) => set({ stem: e.currentTarget.value })} mb="sm" {...caret} />
      <Select
        label={t("listen.ayah")}
        description={t("listen.ayahHint")}
        placeholder={t("listen.pickAyah")}
        searchable
        data={ayat.map((a) => ({ value: String(a.n), label: label(a) }))}
        value={ayah ? String(ayah) : null}
        onChange={(v) => {
          const no = v ? Number(v) : null;
          set({ ...withOptions(no, others.length ? others : no ? autoPick(ayat.length, no) : []), surah: n });
        }}
        mb="sm"
      />
      {current && <ListenButton key={current.audio} ayah={current.n} audio={current.audio} fallback={current.fallback} t={tg} />}
      <Group align="flex-end" gap="xs" wrap="nowrap">
        <MultiSelect
          style={{ flex: 1 }}
          label={t("listen.others")}
          description={t("listen.othersHint", { count: MAX_OTHERS })}
          placeholder={others.length >= MAX_OTHERS ? undefined : t("listen.pickOthers")}
          maxValues={MAX_OTHERS}
          disabled={!ayah}
          data={ayat.filter((a) => a.n !== ayah).map((a) => ({ value: String(a.n), label: label(a) }))}
          value={others.map(String)}
          onChange={(vals) => set(withOptions(ayah, vals.map(Number).sort((a, b) => a - b)))}
        />
        <Button variant="light" color="#003366" leftSection={<IconWand size={14} />} disabled={!ayah || ayat.length < 2} onClick={() => set(withOptions(ayah, autoPick(ayat.length, ayah)))}>
          {t("listen.auto")}
        </Button>
      </Group>

      {ayah && (
        <>
          <Text size="xs" fw={700} mt="md" mb={6}>
            {t("listen.choices")}
          </Text>
          {(q.options || []).map((no) => (
            <div key={no} className={`${styles.option} ${no === ayah ? styles.optionRight : ""}`}>
              {no === ayah ? <IconCheck size={16} color="teal" /> : <span style={{ width: 16 }} />}
              <Text size="xs" c="dimmed" w={64}>
                {tg("recite.ayahNo", { n: no })}
              </Text>
              <span className={rec.choiceText} dir="rtl" lang="ar" style={{ flex: 1 }}>
                {textOf(no)}
              </span>
            </div>
          ))}
          <Text size="xs" c="dimmed" mt={6}>
            {t("listen.shuffled")}
          </Text>
        </>
      )}
    </>
  );
}

/**
 * «الآية رقم كم؟» (Ayat ke-berapa?): an ayah of the surah, shown and/or
 * played; the teacher picks its number among a few. The text and the
 * recitation come from AlQuran.cloud; only numbers are kept here.
 */
export function WhichEditor({ q, set, surah, autoFocus }) {
  const { t } = useTranslation(NS);
  const { t: tg } = useTranslation("guru/Guru");
  const state = useQuestionSurah(q, set, surah);
  const { n, data } = state;
  if (!n || !data) return <SurahState {...state} />;

  const ayat = data.ayahs;
  const ayah = Number(q.ayah) || null;
  const others = (q.options || []).filter((x) => x !== ayah);
  const withOptions = (nextAyah, nextOthers) => ({
    ayah: nextAyah,
    answer: nextAyah,
    options: (nextAyah ? [nextAyah, ...nextOthers.filter((x) => x !== nextAyah)] : nextOthers).sort((a, b) => a - b),
  });
  const current = ayat.find((a) => a.n === ayah);
  const showText = q.showText !== false;

  return (
    <>
      <StemField q={q} set={set} fallback={tg("player.do.which")} autoFocus={autoFocus} />
      <Select
        label={t("which.ayah")}
        description={t("listen.ayahHint")}
        placeholder={t("listen.pickAyah")}
        searchable
        data={ayat.map((a) => ({ value: String(a.n), label: `${tg("recite.ayahNo", { n: a.n })} · ${snippet(a.text)}` }))}
        value={ayah ? String(ayah) : null}
        onChange={(v) => {
          const no = v ? Number(v) : null;
          set({ ...withOptions(no, others.length ? others : no ? autoPick(ayat.length, no) : []), surah: n });
        }}
        mb="sm"
      />
      <Group gap="lg" mb="sm">
        <Switch color="#003366" checked={showText} onChange={(e) => set({ showText: e.currentTarget.checked })} label={t("which.showText")} data-which-text />
        <Switch color="#003366" checked={!!q.audio} onChange={(e) => set({ audio: e.currentTarget.checked })} label={t("which.audio")} data-which-audio />
      </Group>
      {current && showText && (
        <p className={rec.whichText} dir="rtl" lang="ar">
          {current.text}
        </p>
      )}
      {current && q.audio && <ListenButton key={current.audio} ayah={current.n} audio={current.audio} fallback={current.fallback} t={tg} />}
      <Group align="flex-end" gap="xs" wrap="nowrap">
        <MultiSelect
          style={{ flex: 1 }}
          label={t("which.others")}
          description={t("which.othersHint", { count: MAX_OTHERS })}
          placeholder={others.length >= MAX_OTHERS ? undefined : t("listen.pickOthers")}
          maxValues={MAX_OTHERS}
          disabled={!ayah}
          data={ayat.filter((a) => a.n !== ayah).map((a) => ({ value: String(a.n), label: tg("recite.ayahNo", { n: a.n }) }))}
          value={others.map(String)}
          onChange={(vals) => set(withOptions(ayah, vals.map(Number)))}
        />
        <Button variant="light" color="#003366" leftSection={<IconWand size={14} />} disabled={!ayah || ayat.length < 2} onClick={() => set(withOptions(ayah, autoPick(ayat.length, ayah)))} data-which-auto>
          {t("listen.auto")}
        </Button>
      </Group>

      {ayah && (
        <>
          <Text size="xs" fw={700} mt="md" mb={6}>
            {t("listen.choices")}
          </Text>
          <Group gap={8} data-which-choices>
            {(q.options || []).map((no) => (
              <span key={no} className={`${styles.whichOpt} ${no === ayah ? styles.whichOptRight : ""}`} data-option={no}>
                {no === ayah && <IconCheck size={14} color="teal" />}
                <span className={rec.numAr} lang="ar">
                  {arabicDigits(no)}
                </span>
                <span>{no}</span>
              </span>
            ))}
          </Group>
        </>
      )}
    </>
  );
}
