"use client";
import { AnimatePresence, motion } from "framer-motion";
import { GitMerge, Split } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motionTokens, springs } from "@/lib/motion-tokens";
import type { Cluster } from "@/lib/types";
import type { Filter } from "@/hooks/use-inspector";
import { cn } from "@/lib/utils";

export function clusterTitle(c: Cluster) {
  if (c.kind === "conflict" && c.values) return `${c.label}: ${c.values.join(" → ")}`;
  return c.label ?? c.kind;
}

export function ClusterList({
  clusters,
  total,
  filter,
  onFilter,
  selectedId,
  onSelect,
}: {
  clusters: Cluster[];
  total: { all: number; conflict: number; duplicate: number };
  filter: Filter;
  onFilter: (f: Filter) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          Flagged clusters{" "}
          <span data-testid="cluster-count" className="ml-1 font-mono text-muted-foreground">
            {total.all}
          </span>
        </h2>
        <Tabs value={filter} onValueChange={(v) => onFilter(v as Filter)}>
          <TabsList aria-label="Filter clusters">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="conflict">Conflicts {total.conflict}</TabsTrigger>
            <TabsTrigger value="duplicate">Duplicates {total.duplicate}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ul className="flex flex-col gap-2" aria-label="Clusters">
        <AnimatePresence mode="popLayout" initial={false}>
          {clusters.map((c) => {
            const active = c.id === selectedId;
            return (
              <motion.li
                key={c.id}
                layout
                data-testid="cluster-item"
                initial={{ opacity: 0, y: motionTokens.distance.sm }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: motionTokens.distance.xl, transition: { duration: motionTokens.duration.normal } }}
                transition={springs.gentle}
              >
                <button
                  onClick={() => onSelect(c.id)}
                  aria-pressed={active}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "border-primary/60 bg-primary/[0.07]" : "border-border hover:border-foreground/25",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={c.kind}>
                      {c.kind === "conflict" ? <Split className="size-3" /> : <GitMerge className="size-3" />}
                      {c.kind}
                    </Badge>
                    <span className="truncate text-sm font-medium">{clusterTitle(c)}</span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">×{c.memberIds.length}</span>
                  </div>
                  <p className="mt-1.5 truncate font-mono text-[11px] text-muted-foreground">{c.reason}</p>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {clusters.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {total.all === 0 ? "No flagged clusters for this entity." : "Nothing in this filter."}
        </p>
      )}
    </div>
  );
}
