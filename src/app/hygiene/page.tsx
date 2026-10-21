import type { Metadata } from "next";
import { HygieneInspector } from "@/components/hygiene/inspector";

export const metadata: Metadata = { title: "Hygiene · Memory Conflict Inspector" };

export default function HygienePage() {
  return <HygieneInspector />;
}
