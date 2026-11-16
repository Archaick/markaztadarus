import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconAlertTriangle, IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlayerStopFilled, IconRefresh, IconRepeat, IconRepeatOnce, IconVolume } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { RECITERS, arabicDigits, reciterKey, useReciter, useSurah } from "./quranApi";
import rec from "./Recitation.module.css";

const NS = "guru/Guru";
const RATES = [0.75, 1];

/** The ayah-end medallion of a mushaf: a gold ring with the number in Arabic-Indic digits. */
export function AyahMark({ n }) {
  // drawn, not left to a font's ۝: every browser and font sets it the same, digits centred
  return (
    <span className={rec.mark} aria-label={String(n)}>
      <span>{arabicDigits(n)}</span>
    </span>
  );
}

/**
 * Two <audio> elements taking turns: while one plays, the other has already
 * loaded the next ayah, so "play all" goes on without a gap. A file that will
 * not load tries the API's second copy once.
 */
function useAyahAudio(items) {
  const els = useRef([null, null]);
  const cur = useRef(0);
  const [state, setState] = useState({ at: -1, playing: false, all: false });
  const [repeat, setRepeat] = useState(false);
  const [rate, setRate] = useState(1);
  const live = useRef({ items, state, repeat });
  live.current = { items, state, repeat };

  const el = (i) => els.current[i];
  const preload = useCallback((at) => {
    const next = live.current.items[at + 1];
    const spare = el(1 - cur.current);
    if (!spare) return;
    if (next?.audio && spare.dataset.src !== next.audio) {
      spare.dataset.src = next.audio;
      spare.src = next.audio;
      spare.preload = "auto";
      spare.load();
    }
  }, []);

  const start = useCallback(
    (at, all) => {
      const item = live.current.items[at];
      if (!item?.audio) return;
      const old = el(cur.current);
      const spare = el(1 - cur.current);
      if (!old || !spare) return;
      old.pause();
      // the next ayah is already waiting in the spare element: swap to it
      if (spare.dataset.src === item.audio) cur.current = 1 - cur.current;
      const now = el(cur.current);
      if (now.dataset.src !== item.audio) {
        now.dataset.src = item.audio;
        now.dataset.tried = "";
        now.src = item.audio;
      }
      now.dataset.fallback = item.fallback || "";
      now.currentTime = 0;
      now.playbackRate = rate;
      now.defaultPlaybackRate = rate;
      setState({ at, playing: true, all });
      now.play().catch(() => setState((s) => ({ ...s, playing: false })));
      if (all) preload(at);
    },
    [preload, rate]
  );

  const stop = useCallback(() => {
    els.current.forEach((a) => a?.pause());
    setState({ at: -1, playing: false, all: false });
  }, []);

  const pause = useCallback(() => {
    el(cur.current)?.pause();
    setState((s) => ({ ...s, playing: false }));
  }, []);

  const resume = useCallback(() => {
    const a = el(cur.current);
    if (!a || live.current.state.at < 0) return;
    setState((s) => ({ ...s, playing: true }));
    a.play().catch(() => setState((s) => ({ ...s, playing: false })));
  }, []);

  const onEnded = useCallback(
    (e) => {
      if (e.currentTarget !== el(cur.current)) return;
      const { state: s, repeat: again, items: list } = live.current;
      if (again) {
        start(s.at, s.all);
        return;
      }
      if (s.all && s.at + 1 < list.length) start(s.at + 1, true);
      else setState({ at: s.all ? -1 : s.at, playing: false, all: false });
    },
    [start]
  );

  const onError = useCallback((e) => {
    const a = e.currentTarget;
    const fb = a.dataset.fallback;
    if (a !== el(cur.current) || !fb || a.dataset.tried) return;
    a.dataset.tried = "1";
    a.src = fb;
    a.play().catch(() => setState((s) => ({ ...s, playing: false })));
  }, []);

  // a new speed applies at once, also to the ayah already playing
  useEffect(() => {
    els.current.forEach((a) => {
      if (!a) return;
      a.playbackRate = rate;
      a.defaultPlaybackRate = rate;
    });
  }, [rate]);

  // a new reciter or surah: start again from silence; leaving the page stops it
  useEffect(() => stop, [items, stop]);

  const audio = [0, 1].map((i) => <audio key={i} ref={(a) => (els.current[i] = a)} preload="none" onEnded={onEnded} onError={onError} data-role={`ayah-audio-${i}`} />);
  return { audio, ...state, repeat, setRepeat, rate, setRate, start, stop, pause, resume };
}

