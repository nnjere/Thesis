import { clientKey, friendlyError, json, rateLimit } from "@/lib/http/rate-limit";
import { getSessionManager } from "@/lib/sessions";
import { ToolInputError, runTool } from "@/lib/tools";

/** Run a tool adapter. Requires a ready session that launched this tool. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!rateLimit(clientKey(req, "tools"), 60, 60_000)) {
    return friendlyError(429, "That's a lot of runs in a short time. Please wait a minute.");
  }
  let body: { sessionId?: unknown; text?: unknown; options?: unknown };
  try {
    body = await req.json();
  } catch {
    return friendlyError(400, "Add some text first, or upload a file.");
  }
  const session = typeof body.sessionId === "string" ? getSessionManager().get(body.sessionId) : undefined;
  if (!session || session.state !== "ready" || session.result?.kind !== "tool-form" || session.result.adapterId !== id) {
    return friendlyError(409, "This session has ended. Start the tool again to keep going.");
  }
  try {
    return json({ result: runTool(id, body.text, body.options) });
  } catch (err) {
    if (err instanceof ToolInputError) return friendlyError(400, err.message);
    console.error(`[tools/${id}]`, err);
    return friendlyError(500, "The tool ran into a problem with that input. Try different text, or a smaller file.");
  }
}
