import { describe, it, expect } from "vitest";
import { GET as getMemories } from "@/app/api/memories/route";
import { GET as getHygiene } from "@/app/api/hygiene/route";

const req = (url: string) => new Request(url);

describe("API routes", () => {
  it("GET /api/memories returns memory-layer-shaped results", async () => {
    const res = await getMemories(req("http://x/api/memories?user_id=sam"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results[0]).toHaveProperty("memory");
    expect(body.results[0]).toHaveProperty("hash");
  });

  it("GET /api/hygiene returns clusters and score", async () => {
    const res = await getHygiene(req("http://x/api/hygiene?user_id=sam"));
    const body = await res.json();
    expect(body.clusters).toHaveLength(5);
    expect(body.score).toBeGreaterThanOrEqual(60);
  });

  it("rejects a missing user_id with 400 and unknown user with 404", async () => {
    expect((await getMemories(req("http://x/api/memories"))).status).toBe(400);
    expect((await getHygiene(req("http://x/api/hygiene?user_id=nobody"))).status).toBe(404);
  });
});
