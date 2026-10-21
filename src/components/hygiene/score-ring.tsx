"use client";
import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { motionTokens } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
  duration?: number;
}

export function scoreTone(v: number) {
  return v >= 90 ? "text-ok" : v >= 70 ? "text-warn" : "text-destructive";
}

export function ScoreRing({ value, size = 132, stroke = 10, label = "Health", className, duration }: Props) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = useTransform(mv, (v) => circ * (1 - v / 100));
  const text = useTransform(mv, (v) => String(Math.round(v)));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: duration ?? motionTokens.duration.slow,
      ease: motionTokens.easing.smooth,
    });
    return () => controls.stop();
  }, [value, reduce, mv, duration]);

  return (
    <div
      role="meter"
      aria-label={`Health score ${value} out of 100`}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative inline-grid place-items-center", scoreTone(value), className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center" aria-hidden>
        <div>
          <motion.div className="font-mono text-[2.1em] font-semibold leading-none tabular-nums text-foreground">
            {text}
          </motion.div>
          <div className="mt-1 text-[0.7em] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
