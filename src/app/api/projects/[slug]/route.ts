import { getProject } from "@/lib/catalog";
import { friendlyError, json } from "@/lib/http/rate-limit";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return friendlyError(404, "We couldn't find that project.");
  return json(project);
}
