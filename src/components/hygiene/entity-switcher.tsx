"use client";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";

export function EntitySwitcher({
  users,
  value,
  onChange,
}: {
  users: UserProfile[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Entity" className="flex flex-wrap gap-1 rounded-lg border border-border p-1">
      {users.map((u) => {
        const active = u.id === value;
        return (
          <button
            key={u.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(u.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="block font-medium">{u.name}</span>
            <span className="block font-mono text-[10px] opacity-70">user_id={u.id}</span>
          </button>
        );
      })}
    </div>
  );
}
