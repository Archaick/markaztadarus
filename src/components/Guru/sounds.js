// Short sounds for the practice player, made in the browser (no audio files to
// download). Soft glass-bell notes in a small room, to suit the night sky: only
// pure tones with a gentle fade, so nothing buzzes like an old device. Teachers
// can switch them off; the choice is remembered on the device.

const KEY = "guru.sound";
let ctx = null;
let bus = null;

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

/** A short decaying whisper of noise: played through it, every note gets a soft room around it. */
function room(seconds = 1.5) {
  const length = Math.round(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let soft = 0;
    for (let i = 0; i < length; i++) {
      soft += ((Math.random() * 2 - 1) - soft) * 0.35; // takes the hiss off the top
      data[i] = soft * (1 - i / length) ** 3;
    }
  }
  return buffer;
}

function connect() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.ratio.value = 6;
  limiter.connect(ctx.destination);

  const warm = ctx.createBiquadFilter();
  warm.type = "lowpass";
  warm.frequency.value = 4200;

  const space = ctx.createConvolver();
  space.buffer = room();
  const wet = ctx.createGain();
  wet.gain.value = 0.55;

  warm.connect(limiter);
  warm.connect(space).connect(wet).connect(limiter);
  bus = warm;
}

// a bell's overtones: [how many times the pitch, how loud, how long it rings]
const BELL = [
  [1, 1, 1],
  [2.01, 0.2, 0.55],
  [3.02, 0.05, 0.3],
];
const PLAIN = [[1, 1, 1]];

function note(freq, at, dur, peak, { voices = BELL, attack = 0.012, glide = 1 } = {}) {
  const t0 = ctx.currentTime + at;
  voices.forEach(([times, level, ring]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const end = t0 + dur * ring;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * times, t0);
    if (glide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * times * glide, t0 + dur * 0.7);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak * level, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(bus);
    osc.start(t0);
    osc.stop(end + 0.05);
  });
}

const SOUNDS = {
  // two glass notes, rising
  right: () => {
    note(659.25, 0, 0.5, 0.17);
    note(987.77, 0.1, 0.85, 0.19);
  },
  // one low, rounded note that sinks a little: says "not quite" without scolding
  wrong: () => {
    note(233.08, 0, 0.55, 0.26, { voices: PLAIN, attack: 0.03, glide: 0.86 });
    note(349.23, 0, 0.3, 0.07, { voices: PLAIN, attack: 0.03, glide: 0.86 });
  },
  // the stars opening: a slow climb over a warm chord
  great: () => {
    note(261.63, 0, 1.9, 0.08, { voices: PLAIN, attack: 0.25 });
    note(392, 0.05, 1.9, 0.06, { voices: PLAIN, attack: 0.25 });
    [523.25, 659.25, 783.99, 987.77, 1318.51].forEach((f, i) => note(f, 0.08 + i * 0.13, i === 4 ? 1.6 : 0.8, 0.13));
  },
  // finished: a quiet settling pair
  done: () => {
    note(392, 0, 0.6, 0.15);
    note(523.25, 0.16, 1.1, 0.16);
  },
};

/** Plays one of: right, wrong, great, done (quietly does nothing if sound is off or unsupported). */
export function play(name) {
  if (!soundOn() || !SOUNDS[name]) return;
  try {
    if (!ctx) connect();
    if (ctx.state === "suspended") ctx.resume();
    SOUNDS[name]();
  } catch {
    /* no audio on this device */
  }
}
