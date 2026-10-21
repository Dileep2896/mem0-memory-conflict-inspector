import type { Memory, UserProfile } from "@/lib/types";
import { MemorySchema } from "@/lib/types";
import { hashText } from "@/lib/text";

/**
 * Seed scenarios mirror failure modes that users of long-term memory layers
 * report publicly: a stale employer that outranks the new one, a changed
 * favourite (Ronaldo -> Messi), near-duplicate clusters, junk accumulation,
 * and time-bound facts (expiring plans, a healed injury).
 */

export const USERS: UserProfile[] = [
  { id: "sam", name: "Sam", app: "Fitness coach agent" },
  { id: "priya", name: "Priya", app: "Support copilot" },
  { id: "lee", name: "Lee", app: "Shopping assistant" },
];

type Row = [id: string, text: string, created: string, extra?: Partial<Memory>];

const sam: Row[] = [
  ["sam_01", "Works at Acme Corp as a fitness coach", "2025-03-04T09:12:00Z"],
  ["sam_02", "Lives in Lisbon", "2025-03-04T09:12:30Z"],
  ["sam_03", "Allergic to nuts", "2025-03-04T09:13:00Z"],
  ["sam_04", "Is vegetarian and does not eat meat or fish", "2025-04-10T18:40:00Z"],
  ["sam_05", "Loves swimming in the morning", "2025-05-01T07:05:00Z"],
  ["sam_06", "Prefers morning workouts before 7am", "2025-05-01T07:06:00Z"],
  ["sam_07", "Has a golden retriever dog named Miso", "2025-05-19T20:00:00Z"],
  ["sam_08", "Uses a Garmin Forerunner watch", "2025-06-02T12:00:00Z"],
  ["sam_09", "Had a knee injury in 2025, fully healed by January 2026", "2025-07-14T16:20:00Z"],
  ["sam_10", "Drinks oat milk lattes", "2025-07-30T08:10:00Z"],
  ["sam_11", "Sleeps about 7 hours a night", "2025-08-11T22:30:00Z"],
  ["sam_12", "Wants weekly progress summaries on Sunday", "2025-08-24T10:00:00Z"],
  ["sam_13", "Does strength training twice a week", "2025-09-03T17:45:00Z"],
  ["sam_14", "Resting heart rate is around 52 bpm", "2025-09-20T06:30:00Z"],
  ["sam_15", "Partner's name is Jordan", "2025-10-05T19:00:00Z"],
  ["sam_16", "Speaks Portuguese and English", "2025-10-06T19:02:00Z"],
  ["sam_17", "Prefers short, direct coaching messages", "2025-11-01T09:00:00Z"],
  ["sam_18", "Birthday is on 9 May", "2025-11-12T11:11:00Z"],
  ["sam_19", "Doing Dry January, no alcohol", "2025-12-28T21:00:00Z", { expiration_date: "2026-01-31" }],
  ["sam_20", "Tracks macros in a spreadsheet", "2026-01-15T13:00:00Z"],
  ["sam_21", "Hates swimming since the shoulder strain", "2026-02-14T07:30:00Z"],
  ["sam_22", "Stretching routine takes 15 minutes after runs", "2026-03-02T18:00:00Z"],
  ["sam_23", "Commutes by bike", "2026-03-20T08:00:00Z"],
  ["sam_24", "Goal is to run a sub-2-hour half marathon", "2026-04-08T09:30:00Z"],
  ["sam_25", "Training for the Berlin half marathon on 2026-11-15", "2026-05-11T06:50:00Z"],
  ["sam_26", "Favorite recovery meal is a salmon bowl", "2026-06-01T20:15:00Z"],
  ["sam_27", "Eats fish again, pescatarian since July 2026", "2026-07-02T19:30:00Z"],
  ["sam_28", "Is training for Berlin half marathon on 2026-11-15", "2026-07-21T06:45:00Z"],
  ["sam_29", "Now works for Globex as head coach", "2026-08-12T15:00:00Z"],
  ["sam_30", "Lives in Berlin now, moved for the new job", "2026-08-20T10:00:00Z"],
  ["sam_31", "Wants reminders to hydrate during long runs", "2026-09-01T07:00:00Z"],
  ["sam_32", "Takes vitamin D in winter", "2026-09-15T08:00:00Z"],
  ["sam_33", "Prefers trail routes over roads", "2026-09-28T09:00:00Z"],
  ["sam_34", "Training for the Berlin half marathon, race day 2026-11-15", "2026-10-02T06:40:00Z"],
];

