"use client";
import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { motionTokens } from "@/lib/motion-tokens";

/** Counts up from `from` to `to` once in view. Reduced motion renders the final text. */
export function Counter({
  to,
  from = 0,
  format,
  className,
  delay = 0,
}: {
  to: number;
  from?: number;
  format: (n: number) => string;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(reduce ? to : from);
  const text = useTransform(mv, (v) => format(v));

  useEffect(() => {
    if (reduce) {
      mv.set(to);
      return;
    }
    if (!inView) return;
    const c = animate(mv, to, { duration: motionTokens.duration.story * 1.4, ease: motionTokens.easing.smooth, delay });
    return () => c.stop();
  }, [inView, reduce, to, mv, delay]);

  if (reduce) return <span className={className}>{format(to)}</span>;
  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}
