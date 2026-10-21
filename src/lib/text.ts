/** Pure text utilities. A real deployment would swap `tokenCosine` for embeddings. */

const STOPWORDS = new Set(
  (
    "a an the is are was were be been am i you he she it we they this that these those for on in at to of and or " +
    "with as by from does do did what where which who whom how when why s his her their its my your our has have had " +
    "now about into over than then there here can will would should could just also any anything user"
  ).split(" "),
);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stem(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function tokenize(text: string): string[] {
  const norm = normalize(text);
  if (!norm) return [];
  return norm
    .split(" ")
    .filter((w) => !STOPWORDS.has(w))
    .map(stem);
}

function bag(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

export function tokenCosine(a: string, b: string): number {
  const ta = bag(tokenize(a));
  const tb = bag(tokenize(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let dot = 0;
  for (const [t, n] of ta) dot += n * (tb.get(t) ?? 0);
  if (dot === 0) return 0;
  const norm = (m: Map<string, number>) => Math.sqrt([...m.values()].reduce((s, v) => s + v * v, 0));
  return dot / (norm(ta) * norm(tb));
}

/** FNV-1a 32-bit over normalized text. Stands in for an MD5 exact-match dedup hash. */
export function hashText(text: string): string {
  let h = 0x811c9dc5;
  for (const ch of normalize(text)) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Rough LLM token estimate: words plus punctuation marks. */
export function countTokens(text: string): number {
  return text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu)?.length ?? 0;
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(/[.!?]+$/, ""))
    .filter(Boolean);
}
