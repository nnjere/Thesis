import { getProjectByRepo } from "@/lib/catalog";
import { clientKey, friendlyError, json, rateLimit } from "@/lib/http/rate-limit";
import { analyzeRepositoryCached } from "@/lib/repo/analyzer";
import { parseGitHubUrl } from "@/lib/repo/url";

/**
 * Analyse a public GitHub repository. Read-only: fetches metadata and a few
 * configuration files through GitHubReadOnlyClient. Never executes anything.
 */
export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "analyze"), 20, 60_000)) {
    return friendlyError(429, "You're going a little fast. Please wait a minute and try again.");
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return friendlyError(400, "Paste a link to a project on GitHub.");
  }
  const input = typeof (body as { url?: unknown })?.url === "string" ? (body as { url: string }).url : "";
  const parsed = parseGitHubUrl(input);
  if (!parsed.ok) return friendlyError(400, parsed.reason);

  const known = getProjectByRepo(parsed.repo.owner, parsed.repo.name);
  const result = await analyzeRepositoryCached(parsed.repo);
  if (!result.ok) {
    console.warn(`[analyze] ${parsed.repo.owner}/${parsed.repo.name}: ${result.error.detail}`);
    const status = result.error.code === "not_found" ? 404 : result.error.code === "rate_limited" ? 429 : 502;
    return json({ error: { message: result.error.message, code: result.error.code }, catalogSlug: known?.slug ?? null }, status);
  }
  return json({ analysis: result.analysis, catalogSlug: known?.slug ?? null });
}
