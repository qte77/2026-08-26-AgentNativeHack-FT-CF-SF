import type { CotalResult } from "./types";

// Cotal's confirmed surface (docs/hackathon-brief.md) is an MCP tool catalog
// (cotal_send/cotal_dm/cotal_anycast) over a hosted NATS+JetStream mesh, not
// a plain REST endpoint - and the /connect + /device account-approval flow
// has not been walked end-to-end yet (plan row 5). Rather than fabricate an
// unverified HTTP call, this stays a documented no-op until that owner step
// is done and the MCP wiring is built - build-behind-gate, not a guess.
export async function publishToMesh(token: string | undefined): Promise<CotalResult> {
  if (!token) {
    return {
      mode: "no-op",
      detail:
        "no COTAL_TOKEN bound - coordination publish skipped (see docs/plans/0001-... row 5: " +
        "/connect+/device flow not yet completed)",
    };
  }
  return {
    mode: "no-op",
    detail:
      "COTAL_TOKEN present but MCP-mesh publish not yet wired (needs cotal_send/cotal_anycast " +
      "over the hosted mesh) - see docs/plans/0001-... row 5",
  };
}