/** The reciter's name in the page's language, as a picker. */
function ReciterSelect({ value, onChange, t, id }) {
  return (
    <select id={id} className={rec.select} value={value} onChange={(e) => onChange(e.currentTarget.value)} aria-label={t("recite.reciterLabel")}>
      {RECITERS.map((r) => (
        <option key={r.id} value={r.id}>
          {t(`recite.reciter.${r.key}`)}
        </option>
      ))}
    </select>
  );
}

/** Loading, or a friendly note with a retry when the network failed. */
function Status({ error, retry, t }) {
  if (error)
    return (
      <div className={rec.error} role="alert">
        <IconAlertTriangle size={20} />
        <div>
          <b>{t("recite.errorTitle")}</b>
          <span>{t("recite.errorBody")}</span>
        </div>
        <button type="button" className={rec.retry} onClick={retry}>
          <IconRefresh size={16} /> {t("recite.retry")}
        </button>
      </div>
    );
  return (
    <div className={rec.loading} aria-live="polite">
      <span className={rec.spinner} aria-hidden="true" /> {t("recite.loading")}
    </div>
  );
}

/**
 * The surah read aloud, ayah by ayah, in the Uthmani script: play all with
 * the ayah being recited lit up and kept in view, one ayah on its own,
 * repeat, speed, and the reciter. `reciter` set from outside (the admin's
 * pick for the item) hides the switcher; otherwise the teacher's own choice
 * (kept on this device) wins over the item's default `itemReciter`.
 * `compact` (the admin's editor): the ayat in a short scrolling box, each still playable.
 */
