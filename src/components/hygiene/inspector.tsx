"use client";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useInspector } from "@/hooks/use-inspector";
import { motionTokens } from "@/lib/motion-tokens";
import type { Cluster, Resolution } from "@/lib/types";
import { ClusterDetail } from "./cluster-detail";
import { ClusterList, clusterTitle } from "./cluster-list";
import { EntitySwitcher } from "./entity-switcher";
import { ScoreRing } from "./score-ring";
import { Trend } from "./trend";

const PAST: Record<Resolution, string> = { supersede: "Superseded", merge: "Merged", delete: "Deleted" };

function Stat({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

export function HygieneInspector() {
  const ins = useInspector();
  const reduce = useReducedMotion();
  const user = ins.users.find((u) => u.id === ins.userId)!;
  const total = {
    all: ins.clusters.length,
    conflict: ins.stats.conflicts,
    duplicate: ins.stats.duplicates,
  };

  const onResolve = (cluster: Cluster, action: Resolution) => {
    const n = ins.resolve(cluster, action);
    toast.success(`${PAST[action]} ${n} ${n === 1 ? "memory" : "memories"}`, {
      description: clusterTitle(cluster),
      action: { label: "Undo", onClick: () => ins.undo() },
    });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs text-primary">dashboard / entities / {ins.userId} / hygiene</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Memory hygiene</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Find, explain and fix contradictory memories before {user.name}&apos;s {user.app.toLowerCase()} recalls them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EntitySwitcher users={ins.users} value={ins.userId} onChange={ins.setUserId} />
            <Button
              variant="outline"
              onClick={() => ins.undo() && toast("Reverted last resolution")}
              disabled={!ins.canUndo}
              aria-label="Undo last resolution"
            >
              <Undo2 /> Undo
            </Button>
          </div>
        </header>

        <section aria-label="Health" className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex items-center gap-4">
            <ScoreRing value={ins.stats.score} />
            <div className="hidden flex-col gap-1 sm:flex">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Trend</span>
              <Trend data={ins.scoreTrend} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Stat label="Conflicts" value={ins.stats.conflicts} hint="same slot, different value" />
            <Stat label="Duplicates" value={ins.stats.duplicates} hint="hash or cosine ≥ 0.82" />
            <Stat label="Flagged" value={`${ins.stats.flaggedPct}%`} hint={`${ins.stats.flagged} of ${ins.stats.active} active`} />
            <Stat label="In history" value={ins.stats.superseded + ins.stats.expired} hint="superseded or expired" />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <ClusterList
            clusters={ins.visible}
            total={total}
            filter={ins.filter}
            onFilter={ins.setFilter}
            selectedId={ins.selected?.id ?? null}
            onSelect={ins.select}
          />
          {ins.selected ? (
            <ClusterDetail
              key={`${ins.userId}:${ins.selected.id}`}
              cluster={ins.selected}
              store={ins.store}
              userId={ins.userId}
              version={ins.version}
              onResolve={onResolve}
            />
          ) : (
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: motionTokens.scale.subtle }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid place-items-center rounded-xl border border-ok/30 bg-ok/[0.05] p-10 text-center"
            >
              <div>
                <CheckCircle2 className="mx-auto size-10 text-ok" />
                <p className="mt-3 text-lg font-semibold">{total.all === 0 ? "All clean" : "Pick a cluster"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {total.all === 0
                    ? `No conflicting or duplicate memories for ${user.name}. Superseded facts are still in history().`
                    : "Select a cluster on the left."}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
