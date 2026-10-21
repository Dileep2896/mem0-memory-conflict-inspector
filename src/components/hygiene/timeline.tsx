"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/time";
import { motionTokens } from "@/lib/motion-tokens";
import type { Cluster, Memory } from "@/lib/types";

export function Timeline({ cluster, members }: { cluster: Cluster; members: Memory[] }) {
  const reduce = useReducedMotion();
  return (
    <ol className="flex flex-col" aria-label="Memory timeline, oldest first">
      {members.map((m, i) => {
        const newest = m.id === cluster.newestId;
        return (
          <li key={m.id}>
            <motion.div
              initial={reduce ? false : { opacity: 0, x: -motionTokens.distance.sm }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * motionTokens.stagger, duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
              className={
                "rounded-md border px-3 py-2.5 " +
                (newest ? "border-ok/40 bg-ok/[0.06]" : "border-destructive/30 bg-destructive/[0.05]")
              }
            >
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <time dateTime={m.created_at}>{formatDate(m.created_at)}</time>
                <span>·</span>
                <span>{m.id}</span>
                <Badge variant={newest ? "ok" : cluster.kind} className="ml-auto">
                  {newest ? "newest · keeps" : cluster.kind === "conflict" ? "stale" : "duplicate"}
                </Badge>
              </div>
              <p className="mt-1 text-sm">{m.memory}</p>
            </motion.div>
            {i < members.length - 1 && (
              <div className="flex justify-center py-1 text-muted-foreground" aria-hidden>
                <ArrowDown className="size-3.5" />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
