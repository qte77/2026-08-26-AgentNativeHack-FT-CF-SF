import { describe, expect, it } from "vitest";
import { checkTriggerRateLimit } from "../src/ratelimit";

// Minimal in-memory stand-in for the one KVNamespace method pair this
// module actually uses - not a full KVNamespace mock.
function fakeKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
  } as unknown as KVNamespace;
}

describe("checkTriggerRateLimit", () => {
  it("allows requests under the hourly cap", async () => {
    const kv = fakeKv();
    const now = new Date("2026-09-13T10:00:00.000Z");
    for (let i = 0; i < 5; i++) {
      const result = await checkTriggerRateLimit(kv, now);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests once the hourly cap is reached", async () => {
    const kv = fakeKv();
    const now = new Date("2026-09-13T10:00:00.000Z");
    let last;
    for (let i = 0; i < 11; i++) {
      last = await checkTriggerRateLimit(kv, now);
    }
    expect(last!.allowed).toBe(false);
  });

  it("resets in a new hour bucket", async () => {
    const kv = fakeKv();
    const hourOne = new Date("2026-09-13T10:59:00.000Z");
    for (let i = 0; i < 10; i++) await checkTriggerRateLimit(kv, hourOne);
    expect((await checkTriggerRateLimit(kv, hourOne)).allowed).toBe(false);

    const hourTwo = new Date("2026-09-13T11:00:00.000Z");
    expect((await checkTriggerRateLimit(kv, hourTwo)).allowed).toBe(true);
  });
});
