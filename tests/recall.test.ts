import { describe, it, expect } from "vitest";
import { recall } from "@/lib/recall";
import { InMemoryMemoryStore } from "@/lib/store/in-memory-store";
import { applyResolution } from "@/lib/resolve";
import { detectClusters } from "@/lib/detect";
import { seedMemories } from "@/data/seed";
import { NOW } from "@/lib/time";
import { mem } from "./fixtures";

describe("recall", () => {
  it("returns both employers before cleanup and only Globex after supersede", () => {
    const store = new InMemoryMemoryStore(seedMemories());
    const q = "Where does Sam work?";
    const before = recall(store.getAll("sam"), q, { k: 3, latestOnly: false, now: NOW });
    const texts = before.map((r) => r.memory.memory).join(" | ");
    expect(texts).toMatch(/Acme/);
    expect(texts).toMatch(/Globex/);

    const c = detectClusters(store.getAll("sam"), { now: NOW }).find((x) => x.slot === "employer")!;
    applyResolution(store, c, "supersede", NOW);
    const after = recall(store.getAll("sam"), q, { k: 3, latestOnly: true, now: NOW });
    const afterTexts = after.map((r) => r.memory.memory).join(" | ");
    expect(afterTexts).toMatch(/Globex/);
    expect(afterTexts).not.toMatch(/Acme/);
  });

  it("latestOnly excludes expired memories", () => {
    const list = [
      mem({ memory: "Doing Dry January no alcohol", expiration_date: "2026-01-31" }),
      mem({ memory: "Drinks alcohol rarely" }),
    ];
    const raw = recall(list, "alcohol", { k: 3, latestOnly: false, now: NOW });
    const latest = recall(list, "alcohol", { k: 3, latestOnly: true, now: NOW });
    expect(raw).toHaveLength(2);
    expect(latest).toHaveLength(1);
  });

  it("ranks by similarity, with a small recency boost breaking near ties", () => {
    const list = [
      mem({ id: "old", memory: "Lives in Lisbon", created_at: "2025-01-01T00:00:00Z" }),
      mem({ id: "new", memory: "Lives in Berlin", created_at: "2026-10-01T00:00:00Z" }),
    ];
    const r = recall(list, "Where does Sam live?", { k: 2, latestOnly: false, now: NOW });
    expect(r[0].memory.id).toBe("new");
    expect(r[0].score).toBeGreaterThan(r[1].score);
  });

  it("respects k and drops zero-similarity results", () => {
    const r = recall(seedMemories().filter((m) => m.user_id === "sam"), "alcohol zebra", {
      k: 1,
      latestOnly: false,
      now: NOW,
    });
    expect(r.length).toBeLessThanOrEqual(1);
    expect(recall([mem({ memory: "Has a dog" })], "zebra", { now: NOW })).toEqual([]);
  });
});
