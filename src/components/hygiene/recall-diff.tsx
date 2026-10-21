"use client";
import { AnimatePresence, motion } from "framer-motion";
import { motionTokens, springs } from "@/lib/motion-tokens";
import type { RecallResult } from "@/lib/types";
import { cn } from "@/lib/utils";

function Column({
  title,
  hint,
  rows,
  other,
  staleIds,
  side,
}: {
  title: string;
  hint: string;
  rows: RecallResult[];
  other: Set<string>;
  staleIds: Set<string>;
  side: "before" | "after";
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border p-3" data-testid={`recall-${side}`}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider">{title}</h4>
        <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>
      </div>
      <ol className="flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((r, i) => {
            const dropped = side === "before" && !other.has(r.memory.id);
            const stale = staleIds.has(r.memory.id);
            const added = side === "after" && !other.has(r.memory.id);
            return (
              <motion.li
                key={r.memory.id + r.memory.memory}
                layout
                initial={{ opacity: 0, y: motionTokens.distance.sm }}
                animate={{ opacity: dropped ? 0.55 : 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={springs.gentle}
                className={cn(
                  "flex items-start gap-2 rounded-md px-2 py-1.5 text-sm",
                  stale && side === "before" && "bg-destructive/[0.08]",
                  side === "after" && !added && "bg-ok/[0.07]",
                  added && "bg-primary/[0.08]",
                )}
              >
                <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
                <span className={cn("min-w-0 flex-1 break-words", dropped && "line-through decoration-destructive/70")}>
                  {r.memory.memory}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{r.score.toFixed(2)}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {rows.length === 0 && <li className="text-xs text-muted-foreground">No memories recalled.</li>}
      </ol>
    </div>
  );
}

export function RecallDiff({
  before,
  after,
  staleIds,
}: {
  before: RecallResult[];
  after: RecallResult[];
  staleIds: Set<string>;
}) {
  const beforeIds = new Set(before.map((r) => r.memory.id));
  const afterIds = new Set(after.map((r) => r.memory.id));
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Column title="Before" hint="raw store · ADD-only" rows={before} other={afterIds} staleIds={staleIds} side="before" />
      <Column title="After" hint="latest_only=true" rows={after} other={beforeIds} staleIds={staleIds} side="after" />
    </div>
  );
}
