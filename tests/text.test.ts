import { describe, it, expect } from "vitest";
import { normalize, tokenize, tokenCosine, hashText, countTokens } from "@/lib/text";

describe("text", () => {
  it("normalizes case, punctuation and whitespace", () => {
    expect(normalize("  Works at   ACME, Corp! ")).toBe("works at acme corp");
  });

  it("tokenizes without stopwords and with light stemming", () => {
    expect(tokenize("Where does Sam work?")).toEqual(["sam", "work"]);
    expect(tokenize("Works at Acme")).toEqual(["work", "acme"]);
    expect(tokenize("Lives in Lisbon")).toEqual(["live", "lisbon"]);
  });

  it("returns empty tokens for empty or stopword-only text", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("the a of is")).toEqual([]);
  });

  it("cosine is 1 for identical token bags and 0 for disjoint ones", () => {
    expect(tokenCosine("Lives in Berlin", "lives in berlin.")).toBeCloseTo(1);
    expect(tokenCosine("Allergic to nuts", "Has a golden retriever")).toBe(0);
  });

  it("cosine is 0 when either side is empty", () => {
    expect(tokenCosine("", "Lives in Berlin")).toBe(0);
    expect(tokenCosine("the", "")).toBe(0);
  });

  it("near-duplicate phrasings clear the 0.82 threshold", () => {
    expect(
      tokenCosine(
        "Training for the Berlin half marathon on 2026-11-15",
        "Training for the Berlin half marathon, race day 2026-11-15",
      ),
    ).toBeGreaterThanOrEqual(0.82);
  });

  it("hash is stable for text that differs only in case and punctuation", () => {
    expect(hashText("Allergic to nuts.")).toBe(hashText("allergic to NUTS"));
    expect(hashText("Allergic to nuts")).not.toBe(hashText("Allergic to fish"));
    expect(hashText("x")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("counts tokens roughly like an LLM tokenizer (words + punctuation)", () => {
    expect(countTokens("")).toBe(0);
    expect(countTokens("Works at Acme.")).toBe(4);
  });
});
