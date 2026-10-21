import { z } from "zod";
import { USERS } from "@/data/seed";

const QuerySchema = z.object({ user_id: z.string().trim().min(1).max(64) });

export function parseUser(request: Request): { userId: string } | { error: Response } {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({ user_id: url.searchParams.get("user_id") ?? "" });
  if (!parsed.success) {
    return { error: Response.json({ error: "user_id is required" }, { status: 400 }) };
  }
  if (!USERS.some((u) => u.id === parsed.data.user_id)) {
    return { error: Response.json({ error: "unknown user_id" }, { status: 404 }) };
  }
  return { userId: parsed.data.user_id };
}
