"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView, useReducedMotion, useScroll } from "framer-motion";
import { ArrowRight, Check, Eye, ScanSearch, ShieldCheck, X } from "lucide-react";
import { ScoreRing } from "@/components/hygiene/score-ring";
import type { Impact } from "@/lib/health";
import { motionTokens } from "@/lib/motion-tokens";
import { Collision } from "./collision";
import { Counter } from "./counter";
import { MemoryDiagram } from "./memory-diagram";
import { StorySection, revealItem } from "./section";

const H2 = "text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl";

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

function Step({ n, title, body, icon, loop }: { n: number; title: string; body: string; icon: React.ReactNode; loop: React.ReactNode }) {
  return (
    <motion.div variants={revealItem} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary">{icon}</span>
        <span className="font-mono text-xs text-muted-foreground">step {n}</span>
      </div>
      <div className="h-24 overflow-hidden rounded-lg border border-border bg-background p-3">{loop}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </motion.div>
  );
}

function useLoop(reduce: boolean | null) {
  return (keys: Record<string, (number | string)[]>, delay = 0) =>
    reduce
      ? { animate: Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, v[v.length - 1]])), transition: { duration: 0 } }
      : { animate: keys, transition: { duration: 2.4, repeat: Infinity, repeatDelay: 0.6, delay, ease: motionTokens.easing.smooth } };
}

