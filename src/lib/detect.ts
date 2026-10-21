import type { Cluster, Memory } from "./types";
import { extractSlot, probeFor, type Slot } from "./slots";
import { hashText, tokenCosine } from "./text";
import { NOW, isActive } from "./time";

export const DUPLICATE_THRESHOLD = 0.82; // threshold used by community memory-hygiene scripts

export interface DetectOptions {
  now?: Date;
  threshold?: number;
  names?: Record<string, string>;
}

const byAge = (a: Memory, b: Memory) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);

export function newestOf(members: Memory[]): Memory {
  return [...members].sort(byAge).at(-1)!;
}

const displayName = (userId: string, names?: Record<string, string>) =>
  names?.[userId] ?? userId.charAt(0).toUpperCase() + userId.slice(1);

const hashOf = (m: Memory) => m.hash || hashText(m.memory);

export function detectClusters(memories: Memory[], opts: DetectOptions = {}): Cluster[] {
  const now = opts.now ?? NOW;
  const threshold = opts.threshold ?? DUPLICATE_THRESHOLD;
  const byUser = new Map<string, Memory[]>();
  for (const m of memories) {
    if (!isActive(m, now)) continue;
    const list = byUser.get(m.user_id) ?? [];
    list.push(m);
    byUser.set(m.user_id, list);
  }

  const clusters: Cluster[] = [];
  for (const [userId, list] of byUser) {
    const name = displayName(userId, opts.names);
    const sorted = [...list].sort(byAge);
    const claimed = new Set<string>();

    // 1. Slot rules: same key, different value -> conflict; same value -> duplicate.
    const slotGroups = new Map<string, { m: Memory; value: string; slot: Slot }[]>();
    for (const m of sorted) {
      const slot = extractSlot(m.memory);
      if (!slot) continue;
      const g = slotGroups.get(slot.key) ?? [];
      g.push({ m, value: slot.value, slot });
      slotGroups.set(slot.key, g);
    }
    for (const [key, group] of slotGroups) {
      if (group.length < 2) continue;
      const members = group.map((g) => g.m);
      const newest = newestOf(members);
      const values = [...new Set(group.map((g) => g.value))];
      const isConflict = values.length > 1;
      const slot = group.find((g) => g.m.id === newest.id)!.slot;
      members.forEach((m) => claimed.add(m.id));
      clusters.push({
        id: `${isConflict ? "conflict" : "duplicate"}:${userId}:${key}`,
        kind: isConflict ? "conflict" : "duplicate",
        userId,
        slot: key,
        label: slot.label,
        values,
        memberIds: members.map((m) => m.id),
        newestId: newest.id,
        suggested: isConflict ? "supersede" : "merge",
        reason: isConflict
          ? `same slot \`${slot.label}\`, different value (${values.join(" → ")}), newer wins`
          : `same slot \`${slot.label}\`, same value (${values[0]})`,
        probe: probeFor(slot, name, newest.memory),
      });
    }

    // 2. Text similarity on what is left: exact hash or token cosine >= threshold.
    const rest = sorted.filter((m) => !claimed.has(m.id));
    const parent = rest.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const pairScore: number[][] = [];
    for (let i = 0; i < rest.length; i++) {
      pairScore[i] = [];
      for (let j = i + 1; j < rest.length; j++) {
        const sameHash = hashOf(rest[i]) === hashOf(rest[j]);
        const sim = sameHash ? 1 : tokenCosine(rest[i].memory, rest[j].memory);
        pairScore[i][j] = sim;
        if (sameHash || sim >= threshold) parent[find(j)] = find(i);
      }
    }
    const groups = new Map<number, number[]>();
    rest.forEach((_, i) => {
      const r = find(i);
      groups.set(r, [...(groups.get(r) ?? []), i]);
    });
    for (const idx of groups.values()) {
      if (idx.length < 2) continue;
      const members = idx.map((i) => rest[i]);
      const newest = newestOf(members);
      const allSameHash = members.every((m) => hashOf(m) === hashOf(members[0]));
      let max = 0;
      for (let a = 0; a < idx.length; a++)
        for (let b = a + 1; b < idx.length; b++) max = Math.max(max, pairScore[idx[a]][idx[b]] ?? 0);
      clusters.push({
        id: `duplicate:${userId}:${members[0].id}`,
        kind: "duplicate",
        userId,
        label: allSameHash ? "exact duplicate" : "near-duplicate",
        memberIds: members.map((m) => m.id),
        newestId: newest.id,
        suggested: "merge",
        reason: allSameHash
          ? `exact hash match (${hashOf(members[0])}), stored ${members.length} times`
          : `near-duplicate text, token cosine ${max.toFixed(2)} ≥ ${threshold}`,
        probe: newest.memory,
      });
    }
  }
  // conflicts first, then duplicates; stable by id
  return clusters.sort((a, b) => (a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind === "conflict" ? -1 : 1));
}
