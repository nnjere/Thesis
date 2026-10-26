import { friendlyError, json } from "@/lib/http/rate-limit";
import { getSessionManager } from "@/lib/sessions";

/**
 * Technical diagnostics for a session. Hidden from the default interface;
 * shown only when someone opens "Technical details". Session IDs are random
 * UUIDs, but in production this should require the session owner's auth.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const diagnostics = getSessionManager().diagnostics(id);
  if (!diagnostics) return friendlyError(404, "This session has finished or doesn't exist.");
  return json({ diagnostics });
}
