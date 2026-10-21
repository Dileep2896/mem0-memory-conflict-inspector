"use client";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { motionTokens } from "@/lib/motion-tokens";

/** "Where does Sam work?" -> two memory cards slide in and collide. */
export function Collision() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const on = reduce || inView;
  const t = (delay: number) => (reduce ? { duration: 0 } : { delay, duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth });

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-20">
      <div className="flex flex-col gap-3">
        <motion.div
          initial={false}
          animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: motionTokens.distance.md }}
          transition={t(0)}
          className="self-end rounded-2xl rounded-br-sm bg-foreground px-4 py-2.5 text-background"
        >
          Where does Sam work?
        </motion.div>
        <motion.div
          initial={false}
          animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: motionTokens.distance.md }}
          transition={t(1.4)}
          className="self-start rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5"
        >
          <span className="text-muted-foreground">agent:</span> Sam works at Acme… or is it Globex?
        </motion.div>
      </div>
      <div className="relative h-44 sm:h-40">
        {[
          { text: "Works at Acme Corp", date: "Mar 2025", from: -80, side: "left-0 top-2" },
          { text: "Now works for Globex", date: "Aug 2026", from: 80, side: "right-0 bottom-2" },
        ].map((c, i) => (
          <motion.div
            key={c.text}
            initial={false}
            animate={
              on
                ? { opacity: 1, x: reduce ? 0 : [c.from, 0, i === 0 ? 6 : -6, i === 0 ? -4 : 4, 0] }
                : { opacity: 0, x: c.from }
            }
            transition={reduce ? { duration: 0 } : { delay: 0.4 + i * 0.15, duration: 1, times: [0, 0.55, 0.7, 0.85, 1] }}
            className={`absolute ${c.side} w-[78%] rounded-lg border-2 border-destructive/70 bg-destructive/[0.08] p-3 shadow-[0_0_40px_-10px_hsl(var(--destructive))] sm:w-[70%]`}
          >
            <div className="font-mono text-[11px] text-muted-foreground">
              memory · {c.date} · slot=employer
            </div>
            <div className="mt-1 text-base font-medium">{c.text}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
