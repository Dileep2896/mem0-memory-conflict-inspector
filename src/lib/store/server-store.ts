import { seedMemories } from "@/data/seed";
import { InMemoryMemoryStore } from "./in-memory-store";

let store: InMemoryMemoryStore | null = null;

/** Process-wide demo store for the API routes (seeded, no persistence). */
export function getServerStore(): InMemoryMemoryStore {
  store ??= new InMemoryMemoryStore(seedMemories());
  return store;
}
