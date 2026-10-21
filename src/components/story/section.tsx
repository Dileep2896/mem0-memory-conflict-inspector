"use client";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { motionTokens } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export const revealContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: motionTokens.stagger, delayChildren: 0.05 } },
};
export const revealItem: Variants = {
  hidden: { opacity: 0, y: motionTokens.distance.lg },
  visible: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth } },
};

export function StorySection({
  label,
  eyebrow,
  children,
  className,
}: {
  label: string;
  eyebrow: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      aria-label={label}
      variants={revealContainer}
      initial={reduce ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-15% 0px" }}
      className={cn("relative mx-auto flex min-h-[88vh] w-full max-w-6xl flex-col justify-center px-4 py-20 sm:px-8", className)}
    >
      <motion.p variants={revealItem} className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-primary">
        {eyebrow}
      </motion.p>
      {children}
    </motion.section>
  );
}
