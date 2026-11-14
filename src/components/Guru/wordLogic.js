// The three word types (Fill in the Blanks, Word Ordering, Circle the Word):
// marking and the answer in words, shared by the player and the admin pages.
import { BLANK_RE, bankOf, keyOf } from "../Belajar/belajarSchema";

/** The same shuffle for one question every time it shows. */
export const shuffle = (n, seed) => {
  const out = Array.from({ length: n }, (_, i) => i);
  let h = 7;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  for (let i = n - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Fill in the Blanks and Word Ordering: right when every slot holds its word. */
export const wordsRight = (q, slots) => {
  const bank = bankOf(q);
  const key = keyOf(q);
  return key.length > 0 && key.every((w, i) => slots[i] !== null && slots[i] !== undefined && bank[slots[i]] === w);
};
/** Circle the Word: right when every row has its word. */
export const rowsRight = (q, picks) => (q.rows || []).every((r, i) => picks[i] === r.correct);

/** The answer in words, for the sheet after a wrong try (and the admin's key). */
export function wordsAnswer(q) {
  if (q.type === "order") return keyOf(q).join(" ");
  if (q.type === "fillblank") {
    const key = keyOf(q);
    return (q.sentence || "").split(BLANK_RE).reduce((out, part, i) => out + part + (i < key.length ? `[${key[i]}]` : ""), "");
  }
  if (q.type === "circle") return (q.rows || []).map((r, i) => `${i + 1}. ${(r.options || [])[r.correct] ?? "?"}`).join("\n");
  return "";
}
