import type { HistoryEvent, Memory } from "../types";
import { hashText } from "../text";
import { NOW } from "../time";
import type { MemoryPatch, MemoryStore } from "./memory-store";

interface State {
  memories: Record<string, Memory>;
  history: HistoryEvent[];
}

const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export class InMemoryMemoryStore implements MemoryStore {
  private state: State;
  private undoStack: State[] = [];
  private seq = 0;

  constructor(memories: Memory[], history?: HistoryEvent[]) {
    const map: Record<string, Memory> = {};
    for (const m of memories) map[m.id] = copy(m);
    this.state = {
      memories: map,
      history:
        history ??
        memories.map((m, i) => ({
          id: `h_seed_${i}`,
          memory_id: m.id,
          old_memory: null,
          new_memory: m.memory,
          event: "ADD" as const,
          created_at: m.created_at,
        })),
    };
  }

  getAll(userId?: string): Memory[] {
    return Object.values(this.state.memories)
      .filter((m) => !userId || m.user_id === userId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
      .map(copy);
  }

  get(id: string): Memory | undefined {
    const m = this.state.memories[id];
    return m ? copy(m) : undefined;
  }

  update(id: string, patch: MemoryPatch, now: Date = NOW): Memory {
    const cur = this.state.memories[id];
    if (!cur) throw new Error(`Memory ${id} not found`);
    const next: Memory = {
      ...cur,
      ...patch,
      metadata: { ...cur.metadata, ...(patch.metadata ?? {}) },
      updated_at: now.toISOString(),
    };
    if (patch.memory !== undefined) next.hash = hashText(patch.memory);
    this.state.memories[id] = next;
    this.record(id, cur.memory, next.memory, "UPDATE", now);
    return copy(next);
  }

  delete(id: string, now: Date = NOW): void {
    const cur = this.state.memories[id];
    if (!cur) return;
    delete this.state.memories[id];
    this.record(id, cur.memory, null, "DELETE", now);
  }

  history(id: string): HistoryEvent[] {
    return this.state.history.filter((h) => h.memory_id === id).map(copy);
  }

  snapshot(): void {
    this.undoStack.push(copy(this.state));
  }

  restore(): boolean {
    const prev = this.undoStack.pop();
    if (!prev) return false;
    this.state = prev;
    return true;
  }

  undoDepth(): number {
    return this.undoStack.length;
  }

  clone(): InMemoryMemoryStore {
    const c = new InMemoryMemoryStore([], copy(this.state.history));
    c.state = copy(this.state);
    return c;
  }

  private record(memoryId: string, oldM: string | null, newM: string | null, event: HistoryEvent["event"], now: Date) {
    this.seq += 1;
    this.state.history.push({
      id: `h_${now.getTime()}_${this.seq}`,
      memory_id: memoryId,
      old_memory: oldM,
      new_memory: newM,
      event,
      created_at: now.toISOString(),
    });
  }
}
