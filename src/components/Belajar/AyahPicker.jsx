import { ActionIcon, Alert, Button, Checkbox, Group, Loader, Modal, Text, TextInput } from "@mantine/core";
import { IconAlertTriangle, IconBook2, IconRefresh, IconSearch, IconVolume, IconX } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NS, audioRef } from "./belajarSchema";
import { insertAt, wrapRtl } from "./ayahTools";
import { DEFAULT_RECITER, useSurah } from "../Guru/quranApi";
import { AyahPlayButton } from "../Guru/Recitation";
import styles from "./Belajar.module.css";

/**
 * A small button that opens the lesson's surah, ayah by ayah (number and
 * Uthmani text, from AlQuran.cloud), to choose one. Nothing shows when the
 * lesson has no surah number. `onPick(ayah, { withAudio })` gets the API's
 * own `{ n, text }`. `audioOption` offers "+ suara" (sets `q.audio`);
 * `tooLong(ayah)` greys out ayat that do not fit (with a note).
 */
export default function AyahPicker({ surah, onPick, label, audioOption = true, audioDefault = false, tooLong }) {
  const { t } = useTranslation(NS);
  const [open, setOpen] = useState(false);
  const n = Number(surah) || 0;
  if (!n) return null;
  return (
    <>
      <Button size="compact-xs" variant="light" color="#003366" leftSection={<IconBook2 size={14} />} onClick={() => setOpen(true)} data-ayah-picker>
        {label || t("ayah.insert")}
      </Button>
      <Modal opened={open} onClose={() => setOpen(false)} title={t("ayah.title")} size="lg">
        {open && (
          <AyahList
            surah={n}
            audioOption={audioOption}
            audioDefault={audioDefault}
            tooLong={tooLong}
            onChoose={(a, opts) => {
              setOpen(false);
              onPick(a, opts);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function AyahList({ surah, audioOption, audioDefault, tooLong, onChoose }) {
  const { t } = useTranslation(NS);
  const { t: tg } = useTranslation("guru/Guru");
  const { data, error, loading, retry } = useSurah(surah, DEFAULT_RECITER);
  const [withAudio, setWithAudio] = useState(audioDefault);
  const [query, setQuery] = useState("");

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
  if (loading || !data) return <Loader size="sm" />;

  const q = query.trim();
  const list = data.ayahs.filter((a) => !q || String(a.n).startsWith(q));
  return (
    <>
      <Group gap="sm" mb="sm" align="center" wrap="wrap">
        {data.ayahs.length > 8 && (
          <TextInput
            size="xs"
            w={150}
            leftSection={<IconSearch size={14} />}
            placeholder={t("ayah.search")}
            inputMode="numeric"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value.replace(/\D/g, ""))}
          />
        )}
        {audioOption && <Checkbox size="sm" color="#003366" checked={withAudio} onChange={(e) => setWithAudio(e.currentTarget.checked)} label={t("ayah.withAudio")} data-with-audio />}
      </Group>
      <Text size="xs" c="dimmed" mb={8}>
        {t("ayah.source")}
      </Text>
      <div className={styles.ayahList}>
        {list.map((a) => {
          const long = tooLong?.(a);
          return (
            <button key={a.n} type="button" className={styles.ayahRow} disabled={!!long} onClick={() => onChoose(a, { withAudio: audioOption && withAudio })} data-ayah={a.n}>
              <span className={styles.ayahRowNo}>{a.n}</span>
              <span style={{ flex: 1 }}>
                <span className={styles.ayahRowText} dir="rtl" lang="ar" style={{ display: "block" }}>
                  {a.text}
                </span>
                {long && <span className={styles.ayahRowNote}>{long}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/**
 * "Ambil ayat" for one text field: remembers where the cursor was, and puts
 * the chosen ayah there (or at the end), wrapped to read right to left.
 * [props for the field, (ayah) => the field's new value].
 */
export function useAyahInsert(value) {
  const caret = useRef(null);
  const remember = (e) => {
    caret.current = e.currentTarget.selectionStart;
  };
  const insert = (ayah) => {
    const r = insertAt(value, caret.current, wrapRtl(ayah.text));
    caret.current = r.caret;
    return r.value;
  };
  return [{ onSelect: remember, onBlur: remember }, insert];
}

/** The ayah a question plays ("+ suara"), with a try-out button and a way to take it off. */
export function AudioTag({ q, set }) {
  const { t } = useTranslation(NS);
  const { t: tg } = useTranslation("guru/Guru");
  const ref = audioRef(q);
  const { data } = useSurah(ref ? ref.surah : 0, DEFAULT_RECITER);
  if (!ref) return null;
  const a = data?.ayahs.find((x) => x.n === ref.ayah);
  return (
    <div className={styles.audioTag} data-audio-tag>
      <IconVolume size={16} color="#003366" />
      <Text size="xs" fw={700} c="#003366">
        {t("ayah.audioOn", { n: ref.ayah })}
      </Text>
      <AyahPlayButton key={a?.audio || ""} ayah={ref.ayah} audio={a?.audio} fallback={a?.fallback} t={tg} disabled={!a} />
      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => set({ audio: null })} aria-label={t("ayah.audioRemove")} title={t("ayah.audioRemove")}>
        <IconX size={14} />
      </ActionIcon>
    </div>
  );
}
