// Building questions from the surah's own ayat. Every Qur'anic word here comes
// from AlQuran.cloud (loadSurah); these helpers only cut it at its spaces and
// put it back, never changing a character.

// an Arabic letter (a pause mark such as ۛ or ۚ standing alone is not a word)
const LETTER = /[ء-يٮ-ۓەۺ-ۿ]/;
export const isMarkOnly = (token) => !LETTER.test(token);

/** The ayah cut at its spaces, exactly as written: joined again with " " it is the ayah. */
export const ayahTokens = (text) => String(text || "").split(" ").filter((x) => x !== "");

/**
 * The ayah's words for Word Ordering: a pause mark standing alone stays with
 * the word before it ("رَيْبَ ۛ"), and a sign opening the ayah (۞) with the
 * word after it, so no "word" is a mark by itself.
 */
export function ayahWords(text) {
  const out = [];
  let lead = "";
  ayahTokens(text).forEach((tok) => {
    if (isMarkOnly(tok)) {
      if (out.length) out[out.length - 1] += ` ${tok}`;
      else lead += `${tok} `;
    } else {
      out.push(lead + tok);
      lead = "";
    }
  });
  if (lead) out.push(lead.trimEnd());
  return out;
}

// U+2067 RIGHT-TO-LEFT ISOLATE … U+2069 POP DIRECTIONAL ISOLATE: the ayah reads
// right to left inside a sentence in Indonesian or English, untouched itself
export const RLI = "⁧";
export const PDI = "⁩";
export const wrapRtl = (text) => `${RLI}${text}${PDI}`;

/** `text` put into `value` at `caret` (or at the end), with a space on each side where needed. */
export function insertAt(value, caret, text) {
  const v = value || "";
  const at = caret === null || caret === undefined || caret < 0 || caret > v.length ? v.length : caret;
  const before = v.slice(0, at);
  const after = v.slice(at);
  const pre = before && !/\s$/.test(before) ? " " : "";
  const post = after && !/^\s/.test(after) ? " " : "";
  return { value: `${before}${pre}${text}${post}${after}`, caret: before.length + pre.length + text.length };
}

export const BLANK = "__";

/**
 * Fill in the Blanks from an ayah: the indexes of the tokens turned into
 * blanks, read back from a sentence made by `fillFrom` (null when the sentence
 * was not made from this ayah).
 */
export function blanksOf(sentence, tokens) {
  const parts = String(sentence || "").split(" ").filter((x) => x !== "");
  if (parts.length !== tokens.length) return null;
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === BLANK && !isMarkOnly(tokens[i])) out.push(i);
    else if (parts[i] !== tokens[i]) return null;
  }
  return out;
}

/** The sentence with __ for each blanked token, and the answers in reading order. */
export function fillFrom(tokens, blanks) {
  const set = new Set(blanks);
  const sentence = tokens.map((tok, i) => (set.has(i) ? BLANK : tok)).join(" ");
  const answers = tokens.filter((_, i) => set.has(i));
  return { sentence, answers };
}

/** Up to `max` other ayat of the surah, picked at random, in ascending order. */
export function pickOthers(count, ayah, max = 3) {
  const pool = Array.from({ length: count }, (_, i) => i + 1).filter((n) => n !== ayah);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, max).sort((a, b) => a - b);
}
