// Short sounds for the practice player, made in the browser (no audio files to
// download): a bright two-note chime when right, a soft low tone when wrong,
// and a little fanfare at the end. Teachers can switch them off; the choice is
// remembered on the device.

const KEY = "guru.sound";
let ctx = null;

export function soundOn() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* private mode: it just won't be remembered */
  }
}

function tone(freq, at, dur, type = "sine", peak = 0.16) {
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const SOUNDS = {
  right: () => {
    tone(880, 0, 0.14, "triangle", 0.18);
    tone(1318.5, 0.09, 0.32, "triangle", 0.18);
  },
  wrong: () => {
    tone(233, 0, 0.18, "triangle", 0.2);
    tone(174.6, 0.13, 0.32, "triangle", 0.2);
  },
  great: () => {
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(f, i * 0.11, i === 3 ? 0.7 : 0.2, "triangle", 0.16));
    tone(1568, 0.5, 0.6, "sine", 0.07);
  },
  done: () => {
    tone(392, 0, 0.2, "triangle", 0.15);
    tone(523.3, 0.14, 0.45, "triangle", 0.15);
  },
};

/** Plays one of: right, wrong, great, done (quietly does nothing if sound is off or unsupported). */
export function play(name) {
  if (!soundOn() || !SOUNDS[name]) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    SOUNDS[name]();
  } catch {
    /* no audio on this device */
  }
}
