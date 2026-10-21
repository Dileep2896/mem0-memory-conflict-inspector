import type { Memory, RecallResult } from "./types";
import { tokenCosine } from "./text";
import { NOW, daysBetween, isActive } from "./time";

export interface RecallOptions {
  k?: number;
  /** Mirrors the common `latest_only` recall flag: skip superseded and expired memories. */
  latestOnly?: boolean;
  minSimilarity?: number;
  now?: Date;
}

const RECENCY_WEIGHT = 0.05;
const RECENCY_HORIZON_DAYS = 730;

export function recall(memories: Memory[], query: string, opts: RecallOptions = {}): RecallResult[] {
  const { k = 3, latestOnly = true, minSimilarity = 0, now = NOW } = opts;
  return memories
    .filter((m) => !latestOnly || isActive(m, now))
    .map((m) => {
      const similarity = tokenCosine(query, m.memory);
      const age = Math.max(0, daysBetween(m.created_at, now));
      const boost = RECENCY_WEIGHT * Math.max(0, 1 - age / RECENCY_HORIZON_DAYS);
      return { memory: m, similarity, score: similarity + boost };
    })
    .filter((r) => r.similarity > 0 && r.similarity >= minSimilarity)
    .sort((a, b) => b.score - a.score || a.memory.id.localeCompare(b.memory.id))
    .slice(0, k);
}