const priya: Row[] = [
  ["pri_01", "On the Free plan", "2025-06-01T14:00:00Z"],
  ["pri_02", "Preferred language is Spanish", "2025-06-01T14:01:00Z"],
  ["pri_03", "Company is Northwind Labs with 40 seats", "2025-06-01T14:02:00Z"],
  ["pri_04", "Uses the Python SDK in production", "2025-07-09T10:00:00Z"],
  ["pri_05", "Timezone is America/New_York", "2025-07-09T10:01:00Z"],
  ["pri_06", "Prefers email over chat for follow-ups", "2025-08-15T16:30:00Z"],
  ["pri_07", "Admin contact is the CTO", "2025-09-02T09:00:00Z"],
  ["pri_08", "Has SSO enabled with Okta", "2025-10-21T11:00:00Z"],
  ["pri_09", "Asked for the SOC 2 report in March 2026", "2026-03-12T15:20:00Z"],
  ["pri_10", "Billing cycle renews on the 3rd", "2026-03-12T15:21:00Z"],
  ["pri_11", "Preferred language is English for technical tickets", "2026-05-10T13:00:00Z"],
  ["pri_12", "Escalations go to the on-call Slack channel", "2026-05-22T18:00:00Z"],
  ["pri_13", "Reported that CSV export times out above 50k rows", "2026-06-18T12:00:00Z"],
  ["pri_14", "Prefers concise answers with code samples", "2026-07-01T09:30:00Z"],
  ["pri_15", "Runs self-hosted Postgres 16", "2026-07-30T17:10:00Z"],
  ["pri_16", "Reported CSV export timing out for exports above 50k rows", "2026-08-04T10:45:00Z"],
  ["pri_17", "Upgraded to the Pro plan in September 2026", "2026-09-03T08:00:00Z"],
  ["pri_18", "Ticket #4821: webhook retries failing on staging", "2026-09-10T11:00:00Z"],
  ["pri_19", "Ticket #4821: webhook retries failing on staging", "2026-09-10T11:04:00Z"],
  ["pri_20", "Frontend is Next.js deployed on Vercel", "2026-10-01T14:00:00Z"],
];

const lee: Row[] = [
  ["lee_01", "Shoe size is 9", "2025-04-03T19:00:00Z"],
  ["lee_02", "Favorite brand is Nike", "2025-04-03T19:01:00Z"],
  ["lee_03", "Ships to 221 Baker Street, London NW1", "2025-04-03T19:05:00Z"],
  ["lee_04", "Prefers free returns", "2025-05-12T12:00:00Z"],
  ["lee_05", "Budget for sneakers is under $150", "2025-05-12T12:01:00Z"],
  ["lee_06", "Likes minimalist design", "2025-06-20T18:30:00Z"],
  ["lee_07", "Buys gifts for a sister in December", "2025-11-28T20:00:00Z"],
  ["lee_08", "Wears size M in tops", "2025-12-02T10:00:00Z"],
  ["lee_09", "Avoids leather products", "2026-01-09T09:00:00Z"],
  ["lee_10", "Pays with Apple Pay", "2026-02-14T15:00:00Z"],
  ["lee_11", "Wants restock alerts for trail shoes", "2026-03-30T08:20:00Z"],
  ["lee_12", "Prefers neutral colors like grey and olive", "2026-04-18T17:40:00Z"],
  ["lee_13", "Member of the loyalty program since 2025", "2026-05-05T12:00:00Z"],
  ["lee_14", "Shoe size is 9.5 in running shoes", "2026-06-11T19:00:00Z"],
  ["lee_15", "Reads reviews before buying electronics", "2026-07-02T21:00:00Z"],
  ["lee_16", "Favorite brand is On Running now", "2026-08-08T18:00:00Z"],
  ["lee_17", "Ships to 221 Baker Street, London NW1 6XE", "2026-08-08T18:03:00Z"],
  ["lee_18", "Usually shops on weekends", "2026-09-19T11:00:00Z"],
];

function build(userId: string, rows: Row[]): Memory[] {
  return rows.map(([id, text, created, extra]) =>
    MemorySchema.parse({
      id,
      memory: text,
      hash: hashText(text),
      user_id: userId,
      metadata: { source: "chat" },
      categories: [],
      created_at: created,
      updated_at: created,
      expiration_date: null,
      ...extra,
    }),
  );
}

/** Returns a fresh copy every call so callers can mutate freely. */
export function seedMemories(): Memory[] {
  return [...build("sam", sam), ...build("priya", priya), ...build("lee", lee)];
}

export const PROBES: Record<string, string[]> = {
  sam: [
    "Where does Sam work?",
    "Where does Sam live?",
    "What does Sam eat?",
    "Does Sam enjoy swimming?",
    "When is Sam's half marathon?",
    "Is Sam allergic to anything?",
    "What is Sam's dog called?",
  ],
  priya: [
    "Which plan is Priya on?",
    "What is Priya's preferred language?",
    "What is the status of ticket 4821?",
    "Did Priya report a CSV export problem?",
  ],
  lee: ["What is Lee's shoe size?", "What is Lee's favorite brand?", "Where does Lee ship orders?"],
};
