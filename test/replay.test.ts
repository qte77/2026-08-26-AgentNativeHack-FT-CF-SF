import { describe, expect, it } from "vitest";
import { renderEpisode } from "../src/checkpoint";
import sampleJson from "../checkpoints/sample-episode.json";
import type { Episode } from "../src/types";

const sample = sampleJson as Episode;

describe("renderEpisode replay determinism", () => {
  it("is a pure function of the episode (no clock, no network, no randomness)", () => {
    const first = renderEpisode(sample);
    const second = renderEpisode(JSON.parse(JSON.stringify(sample)));
    expect(second).toBe(first);
  });

  it("reproduces the committed sample checkpoint byte-for-byte", () => {
    const rendered = renderEpisode(sample);
    expect(rendered).toBe(
      [
        "Episode sample-episode-0001 (started 2026-08-27T15:00:00.000Z)",
        "",
        "Signals observed:",
        "  - [github_actions] 3 recent runs, all passing/in-progress",
        "  - [security_alerts] no open Dependabot alerts",
        '  - [edit_frequency] hottest path in last 10 commits: "docs" (6 touches)',
        "",
        "AIsa decision (mode=dry-run, model=qwen-flash):",
        "  goal: NONE",
        "  reasoning: dry-run (no AISA_API_KEY bound); no signal matched the actionable heuristic",
        "",
        "Final decision: Build the Worker/agent implementing idle-discovery, wired to AIsa " +
          "(resource spend + receipt) and Cotal (coordination visibility)",
        "  source: backlog_fallback",
        "  reasoning: no live signal was actionable (a designed branch, not a failure) - " +
          "falling back to the next open row in this project's own remaining-work table",
        "",
        "Cotal coordination: mode=no-op",
        "  no COTAL_TOKEN bound - coordination publish skipped (see docs/plans/0001-... row 5: " +
          "/connect+/device flow not yet completed)",
      ].join("\n"),
    );
  });
});
