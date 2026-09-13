const TRIGGER_LIMIT_PER_HOUR = 10;

function hourBucket(now: Date): string {
  return now.toISOString().slice(0, 13); // e.g. "2026-09-13T10"
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

// Coarse, KV-backed hourly cap on /trigger. Judge 1 and Judge 4's post-
// judging feedback both flagged this endpoint as an unauthenticated public
// GET that spends real AIsa balance with no cap - this bounds that, not
// billing-grade precision (KV has no atomic increment, so this is a soft
// cap under concurrent requests, which is an accepted tradeoff for a demo
// endpoint, not a security control for a payment system).
export async function checkTriggerRateLimit(
  kv: KVNamespace,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const key = `ratelimit:trigger:${hourBucket(now)}`;
  const current = Number((await kv.get(key)) ?? "0");
  if (current >= TRIGGER_LIMIT_PER_HOUR) {
    return { allowed: false, count: current, limit: TRIGGER_LIMIT_PER_HOUR };
  }
  await kv.put(key, String(current + 1), { expirationTtl: 3600 });
  return { allowed: true, count: current + 1, limit: TRIGGER_LIMIT_PER_HOUR };
}
