import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryMemoryStore } from "@/lib/store/in-memory-store";
import { applyResolution, undo, isActive } from "@/lib/resolve";
import { detectClusters } from "@/lib/detect";
import { seedMemories } from "@/data/seed";
import { NOW, today } from "@/lib/time";
import type { Cluster } from "@/lib/types";

let store: InMemoryMemoryStore;
const clusters = () => detectClusters(store.getAll("sam"), { now: NOW });
const bySlot = (slot: string) => clusters().find((c) => c.slot === slot)!;
const dup = () => clusters().find((c) => c.kind === "duplicate")!;

beforeEach(() => {
  store = new InMemoryMemoryStore(seedMemories());
});

describe("applyResolution: supersede", () => {
  it("keeps newest active and marks the others superseded, never deleting", () => {
    const c = bySlot("employer");
    const before = store.getAll("sam").length;
    applyResolution(store, c, "supersede", NOW);
    expect(store.getAll("sam")).toHaveLength(before);
    const old = c.memberIds.filter((id) => id !== c.newestId);
    for (const id of old) {
      const m = store.get(id)!;
      expect(m.metadata.superseded_by).toBe(c.newestId);
      expect(m.expiration_date).toBe(today(NOW));
      expect(isActive(m, NOW)).toBe(false);
      expect(store.history(id).at(-1)!.event).toBe("UPDATE");
    }
    expect(isActive(store.get(c.newestId)!, NOW)).toBe(true);
  });

  it("removes the cluster from detection afterwards", () => {
    applyResolution(store, bySlot("employer"), "supersede", NOW);
    expect(clusters().find((c) => c.slot === "employer")).toBeUndefined();
  });
});

describe("applyResolution: merge", () => {
  it("rewrites the newest member with deduped text and supersedes the rest", () => {
    const c = dup();
    applyResolution(store, c, "merge", NOW);
    const survivor = store.get(c.newestId)!;
    expect(survivor.memory).toMatch(/marathon/i);
    // near-duplicate sentences collapse to one
    expect(survivor.memory.match(/marathon/gi)).toHaveLength(1);
    expect(store.history(c.newestId).at(-1)!.event).toBe("UPDATE");
    for (const id of c.memberIds.filter((x) => x !== c.newestId)) {
      expect(store.get(id)!.metadata.superseded_by).toBe(c.newestId);
    }
  });

  it("keeps distinct sentences when merging a conflict", () => {
    const c = bySlot("city");
    applyResolution(store, c, "merge", NOW);
    const text = store.get(c.newestId)!.memory;
    expect(text).toMatch(/Berlin/);
    expect(text).toMatch(/Lisbon/);
  });
});

describe("applyResolution: delete", () => {
  it("removes all but newest and records DELETE history", () => {
    const c = bySlot("diet");
    const old = c.memberIds.filter((id) => id !== c.newestId);
    applyResolution(store, c, "delete", NOW);
    for (const id of old) {
      expect(store.get(id)).toBeUndefined();
      expect(store.history(id).at(-1)!.event).toBe("DELETE");
    }
    expect(store.get(c.newestId)).toBeDefined();
  });
});

describe("undo", () => {
  it("round-trips every action back to the original state", () => {
    const original = JSON.stringify(store.getAll("sam"));
    for (const action of ["supersede", "merge", "delete"] as const) {
      applyResolution(store, bySlot("employer"), action, NOW);
      expect(JSON.stringify(store.getAll("sam"))).not.toBe(original);
      expect(undo(store)).toBe(true);
      expect(JSON.stringify(store.getAll("sam"))).toBe(original);
    }
  });

  it("returns false when there is nothing to undo", () => {
    expect(undo(store)).toBe(false);
  });

  it("supports multiple undo steps", () => {
    const original = JSON.stringify(store.getAll("sam"));
    applyResolution(store, bySlot("employer"), "supersede", NOW);
    applyResolution(store, bySlot("city"), "supersede", NOW);
    expect(store.undoDepth()).toBe(2);
    undo(store);
    undo(store);
    expect(JSON.stringify(store.getAll("sam"))).toBe(original);
  });

  it("throws on an unknown action", () => {
    expect(() => applyResolution(store, bySlot("employer"), "nuke" as never, NOW)).toThrow();
  });

  it("ignores cluster members that no longer exist", () => {
    const fake: Cluster = { ...bySlot("employer"), memberIds: ["missing", bySlot("employer").newestId] };
    expect(() => applyResolution(store, fake, "supersede", NOW)).not.toThrow();
  });
});
