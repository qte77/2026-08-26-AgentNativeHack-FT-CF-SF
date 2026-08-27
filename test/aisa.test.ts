import { describe, expect, it } from "vitest";
import { decideGoal } from "../src/aisa";
import type { Signal } from "../src/types";

describe("decideGoal dry-run (no AISA_API_KEY)", () => {
  it("returns NONE when no signal matches the actionable heuristic", async () => {
    const signals: Signal[] = [
      { source: "github_actions", summary: "2 recent runs, all passing/in-progress", data: null },
      { source: "security_alerts", summary: "no open Dependabot alerts", data: null },
    ];
    const receipt = await decideGoal(signals, undefined, "qwen-flash");
    expect(receipt.mode).toBe("dry-run");
    expect(receipt.goal).toBeNull();
  });

  it("proposes a goal when a signal reports a failing run", async () => {
    const signals: Signal[] = [
      { source: "github_actions", summary: "1/3 recent runs failing (ci)", data: null },
    ];
    const receipt = await decideGoal(signals, undefined, "qwen-flash");
    expect(receipt.mode).toBe("dry-run");
    expect(receipt.goal).toContain("failing");
  });
});
