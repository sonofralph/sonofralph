import { NextRequest, NextResponse } from "next/server";

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Prune expired entries every ~5 minutes to avoid unbounded growth.
// On Vercel each function instance is ephemeral so this is a safety net, not a GC replacement.
let lastPrune = Date.now();

function pruneIfNeeded() {
  const now = Date.now();
  if (now - lastPrune < 5 * 60 * 1000) return;
  lastPrune = now;
  for (const [key, w] of store) {
    if (w.resetAt <= now) store.delete(key);
  }
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

interface RateLimitOptions {
  /** Max requests allowed within the window */
  limit: number;
  /** Window duration in seconds */
  windowSecs: number;
}

/**
 * Returns a 429 NextResponse if the caller has exceeded the limit, otherwise null.
 * Key is scoped to IP + the provided `id` (typically the route path).
 */
export function rateLimit(
  req: NextRequest,
  id: string,
  { limit, windowSecs }: RateLimitOptions
): NextResponse | null {
  pruneIfNeeded();

  const ip = getIp(req);
  const key = `${ip}:${id}`;
  const now = Date.now();
  const windowMs = windowSecs * 1000;

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests — please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}
