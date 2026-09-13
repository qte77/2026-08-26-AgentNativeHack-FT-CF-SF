import { describe, expect, it, vi } from "vitest";
import { fetchEditFrequencySignal } from "../src/signals";

function makeFetch(commits: Array<{ sha: string; files: string[] }>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/commits?")) {
      return new Response(JSON.stringify(commits.map((c) => ({ sha: c.sha }))), { status: 200 });
    }
    const sha = url.split("/commits/")[1];
    const commit = commits.find((c) => c.sha === sha);
    return new Response(
      JSON.stringify({ files: (commit?.files ?? []).map((filename) => ({ filename })) }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;
}

describe("fetchEditFrequencySignal", () => {
  it("does not report a hotspot when edits are spread thinly across paths", async () => {
    // This is the exact shape that made the AIsa NONE-branch unreachable:
    // any path touched even once used to read as "hottest path ... (1
    // touches)", which always sounded actionable to the live decision call.
    const commits = [
      { sha: "a", files: ["src/a.ts"] },
      { sha: "b", files: ["docs/b.md"] },
      { sha: "c", files: ["test/c.test.ts"] },
    ];
    const signal = await fetchEditFrequencySignal("o", "r", undefined, makeFetch(commits));
    expect(signal.summary).not.toMatch(/hottest path/);
    expect(signal.summary).toMatch(/no concentrated edit activity/i);
  });

  it("reports a hotspot once one path crosses the threshold", async () => {
    const commits = [
      { sha: "a", files: ["src/a.ts"] },
      { sha: "b", files: ["src/a.ts"] },
      { sha: "c", files: ["src/a.ts"] },
    ];
    const signal = await fetchEditFrequencySignal("o", "r", undefined, makeFetch(commits));
    expect(signal.summary).toMatch(/hottest path/);
    expect(signal.summary).toContain("src");
    expect(signal.summary).toContain("3 touches");
  });
});
