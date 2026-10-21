import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { measureImpact } from "@/lib/health";
import { seedMemories, PROBES } from "@/data/seed";

const impact = measureImpact(seedMemories(), "sam", PROBES.sam);

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("framer-motion");
});

describe("/story", () => {
  it("renders all six sections", async () => {
    const { StoryView } = await import("@/components/story/story-view");
    render(<StoryView impact={impact} />);
    for (const name of [/memory/i, /pain/i, /before/i, /decision/i, /three steps/i, /impact/i]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /open the inspector/i })).toHaveAttribute("href", "/hygiene");
  });

  it("renders final states immediately under prefers-reduced-motion", async () => {
    vi.doMock("framer-motion", async (orig) => ({
      ...(await orig<typeof import("framer-motion")>()),
      useReducedMotion: () => true,
    }));
    const { StoryView } = await import("@/components/story/story-view");
    render(<StoryView impact={impact} />);
    expect(screen.getByText("10,134")).toBeInTheDocument();
    expect(screen.getByText(`−${impact.tokenReductionPct}%`)).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: /health score/i })).toHaveAttribute("aria-valuenow", "100");
  });
});
