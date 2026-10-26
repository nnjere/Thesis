/** Small in-memory fixed-window rate limiter, keyed by client address. */
const buckets = new Map<string, { windowStart: number; count: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    if (buckets.size > 10_000) buckets.clear();
    buckets.set(key, { windowStart: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientKey(req: Request, scope: string): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${scope}:${forwarded || req.headers.get("x-real-ip") || "local"}`;
}

export function json(data: unknown, init: number | ResponseInit = 200): Response {
  const opts = typeof init === "number" ? { status: init } : init;
  return Response.json(data, { ...opts, headers: { "Cache-Control": "no-store", ...(opts.headers ?? {}) } });
}

export function friendlyError(status: number, message: string): Response {
  return json({ error: { message } }, status);
}
