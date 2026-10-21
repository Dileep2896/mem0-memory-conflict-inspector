import type { Cluster, Memory, Resolution } from "./types";
import type { MemoryStore } from "./store/memory-store";
import { ResolutionSchema } from "./types";
import { splitSentences, tokenCosine } from "./text";
import { DUPLICATE_THRESHOLD } from "./detect";
import { NOW, today } from "./time";

export { isActive } from "./time";

/** Deterministic merge: newest phrasing wins for near-duplicate sentences; output is chronological. */
export function mergeText(members: Memory[]): string {
  const chrono = [...members].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const kept: { text: string; order: number }[] = [];
  chrono
    .map((m, order) => ({ m, order }))
    .reverse()
    .forEach(({ m, order }) => {
      for (const s of splitSentences(m.memory)) {
        if (kept.some((k) => tokenCosine(k.text, s) >= DUPLICATE_THRESHOLD)) continue;
        kept.push({ text: s, order });
      }
    });
  return kept
    .sort((a, b) => a.order - b.order)
    .map((k) => k.text)
    .join(". ");
}

export function applyResolution(store: MemoryStore, cluster: Cluster, action: Resolution, now: Date = NOW): void {
  ResolutionSchema.parse(action);
  const members = cluster.memberIds.map((id) => store.get(id)).filter((m): m is Memory => Boolean(m));
  const survivorId = cluster.newestId;
  const others = members.filter((m) => m.id !== survivorId);
  store.snapshot();

  const supersede = () => {
    for (const m of others) {
      store.update(m.id, { metadata: { superseded_by: survivorId }, expiration_date: today(now) }, now);
    }
  };

  switch (action) {
    case "supersede":
      supersede();
      break;
    case "merge": {
      if (store.get(survivorId)) store.update(survivorId, { memory: mergeText(members) }, now);
      supersede();
      break;
    }
    case "delete":
      for (const m of others) store.delete(m.id, now);
      break;
  }
}

export function undo(store: MemoryStore): boolean {
  return store.restore();
}
