import { describe, it, expect } from "vitest";
import { detectClusters } from "@/lib/detect";
import { seedMemories } from "@/data/seed";
import { hashText } from "@/lib/text";
import { NOW } from "@/lib/time";
import { mem } from "./fixtures";

const sam = () => seedMemories().filter((m) => m.user_id === "sam");

describe("detectClusters on the seed", () => {
  it("finds exactly 4 conflicts and 1 duplicate cluster for sam", () => {
    const clusters = detectClusters(sam(), { now: NOW });
    expect(clusters.filter((c) => c.kind === "conflict")).toHaveLength(4);
    expect(clusters.filter((c) => c.kind === "duplicate")).toHaveLength(1);
  });

  it("flags employer Acme -> Globex as a conflict, newest Globex, suggest supersede", () => {
    const c = detectClusters(sam(), { now: NOW }).find((x) => x.slot === "employer");
    expect(c).toBeDefined();
    expect(c!.kind).toBe("conflict");
    expect(c!.suggested).toBe("supersede");
    expect(c!.memberIds).toHaveLength(2);
    expect(c!.reason).toContain("same slot `employer`, different value");
    const all = sam();
    expect(all.find((m) => m.id === c!.newestId)!.memory).toMatch(/Globex/);
  });

  it("groups the three marathon phrasings into one duplicate cluster with merge suggested", () => {
    const dup = detectClusters(sam(), { now: NOW }).find((x) => x.kind === "duplicate");
    expect(dup!.memberIds).toHaveLength(3);
    expect(dup!.suggested).toBe("merge");
  });

  it("never flags the nut allergy (an important old fact)", () => {
    const allergy = sam().find((m) => /allergic/i.test(m.memory))!;
    const flagged = detectClusters(sam(), { now: NOW }).flatMap((c) => c.memberIds);
    expect(flagged).not.toContain(allergy.id);
  });

  it("ignores expired memories (Dry January)", () => {
    const dry = sam().find((m) => /dry january/i.test(m.memory))!;
    const flagged = detectClusters(sam(), { now: NOW }).flatMap((c) => c.memberIds);
    expect(flagged).not.toContain(dry.id);
  });

  it("finds clusters for priya and lee too", () => {
    const all = seedMemories();
    const priya = detectClusters(all.filter((m) => m.user_id === "priya"), { now: NOW });
    const lee = detectClusters(all.filter((m) => m.user_id === "lee"), { now: NOW });
    expect(priya.length).toBe(4);
    expect(lee.length).toBe(3);
  });

  it("every cluster has the required fields", () => {
    for (const c of detectClusters(seedMemories(), { now: NOW })) {
      expect(c.id).toBeTruthy();
      expect(["conflict", "duplicate"]).toContain(c.kind);
      expect(c.memberIds.length).toBeGreaterThan(1);
      expect(c.reason.length).toBeGreaterThan(5);
      expect(c.memberIds).toContain(c.newestId);
      expect(c.probe.length).toBeGreaterThan(3);
    }
  });
});

describe("detectClusters adversarial cases", () => {
  it("flags loves vs hates of the same thing as a conflict via preference polarity", () => {
    const c = detectClusters([
      mem({ memory: "Loves running", created_at: "2025-01-01T00:00:00Z" }),
      mem({ memory: "Hates running", created_at: "2026-01-01T00:00:00Z" }),
    ]);
    expect(c).toHaveLength(1);
    expect(c[0].kind).toBe("conflict");
  });

  it("does not group identical text across different users", () => {
    const c = detectClusters([
      mem({ memory: "Works at Acme", user_id: "a" }),
      mem({ memory: "Works at Globex", user_id: "b" }),
      mem({ memory: "Lives in Paris", user_id: "a" }),
      mem({ memory: "Lives in Paris", user_id: "b" }),
    ]);
    expect(c).toHaveLength(0);
  });

  it("always groups exact-hash duplicates", () => {
    const text = "Ticket 4821 webhook retries failing on staging";
    const c = detectClusters([
      mem({ memory: text, hash: hashText(text) }),
      mem({ memory: text.toUpperCase(), hash: hashText(text) }),
    ]);
    expect(c).toHaveLength(1);
    expect(c[0].reason).toMatch(/exact hash/);
  });

  it("breaks created_at ties by id (highest id wins)", () => {
    const at = "2026-02-02T00:00:00Z";
    const c = detectClusters([
      mem({ id: "b", memory: "Works at Acme", created_at: at }),
      mem({ id: "a", memory: "Works at Globex", created_at: at }),
    ]);
    expect(c[0].newestId).toBe("b");
  });

  it("skips superseded memories", () => {
    const c = detectClusters([
      mem({ memory: "Works at Acme", metadata: { superseded_by: "x" } }),
      mem({ id: "x", memory: "Works at Globex" }),
    ]);
    expect(c).toHaveLength(0);
  });

  it("returns nothing for an empty store", () => {
    expect(detectClusters([])).toEqual([]);
  });
});

describe("cluster copy", () => {
  it("uses readable labels and a natural probe for preference conflicts", () => {
    const c = detectClusters(sam(), { now: NOW }).find((x) => x.slot?.startsWith("preference"))!;
    expect(c.reason).toContain("`preference: swimming`");
    expect(c.probe).toBe("Does Sam like swimming?");
  });
});
