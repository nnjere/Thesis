import { json } from "@/lib/http/rate-limit";
import { getSessionManager } from "@/lib/sessions";

/** POST variant of DELETE, for navigator.sendBeacon when a tab closes. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getSessionManager().end(id, "viewer left the page");
  return json({ ended: true });
}
