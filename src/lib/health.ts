import type { Cluster, Memory } from "./types";
import { detectClusters } from "./detect";
import { recall } from "./recall";
import { applyResolution } from "./resolve";
import { InMemoryMemoryStore } from "./store/in-memory-store";
import { countTokens } from "./text";
import { NOW, isActive, isExpired } from "./time";

export function healthScore(memories: Memory[], clusters: Cluster[], now: Date = NOW): number {
  const active = memories.filter((m) => isActive(m, now)).length;
  if (active === 0) return 100;
  const flagged = new Set(clusters.flatMap((c) => c.memberIds)).size;
  return Math.min(100, Math.max(0, Math.round(100 * (1 - flagged / active))));
}

export interface HygieneStats {
  total: number;
  active: number;
  superseded: number;
  expired: number;
  conflicts: number;
  duplicates: number;
  flagged: number;
  flaggedPct: number;
  score: number;
}

export function hygieneStats(memories: Memory[], clusters: Cluster[], now: Date = NOW): HygieneStats {
  const active = memories.filter((m) => isActive(m, now)).length;
  const flagged = new Set(clusters.flatMap((c) => c.memberIds)).size;
  return {
    total: memories.length,
    active,
    superseded: memories.filter((m) => m.metadata.superseded_by).length,
    expired: memories.filter((m) => !m.metadata.superseded_by && isExpired(m, now)).length,
    conflicts: clusters.filter((c) => c.kind === "conflict").length,
    duplicates: clusters.filter((c) => c.kind === "duplicate").length,
    flagged,
    flaggedPct: active ? Math.round((100 * flagged) / active) : 0,
    score: healthScore(memories, clusters, now),
  };
}

export interface Impact {
  probes: number;
  wrongBefore: number;
  wrongAfter: number;
  scoreBefore: number;
  scoreAfter: number;
  tokensBefore: number;
  tokensAfter: number;
  tokenReductionPct: number;
  clustersBefore: number;
}

const PROBE_K = 3;
const PROBE_MIN_SIMILARITY = 0.2;

/**
 * Runs each probe against the raw store (what ADD-only recall sees), resolves
 * every cluster with its suggested action, then re-runs with `latestOnly`.
 * A probe is "wrong" when its top-k contains a stale (non-newest) conflict member.
 */
export function measureImpact(memories: Memory[], userId: string, probes: string[], now: Date = NOW): Impact {
  const store = new InMemoryMemoryStore(memories);
  const initial = detectClusters(store.getAll(userId), { now });
  const stale = new Set(
    initial.filter((c) => c.kind === "conflict").flatMap((c) => c.memberIds.filter((id) => id !== c.newestId)),
  );
  const run = (latestOnly: boolean) => {
    let wrong = 0;
    let tokens = 0;
    for (const q of probes) {
      const r = recall(store.getAll(userId), q, { k: PROBE_K, latestOnly, minSimilarity: PROBE_MIN_SIMILARITY, now });
      if (r.some((x) => stale.has(x.memory.id))) wrong += 1;
      tokens += r.reduce((s, x) => s + countTokens(x.memory.memory), 0);
    }
    return { wrong, tokens };
  };
  const before = run(false);
  const scoreBefore = healthScore(store.getAll(userId), initial, now);

  let clusters = initial;
  let guard = 0;
  while (clusters.length && guard++ < 100) {
    applyResolution(store, clusters[0], clusters[0].suggested, now);
    clusters = detectClusters(store.getAll(userId), { now });
  }
  const after = run(true);
  return {
    probes: probes.length,
    wrongBefore: before.wrong,
    wrongAfter: after.wrong,
    scoreBefore,
    scoreAfter: healthScore(store.getAll(userId), clusters, now),
    tokensBefore: before.tokens,
    tokensAfter: after.tokens,
    tokenReductionPct: before.tokens ? Math.round(100 * (1 - after.tokens / before.tokens)) : 0,
    clustersBefore: initial.length,
  };
}
