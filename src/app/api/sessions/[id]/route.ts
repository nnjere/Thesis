import { friendlyError, json } from "@/lib/http/rate-limit";
import { getSessionManager } from "@/lib/sessions";

type Ctx = { params: Promise<{ id: string }> };

/** Poll a session's progress. Each poll also counts as a heartbeat. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const session = getSessionManager().get(id);
  if (!session) return friendlyError(404, "This session has finished or doesn't exist.");
  return json(session);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ended = await getSessionManager().end(id);
  return ended ? json({ ended: true }) : friendlyError(404, "This session has finished or doesn't exist.");
}
