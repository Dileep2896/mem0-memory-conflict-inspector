import { z } from "zod";

/** Mirrors the shape of `Memory.get_all()` results in typical memory layers. */
export const MemorySchema = z.object({
  id: z.string().min(1),
  memory: z.string(),
  hash: z.string(),
  user_id: z.string().min(1),
  metadata: z.object({
    slot: z.string().optional(),
    superseded_by: z.string().optional(),
    source: z.string().optional(),
  }),
  categories: z.array(z.string()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
  expiration_date: z.string().nullable().optional(),
});
export type Memory = z.infer<typeof MemorySchema>;

export const HistoryEventSchema = z.object({
  id: z.string(),
  memory_id: z.string(),
  old_memory: z.string().nullable(),
  new_memory: z.string().nullable(),
  event: z.enum(["ADD", "UPDATE", "DELETE"]),
  created_at: z.string(),
});
export type HistoryEvent = z.infer<typeof HistoryEventSchema>;

export const ResolutionSchema = z.enum(["supersede", "merge", "delete"]);
export type Resolution = z.infer<typeof ResolutionSchema>;

export type ClusterKind = "conflict" | "duplicate";

export interface Cluster {
  id: string;
  kind: ClusterKind;
  userId: string;
  memberIds: string[];
  reason: string;
  suggested: Resolution;
  newestId: string;
  /** A probe question used for the before/after recall preview. */
  probe: string;
  slot?: string;
  /** Short title for the UI, e.g. "employer" or "near-duplicate". */
  label?: string;
  /** Distinct slot values, oldest first (conflicts only). */
  values?: string[];
}

export interface RecallResult {
  memory: Memory;
  similarity: number;
  score: number;
}

export interface UserProfile {
  id: string;
  name: string;
  app: string;
}
