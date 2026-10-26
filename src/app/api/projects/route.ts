import { getSearchProvider, isCategoryId, type ProjectType } from "@/lib/catalog";
import { json } from "@/lib/http/rate-limit";

const TYPES: ProjectType[] = ["web-app", "cli-tool", "desktop-app", "library"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 200);
  const category = url.searchParams.get("category");
  const type = url.searchParams.get("type") as ProjectType | null;
  const result = await getSearchProvider().search(q, {
    category: isCategoryId(category) ? category : undefined,
    type: type && TYPES.includes(type) ? type : undefined,
    runnableOnly: url.searchParams.get("runnable") === "1",
  });
  return json({
    query: result.query,
    engine: result.engine,
    approximate: result.approximate,
    results: result.hits.map((h) => ({ ...h.project, score: Math.round(h.score * 100) / 100 })),
  });
}