export default function RecitationPanel({ surah, itemReciter, reciter: fixed, compact = false }) {
  const { t } = useTranslation(NS);
  const [chosen, choose] = useReciter(itemReciter);
  const reciter = fixed || chosen;
  const { data, error, loading, retry } = useSurah(surah, reciter);
  // the basmala (when the surah has it apart) is the first line, unnumbered
  const items = useMemo(() => (data ? [...(data.basmala ? [{ n: 0, text: data.basmala, audio: data.basmalaAudio, fallback: "" }] : []), ...data.ayahs] : []), [data]);
  const player = useAyahAudio(items);
  const list = useRef(null);

  // the ayah being recited stays in view
  useEffect(() => {
    if (player.at < 0) return;
    const row = list.current?.querySelector(`[data-at="${player.at}"]`);
    if (!row) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // in the editor's box only the box scrolls, never the admin's page
    if (compact) {
      const box = list.current;
      box.scrollTo({ top: row.offsetTop - box.clientHeight / 2 + row.clientHeight / 2, behavior: still ? "auto" : "smooth" });
      return;
    }
    row.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
  }, [player.at, compact]);

  const name = t(`recite.reciter.${reciterKey(reciter)}`);
  const busy = player.at >= 0;
  const selectId = `reciter-${surah}`;

  return (
    <section className={`${rec.panel} ${compact ? rec.compact : ""}`} aria-label={t("recite.title")}>
      <div className={rec.head}>
        <span className={rec.kicker}>
          <IconVolume size={15} /> {t("recite.title")}
        </span>
        {!fixed ? (
          <label className={rec.reciterPick} htmlFor={selectId}>
            <span>{t("recite.reciterLabel")}</span>
            <ReciterSelect id={selectId} value={reciter} onChange={choose} t={t} />
          </label>
        ) : (
          <span className={rec.reciterName}>{name}</span>
        )}
      </div>
      {/* the surah's name as a mushaf's heading band */}
      {data?.name && (
        <div className={rec.titleBand}>
          <span className={rec.surahName} dir="rtl" lang="ar">
            {data.name}
          </span>
        </div>
      )}

      <div className={rec.controls}>
        {!busy ? (
          <button type="button" className={rec.playAll} disabled={!items.length} onClick={() => player.start(0, true)}>
            <IconPlayerPlayFilled size={18} /> {t("recite.playAll")}
          </button>
        ) : (
          <>
            <button type="button" className={rec.playAll} onClick={player.playing ? player.pause : player.resume}>
              {player.playing ? <IconPlayerPauseFilled size={18} /> : <IconPlayerPlayFilled size={18} />} {t(player.playing ? "recite.pause" : "recite.resume")}
            </button>
            <button type="button" className={rec.tool} onClick={player.stop} aria-label={t("recite.stop")} title={t("recite.stop")}>
              <IconPlayerStopFilled size={18} />
            </button>
          </>
        )}
        <button
          type="button"
          className={`${rec.tool} ${player.repeat ? rec.toolOn : ""}`}
          aria-pressed={player.repeat}
          onClick={() => player.setRepeat(!player.repeat)}
          title={t("recite.repeat")}
        >
          {player.repeat ? <IconRepeatOnce size={18} /> : <IconRepeat size={18} />}
          <span className={rec.toolText}>{t("recite.repeat")}</span>
        </button>
        <div className={rec.rates} role="group" aria-label={t("recite.speed")}>
          {RATES.map((r) => (
            <button key={r} type="button" className={`${rec.rate} ${player.rate === r ? rec.rateOn : ""}`} aria-pressed={player.rate === r} onClick={() => player.setRate(r)}>
              {r}×
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        (loading || error) && <Status error={error} retry={retry} t={t} />
      ) : (
        <ol className={rec.ayahs} ref={list}>
          {items.map((a, i) => {
            const on = player.at === i;
            return (
              <li key={a.n} data-at={i} dir="rtl" className={`${rec.ayah} ${a.n === 0 ? rec.basmala : ""} ${on ? rec.ayahOn : ""}`} aria-current={on ? "true" : undefined}>
                <p className={rec.text} dir="rtl" lang="ar">
                  {a.text}
                  {a.n > 0 && (
                    <>
                      {" "}
                      <AyahMark n={a.n} />
                    </>
                  )}
                </p>
                <button
                  type="button"
                  className={`${rec.one} ${on && player.playing ? rec.oneOn : ""}`}
                  onClick={() => (on && player.playing ? player.pause() : on ? player.resume() : player.start(i, false))}
                  aria-label={a.n ? t("recite.playAyah", { n: a.n }) : t("recite.playBasmala")}
                  title={a.n ? t("recite.playAyah", { n: a.n }) : t("recite.playBasmala")}
                >
                  {on && player.playing ? <IconPlayerPauseFilled size={15} /> : <IconPlayerPlayFilled size={15} />}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <p className={rec.credit}>
        {t("recite.credit", { name })} · <span dir="ltr">AlQuran.cloud</span>
      </p>
      {player.audio}
    </section>
  );
}

/**
 * The big play button of "Listen & choose": one ayah, the reciter in use, the
 * same cached surah. Pressing it again while it plays starts it over.
 */
export function ListenButton({ ayah, audio, fallback, t, disabled }) {
  const el = useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const a = el.current;
    return () => a?.pause();
  }, [audio]);
  const go = () => {
    const a = el.current;
    if (!a || !audio) return;
    if (a.dataset.src !== audio) {
      a.dataset.src = audio;
      a.dataset.tried = "";
      a.src = audio;
    }
    a.currentTime = 0;
    setPlaying(true);
    a.play().catch(() => setPlaying(false));
  };
  return (
    <div className={rec.listen}>
      <button type="button" className={`${rec.listenBtn} ${playing ? rec.listenOn : ""}`} onClick={go} disabled={disabled || !audio} aria-label={t("recite.listenPlay")}>
        <IconVolume size={34} />
      </button>
      <span className={rec.listenLabel}>{playing ? t("recite.listening") : t("recite.listenPlay")}</span>
      <audio
        ref={el}
        preload="auto"
        src={audio || undefined}
        data-src={audio || ""}
        data-role="listen-audio"
        data-ayah={ayah}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onError={(e) => {
          const a = e.currentTarget;
          if (!fallback || a.dataset.tried) return setPlaying(false);
          a.dataset.tried = "1";
          a.src = fallback;
          if (playing) a.play().catch(() => setPlaying(false));
        }}
      />
    </div>
  );
}

/**
 * The small play button of any question that carries an ayah (`q.audio`):
 * one ayah in the reciter in use; pressed while playing it pauses.
 */
export function AyahPlayButton({ ayah, audio, fallback, t, disabled }) {
  const el = useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const a = el.current;
    return () => a?.pause();
  }, [audio]);
  const go = () => {
    const a = el.current;
    if (!a || !audio) return;
    if (playing) {
      a.pause();
      return;
    }
    a.currentTime = 0;
    setPlaying(true);
    a.play().catch(() => setPlaying(false));
  };
  return (
    <div className={rec.small}>
      <button type="button" className={`${rec.smallBtn} ${playing ? rec.smallOn : ""}`} onClick={go} disabled={disabled || !audio} aria-pressed={playing}>
        {playing ? <IconPlayerPauseFilled size={16} /> : <IconPlayerPlayFilled size={16} />}
        <span>{playing ? t("recite.listening") : t("recite.listenPlay")}</span>
      </button>
      <audio
        ref={el}
        preload="none"
        src={audio || undefined}
        data-role="ayah-play"
        data-ayah={ayah}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onError={(e) => {
          const a = e.currentTarget;
          if (!fallback || a.dataset.tried) return setPlaying(false);
          a.dataset.tried = "1";
          a.src = fallback;
          if (playing) a.play().catch(() => setPlaying(false));
        }}
      />
    </div>
  );
}
