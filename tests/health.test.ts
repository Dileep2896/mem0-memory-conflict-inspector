import { describe, it, expect } from "vitest";
import { healthScore, hygieneStats, measureImpact } from "@/lib/health";
import { detectClusters } from "@/lib/detect";
import { InMemoryMemoryStore } from "@/lib/store/in-memory-store";
import { applyResolution } from "@/lib/resolve";
import { seedMemories, PROBES } from "@/data/seed";
import { NOW } from "@/lib/time";
import { mem } from "./fixtures";

describe("healthScore", () => {
  it("is between 60 and 75 for sam at start", () => {
    const list = seedMemories().filter((m) => m.user_id === "sam");
    const s = healthScore(list, detectClusters(list, { now: NOW }), NOW);
    expect(s).toBeGreaterThanOrEqual(60);
    expect(s).toBeLessThanOrEqual(75);
  });

  it("reaches 100 after every cluster is resolved with its suggestion", () => {
    const store = new InMemoryMemoryStore(seedMemories());
    let clusters = detectClusters(store.getAll("sam"), { now: NOW });
    while (clusters.length) {
      applyResolution(store, clusters[0], clusters[0].suggested, NOW);
      clusters = detectClusters(store.getAll("sam"), { now: NOW });
    }
    expect(healthScore(store.getAll("sam"), clusters, NOW)).toBe(100);
  });

  it("is 100 for an empty store and clamps to 0..100", () => {
    expect(healthScore([], [], NOW)).toBe(100);
    const one = [mem({ memory: "x" })];
    const bogus = [
      { id: "c", kind: "duplicate" as const, userId: "u1", memberIds: ["a", "b", "c"], reason: "r", suggested: "merge" as const, newestId: "a", probe: "x" },
    ];
    expect(healthScore(one, bogus, NOW)).toBe(0);
  });
});

describe("hygieneStats", () => {
  it("reports conflict, duplicate and stale counts", () => {
    const list = seedMemories().filter((m) => m.user_id === "sam");
    const s = hygieneStats(list, detectClusters(list, { now: NOW }), NOW);
    expect(s.conflicts).toBe(4);
    expect(s.duplicates).toBe(1);
    expect(s.expired).toBe(1);
    expect(s.active).toBe(list.length - 1);
    expect(s.flaggedPct).toBeGreaterThan(25);
  });
});

describe("measureImpact", () => {
  it("probes with stale facts in top-3 go to zero after cleanup, and tokens drop", () => {
    const impact = measureImpact(seedMemories(), "sam", PROBES.sam, NOW);
    expect(impact.probes).toBe(PROBES.sam.length);
    expect(impact.wrongBefore).toBeGreaterThanOrEqual(3);
    expect(impact.wrongAfter).toBe(0);
    expect(impact.scoreBefore).toBeLessThan(impact.scoreAfter);
    expect(impact.scoreAfter).toBe(100);
    expect(impact.tokensAfter).toBeLessThan(impact.tokensBefore);
    expect(impact.tokenReductionPct).toBeGreaterThan(0);
  });
});
