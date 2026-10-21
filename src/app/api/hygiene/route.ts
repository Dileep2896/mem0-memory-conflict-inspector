import { getServerStore } from "@/lib/store/server-store";
import { detectClusters } from "@/lib/detect";
import { hygieneStats } from "@/lib/health";
import { NOW } from "@/lib/time";
import { parseUser } from "../_shared";

export const dynamic = "force-dynamic";

/** GET /api/hygiene?user_id= -> { clusters, score, stats } */
export async function GET(request: Request) {
  const parsed = parseUser(request);
  if ("error" in parsed) return parsed.error;
  const memories = getServerStore().getAll(parsed.userId);
  const clusters = detectClusters(memories, { now: NOW });
  const stats = hygieneStats(memories, clusters, NOW);
  return Response.json({ clusters, score: stats.score, stats });
}
