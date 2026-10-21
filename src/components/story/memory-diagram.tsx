"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { motionTokens, springs } from "@/lib/motion-tokens";

type Role = "clean" | "stale" | "newest" | "dup" | "dupKeep";
interface Dot {
  id: string;
  role: Role;
  group?: number;
  cloud: [number, number];
}

// 3 conflict pairs, 1 duplicate trio, 6 clean facts.
const DOTS: Dot[] = [
  { id: "a0", role: "stale", group: 0, cloud: [90, 70] },
  { id: "a1", role: "newest", group: 0, cloud: [210, 220] },
  { id: "b0", role: "stale", group: 1, cloud: [330, 60] },
  { id: "b1", role: "newest", group: 1, cloud: [150, 150] },
  { id: "c0", role: "stale", group: 2, cloud: [470, 210] },
  { id: "c1", role: "newest", group: 2, cloud: [380, 140] },
  { id: "d0", role: "dup", group: 3, cloud: [260, 110] },
  { id: "d1", role: "dup", group: 3, cloud: [520, 90] },
  { id: "d2", role: "dupKeep", group: 3, cloud: [300, 250] },
  { id: "e0", role: "clean", cloud: [60, 200] },
  { id: "e1", role: "clean", cloud: [430, 270] },
  { id: "e2", role: "clean", cloud: [540, 250] },
  { id: "e3", role: "clean", cloud: [120, 270] },
  { id: "e4", role: "clean", cloud: [560, 170] },
  { id: "e5", role: "clean", cloud: [40, 110] },
];

const GROUP_X = [90, 230, 370, 510];

function position(d: Dot, phase: number): [number, number] {
  if (phase === 0) return d.cloud;
  if (phase === 1) {
    if (d.group === undefined) {
      const i = Number(d.id.slice(1));
      return [60 + i * 96, 280];
    }
    const members = DOTS.filter((x) => x.group === d.group);
    const k = members.indexOf(d);
    return [GROUP_X[d.group] + (k - (members.length - 1) / 2) * 30, 120];
  }
  // phase 2: active facts settle into a clean column on the left, history on the right
  const active = DOTS.filter((x) => x.role === "clean" || x.role === "newest" || x.role === "dupKeep");
  const history = DOTS.filter((x) => x.role === "stale" || x.role === "dup");
  const ai = active.indexOf(d);
  if (ai >= 0) return [110 + (ai % 3) * 46, 50 + Math.floor(ai / 3) * 46];
  const hi = history.indexOf(d);
  return [420 + (hi % 3) * 46, 70 + Math.floor(hi / 3) * 46];
}

function fill(d: Dot, phase: number) {
  if (phase === 2) return d.role === "stale" || d.role === "dup" ? "transparent" : "hsl(var(--ok))";
  if (d.role === "stale" || d.role === "newest") return "hsl(var(--destructive))";
  if (d.role === "dup" || d.role === "dupKeep") return "hsl(var(--warn))";
  return "hsl(var(--foreground) / 0.55)";
}

export function MemoryDiagram() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-25% 0px" });
  const [phase, setPhase] = useState(reduce ? 2 : 0);

  useEffect(() => {
    if (reduce) {
      setPhase(2);
      return;
    }
    if (!inView) return;
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView, reduce]);

  const caption = ["ADD-only store: contradictions and duplicates mixed in", "Inspector groups them into clusters", "Resolved: clean active set, stale facts kept in history()"][phase];

  return (
    <div ref={ref} className="rounded-2xl border border-border bg-card/60 p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-destructive" /> conflict</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-warn" /> duplicate</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-ok" /> active</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full border border-muted-foreground" /> superseded (history)</span>
      </div>
      <svg viewBox="0 0 600 320" className="h-auto w-full" role="img" aria-label="Memory store before and after cleanup">
        {phase === 2 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: motionTokens.duration.normal }}>
            <text x={110} y={22} className="fill-ok font-mono text-[12px]">active · latest_only</text>
            <text x={420} y={42} className="fill-muted-foreground font-mono text-[12px]">history()</text>
            <line x1={330} y1={30} x2={330} y2={290} stroke="hsl(var(--border))" strokeDasharray="4 6" />
          </motion.g>
        )}
        {[0, 1, 2].map((g) => {
          const pair = DOTS.filter((d) => d.group === g);
          const [p, q] = pair.map((d) => position(d, phase));
          return (
            <motion.path
              key={g}
              d={`M ${p[0]} ${p[1]} L ${q[0]} ${q[1]}`}
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              fill="none"
              initial={false}
              animate={{ pathLength: phase === 1 ? 1 : 0, opacity: phase === 1 ? 0.8 : 0, d: `M ${p[0]} ${p[1]} L ${q[0]} ${q[1]}` }}
              transition={reduce ? { duration: 0 } : { duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth }}
            />
          );
        })}
        {DOTS.map((d, i) => {
          const [cx, cy] = position(d, phase);
          const ghost = phase === 2 && (d.role === "stale" || d.role === "dup");
          const pulsing = phase === 0 && !reduce && d.role !== "clean";
          return (
            <motion.circle
              key={d.id}
              initial={false}
              animate={{ cx, cy, r: pulsing ? [11, 14, 11] : 12, fill: fill(d, phase) }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      cx: { ...springs.gentle, delay: i * 0.03 },
                      cy: { ...springs.gentle, delay: i * 0.03 },
                      r: pulsing ? { duration: 1.2, repeat: Infinity } : { duration: motionTokens.duration.normal },
                      fill: { duration: motionTokens.duration.normal },
                    }
              }
              stroke={ghost ? "hsl(var(--muted-foreground))" : "transparent"}
              strokeWidth={2}
              strokeDasharray={ghost ? "3 3" : undefined}
            />
          );
        })}
      </svg>
      <p className="mt-2 text-center font-mono text-xs text-muted-foreground" aria-live="polite">
        {caption}
      </p>
    </div>
  );
}
