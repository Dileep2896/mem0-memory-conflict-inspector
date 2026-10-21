import { getServerStore } from "@/lib/store/server-store";
import { parseUser } from "../_shared";

export const dynamic = "force-dynamic";

/** GET /api/memories?user_id= -> { results: Memory[] } (mirrors a typical memory-layer REST get_all) */
export async function GET(request: Request) {
  const parsed = parseUser(request);
  if ("error" in parsed) return parsed.error;
  return Response.json({ results: getServerStore().getAll(parsed.userId) });
}
