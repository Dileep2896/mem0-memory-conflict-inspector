import { describe, it, expect } from "vitest";
import { extractSlot } from "@/lib/slots";

describe("extractSlot", () => {
  const cases: [string, { key: string; value: string } | null][] = [
    ["Works at Acme Corp as a fitness coach", { key: "employer", value: "acme" }],
    ["Now works for Globex as head coach", { key: "employer", value: "globex" }],
    ["Lives in Lisbon", { key: "city", value: "lisbon" }],
    ["Lives in Berlin now, moved for the new job", { key: "city", value: "berlin" }],
    ["Is vegetarian and does not eat meat or fish", { key: "diet", value: "vegetarian" }],
    ["Eats fish again, pescatarian since July 2026", { key: "diet", value: "pescatarian" }],
    ["Favorite brand is On Running now", { key: "favorite_brand", value: "on running" }],
    ["Favourite recovery meal is a salmon bowl", { key: "favorite_recovery_meal", value: "a salmon bowl" }],
    ["Recently got married", { key: "relationship", value: "married" }],
    ["Works as a senior product designer", { key: "role", value: "senior product designer" }],
    ["Timezone is America/New_York", { key: "timezone", value: "america/new_york" }],
    ["Allergic to nuts", { key: "allergy:nut", value: "yes" }],
    ["Loves swimming in the morning", { key: "preference:swimm", value: "positive" }],
    ["Hates swimming since the shoulder strain", { key: "preference:swimm", value: "negative" }],
    ["On the Free plan", { key: "plan", value: "free" }],
    ["Upgraded to the Pro plan in September 2026", { key: "plan", value: "pro" }],
    ["Preferred language is Spanish", { key: "language", value: "spanish" }],
    ["Shoe size is 9.5 in running shoes", { key: "shoe_size", value: "9.5" }],
    ["Has a golden retriever named Miso", null],
    ["", null],
  ];

  it.each(cases)("%s", (text, expected) => {
    const slot = extractSlot(text);
    if (expected === null) expect(slot).toBeNull();
    else expect(slot).toMatchObject(expected);
  });

  it("different allergies get different slot keys so they never conflict", () => {
    expect(extractSlot("Allergic to nuts")?.key).not.toBe(extractSlot("Allergic to shellfish")?.key);
  });
});

describe("slot labels and probes", () => {
  it("gives preference and allergy slots a readable label", () => {
    expect(extractSlot("Loves swimming in the morning")?.label).toBe("preference: swimming");
    expect(extractSlot("Allergic to nuts")?.label).toBe("allergy: nuts");
    expect(extractSlot("Lives in Lisbon")?.label).toBe("city");
  });
});
