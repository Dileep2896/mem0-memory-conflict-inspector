"use client";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Archive, GitMerge, Search, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { recall } from "@/lib/recall";
import { applyResolution } from "@/lib/resolve";
import type { MemoryStore } from "@/lib/store/memory-store";
import { NOW } from "@/lib/time";
import { motionTokens } from "@/lib/motion-tokens";
import type { Cluster, Memory, Resolution } from "@/lib/types";
import { clusterTitle } from "./cluster-list";
import { RecallDiff } from "./recall-diff";
import { Timeline } from "./timeline";

const ACTION_COPY: Record<Resolution, { label: string; help: string }> = {
  supersede: {
    label: "Supersede",
    help: "Keep the newest. Older members get superseded_by + expiration_date and stay in history().",
  },
  merge: { label: "Merge", help: "update() the newest with merged text; supersede the rest." },
  delete: { label: "Delete", help: "Hard-delete all but the newest. History keeps a DELETE event." },
};

export function ClusterDetail({
  cluster,
  store,
  userId,
  version,
  onResolve,
}: {
  cluster: Cluster;
  store: MemoryStore;
  userId: string;
  version: number;
  onResolve: (cluster: Cluster, action: Resolution) => void;
}) {
  const reduce = useReducedMotion();
  const [probe, setProbe] = useState(cluster.probe);
  const [preview, setPreview] = useState<Resolution>(cluster.suggested);

  const members = useMemo(
    () =>
      cluster.memberIds
        .map((id) => store.get(id))
        .filter((m): m is Memory => Boolean(m))
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [cluster, store, version], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const { before, after } = useMemo(() => {
    const raw = store.getAll(userId);
    const sim = store.clone();
    applyResolution(sim, cluster, preview, NOW);
    return {
      before: recall(raw, probe, { k: 3, latestOnly: false, now: NOW }),
      after: recall(sim.getAll(userId), probe, { k: 3, latestOnly: true, now: NOW }),
    };
  }, [store, userId, cluster, preview, probe, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const staleIds = new Set(cluster.memberIds.filter((id) => id !== cluster.newestId));
  const others = cluster.memberIds.length - 1;

  const actionButton = (action: Exclude<Resolution, "delete">, icon: React.ReactNode) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={preview === action ? "secondary" : "outline"}
          onMouseEnter={() => setPreview(action)}
          onFocus={() => setPreview(action)}
          onClick={() => onResolve(cluster, action)}
        >
          {icon}
          {ACTION_COPY[action].label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{ACTION_COPY[action].help}</TooltipContent>
    </Tooltip>
  );

  return (
    <motion.section
      key={cluster.id}
      aria-label="Cluster detail"
      initial={reduce ? false : { opacity: 0, y: motionTokens.distance.sm }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
      className="flex min-w-0 flex-col gap-5 rounded-xl border border-border bg-card p-5"
    >
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={cluster.kind}>{cluster.kind}</Badge>
          <h3 className="text-lg font-semibold tracking-tight">{clusterTitle(cluster)}</h3>
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{cluster.reason}</p>
      </header>

      <Timeline cluster={cluster} members={members} />

      <div className="flex flex-col gap-3">
        <label htmlFor="probe" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Search className="size-3.5" /> Probe query
          <span className="font-mono font-normal normal-case tracking-normal text-muted-foreground">
            · top-3 recall, previewing <b className="text-foreground">{preview}</b>
          </span>
        </label>
        <Input id="probe" value={probe} onChange={(e) => setProbe(e.target.value)} />
        <RecallDiff before={before} after={after} staleIds={staleIds} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button onClick={() => onResolve(cluster, cluster.suggested)}>
          <Sparkles /> Apply suggested ({cluster.suggested})
        </Button>
        {actionButton("supersede", <Archive />)}
        {actionButton("merge", <GitMerge />)}
        <Dialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="outline" onMouseEnter={() => setPreview("delete")} onFocus={() => setPreview("delete")}>
                  <Trash2 />
                  Delete
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>{ACTION_COPY.delete.help}</TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogTitle>Delete {others} {others === 1 ? "memory" : "memories"}?</DialogTitle>
            <DialogDescription>
              This permanently removes every member except the newest. Supersede keeps them in history instead, which is
              usually what you want. You can still undo within this session.
            </DialogDescription>
            <div className="mt-6 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={() => onResolve(cluster, "delete")}>
                  Delete {others} {others === 1 ? "memory" : "memories"}
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.section>
  );
}
