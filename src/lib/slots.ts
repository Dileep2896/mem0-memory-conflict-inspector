import { stem } from "./text";

/**
 * Rule-based attribute slots. Two active memories with the same slot key but a
 * different value are a conflict. Multi-valued facts (allergies, preferences per
 * object) carry the object in the key so they never collide with each other.
 */
export interface Slot {
  key: string;
  value: string;
  /** Human-readable slot name for reasons and the UI. */
  label: string;
}

const COMPANY_SUFFIX = /\s+(corp|corporation|inc|ltd|llc|gmbh|co)$/;
const TRAILING_FILLER = /\s+(now|again|these days|lately)$/;

const clean = (v: string) => v.trim().toLowerCase().replace(TRAILING_FILLER, "").trim();

type Rule = (text: string) => Omit<Slot, "label"> & { label?: string } | null;

const rules: Rule[] = [
  (t) => {
    const m = t.match(/\b(?:[Ww]orks?|[Ww]orking|[Ee]mployed) (?:at|for) ([A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*)*)/);
    return m ? { key: "employer", value: clean(m[1]).replace(COMPANY_SUFFIX, "") } : null;
  },
  (t) => {
    const m = t.match(/\b[Ww]orks as an? ([a-z ]+?)(?=[.,;]|\s+at\b|$)/);
    return m ? { key: "role", value: clean(m[1]) } : null;
  },
  (t) => {
    const m = t.match(/\b(?:on|upgraded to|downgraded to|switched to|moved to) the ([A-Za-z]+) plan\b/i);
    return m ? { key: "plan", value: clean(m[1]) } : null;
  },
  (t) => {
    const m = t.match(/\b(?:[Ll]ives?|[Ll]iving|[Bb]ased|[Mm]oved|[Rr]elocated) (?:in|to) ([A-Z][a-zA-Z-]+(?:\s+[A-Z][a-zA-Z-]+)*)/);
    return m ? { key: "city", value: clean(m[1]) } : null;
  },
  (t) => {
    const m = t.match(/\b(vegetarian|vegan|pescatarian|omnivore|keto|flexitarian)\b/i);
    return m ? { key: "diet", value: clean(m[1]) } : null;
  },
  (t) => {
    const m = t.match(/\b[Ff]avou?rite ([a-z]+(?: [a-z]+)?) is ([^,.;]+)/);
    return m ? { key: `favorite_${m[1].replace(/ /g, "_")}`, value: clean(m[2]) } : null;
  },
  (t) => {
    const m = t.match(/\b(married|engaged|divorced|single|in a relationship)\b/i);
    return m ? { key: "relationship", value: clean(m[1]) } : null;
  },
  (t) => {
    const m = t.match(/\b[Tt]ime ?zone is ([A-Za-z_/+\-0-9]+)/);
    return m ? { key: "timezone", value: clean(m[1]) } : null;
  },
  (t) => {
    const m = t.match(/\b[Aa]llergic to ([a-z]+)/);
    return m
      ? { key: `allergy:${stem(m[1].toLowerCase())}`, value: "yes", label: `allergy: ${m[1].toLowerCase()}` }
      : null;
  },
  (t) => {
    const m = t.match(/\b(loves?|likes?|enjoys?|hates?|dislikes?|can't stand|cannot stand) ([a-z]+)/i);
    if (!m) return null;
    const negative = /^(hate|dislike|can't|cannot)/i.test(m[1]);
    const object = m[2].toLowerCase();
    return { key: `preference:${stem(object)}`, value: negative ? "negative" : "positive", label: `preference: ${object}` };
  },
  (t) => {
    const m = t.match(/\b[Pp]referred language is ([A-Za-z]+)/);
    return m ? { key: "language", value: clean(m[1]) } : null;
  },
  (t) => {
    const m = t.match(/\b[Ss]hoe size (?:is )?(\d+(?:\.\d+)?)/);
    return m ? { key: "shoe_size", value: m[1] } : null;
  },
];

export function extractSlot(text: string): Slot | null {
  if (!text) return null;
  for (const rule of rules) {
    const slot = rule(text);
    if (slot) return { ...slot, label: slot.label ?? slot.key };
  }
  return null;
}

/** A natural probe question for the recall preview, keyed by slot. */
export function probeFor(slot: Slot, name: string, fallback: string): string {
  const slotKey = slot.key;
  if (slotKey.startsWith("preference:")) return `Does ${name} like ${slot.label.slice("preference: ".length)}?`;
  if (slotKey === "employer") return `Where does ${name} work?`;
  if (slotKey === "city") return `Where does ${name} live?`;
  if (slotKey === "diet") return `What does ${name} eat?`;
  if (slotKey === "role") return `What is ${name}'s role?`;
  if (slotKey === "plan") return `Which plan is ${name} on?`;
  if (slotKey === "language") return `What is ${name}'s preferred language?`;
  if (slotKey === "shoe_size") return `What is ${name}'s shoe size?`;
  if (slotKey === "timezone") return `What timezone is ${name} in?`;
  if (slotKey === "relationship") return `Is ${name} married?`;
  if (slotKey.startsWith("favorite_")) return `What is ${name}'s favorite ${slotKey.slice(9).replace(/_/g, " ")}?`;
  return fallback;
}
