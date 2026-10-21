import type { Memory } from "./types";

/** Frozen "now" so the demo and the tests are deterministic. */
export const NOW = new Date("2026-10-21T12:00:00Z");

export function today(now: Date = NOW): string {
  return now.toISOString().slice(0, 10);
}

export function isExpired(m: Memory, now: Date = NOW): boolean {
  return Boolean(m.expiration_date) && (m.expiration_date as string).slice(0, 10) < today(now);
}

/** Active = what `latest_only` recall would return: not superseded and not expired. */
export function isActive(m: Memory, now: Date = NOW): boolean {
  return !m.metadata.superseded_by && !isExpired(m, now);
}

export function daysBetween(fromIso: string, now: Date = NOW): number {
  return (now.getTime() - new Date(fromIso).getTime()) / 86_400_000;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