function ImpactBlock({ impact }: { impact: Impact }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const done = Boolean(reduce || inView);
  const pct = (n: number) => `${(100 * n) / impact.probes}%`;

  return (
    <div ref={ref} className="grid gap-6 md:grid-cols-3">
      <motion.div variants={revealItem} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
        <ScoreRing value={done ? impact.scoreAfter : impact.scoreBefore} size={168} stroke={12} duration={motionTokens.duration.story * 1.6} />
        <p className="text-sm text-muted-foreground">
          Health score for <b className="text-foreground">sam</b>: {impact.scoreBefore} → {impact.scoreAfter}
        </p>
      </motion.div>
      <motion.div variants={revealItem} className="flex flex-col justify-center gap-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-medium">Probe questions with a stale fact in top-3 recall</p>
        {[
          { label: "Before", n: impact.wrongBefore, tone: "bg-destructive" },
          { label: "After", n: done ? impact.wrongAfter : impact.wrongBefore, tone: "bg-ok" },
        ].map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between font-mono text-xs text-muted-foreground">
              <span>{b.label}</span>
              <span className="tabular-nums">{b.n}/{impact.probes}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full rounded-full ${b.tone}`}
                initial={false}
                animate={{ width: pct(b.n) }}
                transition={reduce ? { duration: 0 } : { duration: motionTokens.duration.story, ease: motionTokens.easing.smooth, delay: 0.4 }}
              />
            </div>
          </div>
        ))}
      </motion.div>
      <motion.div variants={revealItem} className="flex flex-col justify-center gap-2 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-medium">Tokens per recall</p>
        <Counter
          to={impact.tokenReductionPct}
          format={(n) => `−${Math.round(n)}%`}
          className="font-mono text-6xl font-semibold tabular-nums text-ok"
          delay={0.3}
        />
        <p className="font-mono text-xs text-muted-foreground">
          {impact.tokensBefore} → {impact.tokensAfter} tokens across {impact.probes} probes, measured live from the seed
        </p>
      </motion.div>
    </div>
  );
}

export function StoryView({ impact }: { impact: Impact }) {
  const reduce = useReducedMotion();
  const loop = useLoop(reduce);

  return (
    <div className="relative overflow-x-clip">
      <ScrollProgress />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.22),transparent)]"
      />

      {/* 1. Domain */}
      <StorySection label="The domain: long-term memory for AI agents" eyebrow="Long-term memory layers for AI agents">
        <motion.h1 variants={revealItem} className="max-w-4xl text-5xl font-semibold leading-[1] tracking-tight sm:text-7xl">
          AI agents now have <span className="text-primary">memory.</span> Nobody checks it.
        </motion.h1>
        <motion.p variants={revealItem} className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Memory layers turn conversations into compact facts with add() and bring the relevant ones back with search()
          before every LLM call. They are good at remembering. They are bad at forgetting what is no longer true.
        </motion.p>
        <motion.div variants={revealItem} className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { to: 10134, f: (n: number) => Math.round(n).toLocaleString("en-US"), label: "memories in one store after 32 days" },
            { to: 97.8, f: (n: number) => `${n.toFixed(1)}%`, label: "of them judged junk on audit" },
            { to: 2943, f: (n: number) => Math.round(n).toLocaleString("en-US"), label: "near-duplicates, found only by an ad-hoc script" },
          ].map((s, i) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card/70 p-5">
              <Counter to={s.to} format={s.f} delay={i * 0.12} className="font-mono text-5xl font-semibold tabular-nums" />
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>
        <motion.p variants={revealItem} className="mt-4 font-mono text-[11px] text-muted-foreground">
          Source: a public production audit shared by a user of a popular open-source memory layer
        </motion.p>
      </StorySection>

      {/* 2. Pain */}
      <StorySection label="The pain: stale and contradictory memories" eyebrow="The pain point">
        <motion.h2 variants={revealItem} className={H2}>
          ADD-only memory keeps <span className="text-destructive">both</span> answers.
        </motion.h2>
        <motion.p variants={revealItem} className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Many memory pipelines only add, and dedup is an exact hash. When Sam changes jobs, the old fact stays, and recall
          can rank it first. The agent sounds just as confident either way, so the failure is silent.
        </motion.p>
        <motion.div variants={revealItem} className="mt-10">
          <Collision />
        </motion.div>
        <motion.p variants={revealItem} className="mt-10 max-w-2xl text-xl">
          Users in this space build their own cron scripts to find duplicates. Requests for built-in conflict resolution
          have been <b className="text-destructive">closed as not planned.</b>
        </motion.p>
        <motion.p variants={revealItem} className="mt-2 font-mono text-[11px] text-muted-foreground">
          From public issue threads and audits shared by users of popular memory layers
        </motion.p>
      </StorySection>

      {/* 3. Before -> after */}
      <StorySection label="Before and after cleanup" eyebrow="What changes">
        <motion.h2 variants={revealItem} className={`${H2} mb-10`}>
          From a tangle to a clean recall set.
        </motion.h2>
        <motion.div variants={revealItem}>
          <MemoryDiagram />
        </motion.div>
      </StorySection>

      {/* 4. Decision */}
      <StorySection label="The decision" eyebrow="Why this feature">
        <motion.h2 variants={revealItem} className={`${H2} mb-10`}>
          Two options. One was honest to build.
        </motion.h2>
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div variants={revealItem} className="rounded-2xl border border-border p-6 opacity-50">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <X className="size-4" /> option A
            </div>
            <h3 className="mt-3 text-2xl font-semibold">Retrieval explainer</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Explaining why a memory ranked first needs a vendor&apos;s private ranking signals. A mock would be guesswork.
            </p>
          </motion.div>
          <motion.div
            variants={revealItem}
            className="rounded-2xl border-2 border-primary bg-primary/[0.07] p-6 shadow-[0_0_60px_-20px_hsl(var(--primary))]"
          >
            <div className="flex items-center gap-2 font-mono text-xs text-primary">
              <Check className="size-4" /> option B · chosen
            </div>
            <h3 className="mt-3 text-2xl font-semibold">Memory Conflict Inspector</h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              {[
                "The most-discussed open pain: one public thread alone has 54 comments of community cron scripts",
                "Builds on the latest_only, superseded and history() model memory layers are converging on",
                "Safe by design: supersede keeps old facts in history, nothing silently deleted",
              ].map((r) => (
                <motion.li key={r} variants={revealItem} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {r}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </StorySection>

      {/* 5. Feature */}
      <StorySection label="The feature in three steps" eyebrow="The feature">
        <motion.h2 variants={revealItem} className={`${H2} mb-10`}>
          Detect. Preview. Resolve.
        </motion.h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Step
            n={1}
            title="Detect"
            body="Slot rules catch same-key, different-value conflicts. Token cosine ≥ 0.82 or an exact hash catches duplicates."
            icon={<ScanSearch className="size-4" />}
            loop={
              <div className="flex flex-col gap-2">
                {["employer = acme", "employer = globex"].map((t, i) => (
                  <motion.div
                    key={t}
                    className="rounded border px-2 py-1 font-mono text-[11px]"
                    {...loop({ borderColor: ["hsl(var(--border))", "hsl(var(--destructive))", "hsl(var(--destructive))"] }, i * 0.2)}
                  >
                    {t}
                  </motion.div>
                ))}
              </div>
            }
          />
          <Step
            n={2}
            title="Preview recall"
            body="Run a probe like “Where does Sam work?” against the store before and after the fix, side by side."
            icon={<Eye className="size-4" />}
            loop={
              <div className="flex flex-col gap-2 font-mono text-[11px]">
                <motion.div className="rounded bg-ok/10 px-2 py-1">#1 Now works for Globex</motion.div>
                <motion.div className="rounded bg-destructive/10 px-2 py-1 line-through" {...loop({ opacity: [1, 1, 0.25] })}>
                  #2 Works at Acme Corp
                </motion.div>
              </div>
            }
          />
          <Step
            n={3}
            title="Resolve"
            body="Supersede, merge or delete in one click, with undo. Old facts get superseded_by and an expiration_date."
            icon={<ShieldCheck className="size-4" />}
            loop={
              <div className="grid h-full place-items-center">
                <motion.div className="font-mono text-3xl font-semibold text-ok" {...loop({ scale: [0.85, 1.08, 1], opacity: [0.3, 1, 1] })}>
                  67 → 100
                </motion.div>
              </div>
            }
          />
        </div>
      </StorySection>

      {/* 6. Impact */}
      <StorySection label="Expected impact" eyebrow="Impact">
        <motion.h2 variants={revealItem} className={`${H2} mb-10`}>
          Cleaner recall, fewer tokens, no silent deletes.
        </motion.h2>
        <ImpactBlock impact={impact} />
        <motion.div variants={revealItem} className="mt-12">
          <Link
            href="/hygiene"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:scale-[1.02]"
          >
            Open the Inspector <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            Demo numbers measured on seeded data, not a claim about any production system.
          </p>
        </motion.div>
      </StorySection>
    </div>
  );
}
