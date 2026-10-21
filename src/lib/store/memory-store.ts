import type { HistoryEvent, Memory } from "../types";

export type MemoryPatch = Partial<Pick<Memory, "memory" | "metadata" | "expiration_date" | "categories">>;

/**
 * The only seam between the inspector and a memory backend. Shaped like the
 * typical memory-layer API (`get_all`, `update`, `delete`, `history`).
 *
 * To run against a real deployment, implement this with a `MemoryClient`
 * for your hosted memory service or a self-hosted REST server:
 *   getAll(userId)          -> client.getAll({ user_id })
 *   update(id, { memory })  -> client.update(id, { text: memory, metadata })
 *   delete(id)              -> client.delete(id)
 *   history(id)             -> client.history(id)
 * snapshot/restore would become a local undo journal of the inverse calls.
 */
export interface MemoryStore {
  getAll(userId?: string): Memory[];
  get(id: string): Memory | undefined;
  update(id: string, patch: MemoryPatch, now?: Date): Memory;
  delete(id: string, now?: Date): void;
  history(id: string): HistoryEvent[];
  snapshot(): void;
  restore(): boolean;
  undoDepth(): number;
  clone(): MemoryStore;
}
