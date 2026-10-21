import type { Memory } from "@/lib/types";

let n = 0;
export function mem(partial: Partial<Memory> & { memory: string }): Memory {
  n += 1;
  const created = partial.created_at ?? `2026-01-${String((n % 27) + 1).padStart(2, "0")}T10:00:00Z`;
  return {
    id: partial.id ?? `t_${String(n).padStart(3, "0")}`,
    memory: partial.memory,
    hash: partial.hash ?? "",
    user_id: partial.user_id ?? "u1",
    metadata: partial.metadata ?? {},
    categories: partial.categories ?? [],
    created_at: created,
    updated_at: partial.updated_at ?? created,
    expiration_date: partial.expiration_date ?? null,
  };
}
