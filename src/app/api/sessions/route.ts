import { getProject } from "@/lib/catalog";
import { clientKey, friendlyError, json, rateLimit } from "@/lib/http/rate-limit";
import { NoProviderError, SessionCapacityError, getSessionManager } from "@/lib/sessions";

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "sessions"), 30, 60_000)) {
    return friendlyError(429, "You're starting projects very quickly. Please wait a minute and try again.");
  }
  let slug = "";
  try {
    const body = (await req.json()) as { slug?: unknown };
    slug = typeof body.slug === "string" ? body.slug : "";
  } catch {
    /* handled below */
  }
  const project = getProject(slug);
  if (!project) return friendlyError(404, "We couldn't find that project.");
  try {
    return json(getSessionManager().create(project), 201);
  } catch (err) {
    if (err instanceof NoProviderError) return friendlyError(422, "This project can't be launched here. Check the project page for other ways to try it.");
    if (err instanceof SessionCapacityError) return friendlyError(503, err.message);
    throw err;
  }
}
