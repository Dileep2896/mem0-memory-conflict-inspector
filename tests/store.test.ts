import { describe, it, expect } from "vitest";
import { InMemoryMemoryStore } from "@/lib/store/in-memory-store";
import { seedMemories, USERS } from "@/data/seed";
import { MemorySchema } from "@/lib/types";

describe("seed + store", () => {
  it("every seed memory passes the zod schema and has a hash", () => {
    for (const m of seedMemories()) {
      expect(MemorySchema.safeParse(m).success).toBe(true);
      expect(m.hash).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  it("has 3 users with ~20+ memories each", () => {
    expect(USERS.map((u) => u.id)).toEqual(["sam", "priya", "lee"]);
    for (const u of USERS) {
      expect(seedMemories().filter((m) => m.user_id === u.id).length).toBeGreaterThanOrEqual(18);
    }
  });

  it("getAll returns copies sorted by created_at", () => {
    const s = new InMemoryMemoryStore(seedMemories());
    const list = s.getAll("sam");
    list[0].memory = "mutated";
    expect(s.getAll("sam")[0].memory).not.toBe("mutated");
    const dates = s.getAll("sam").map((m) => m.created_at);
    expect([...dates].sort()).toEqual(dates);
  });

  it("records an ADD history event for each seeded memory", () => {
    const s = new InMemoryMemoryStore(seedMemories());
    const first = s.getAll("sam")[0];
    expect(s.history(first.id)[0].event).toBe("ADD");
  });

  it("clone is independent of the original", () => {
    const s = new InMemoryMemoryStore(seedMemories());
    const c = s.clone();
    const id = s.getAll("sam")[0].id;
    c.delete(id);
    expect(s.get(id)).toBeDefined();
    expect(c.get(id)).toBeUndefined();
  });

  it("update on a missing id throws", () => {
    const s = new InMemoryMemoryStore([]);
    expect(() => s.update("nope", { memory: "x" })).toThrow();
  });
});
