import type { Metadata } from "next";
import { StoryView } from "@/components/story/story-view";
import { PROBES, seedMemories } from "@/data/seed";
import { measureImpact } from "@/lib/health";

export const metadata: Metadata = { title: "Story · Memory Conflict Inspector" };

export default function StoryPage() {
  // Real numbers from the seeded store, not hard-coded claims.
  const impact = measureImpact(seedMemories(), "sam", PROBES.sam);
  return <StoryView impact={impact} />;
}
