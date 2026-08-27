# Submission record — Agent Natives Builders Hackathon (`anb-hack-01`)

Snapshot of the actual `ic_hack_submit` response, captured verbatim from the live API — not a
description of intent. Team `nolim` (`t_eae57647f38568ec`), internal track.

```json
{
  "eid": "anb-hack-01",
  "team_id": "t_eae57647f38568ec",
  "title": "Idle-Discovery Agent — Bounded Autonomy with a Real AIsa Receipt",
  "blurb": "Internal track. Wakes with no queued task, reads 3 bounded live signals from its own repo, asks AIsa for a real metered payment to decide a goal or NONE, then executes it as real GitHub issues on this repo AND an independent counterparty repo (org2) — reading both back to confirm they landed. Checkpoints every episode for deterministic offline replay, and exposes a real MCP server (/mcp) so other agents can plug in directly, not just click a button.",
  "repo_url": "https://github.com/qte77/2026-08-26-AgentNativeHack-FT-CF-SF",
  "demo_url": "https://qte77.github.io/2026-08-26-AgentNativeHack-FT-CF-SF/",
  "agent_surface": "MCP server",
  "submitted_at": "2026-08-27T21:22:53.974Z",
  "locked": false,
  "updated_at": "2026-08-27T22:58:09.985Z"
}
```

## Roster status at time of last check

- `registered: true`, roles `["participant", "team_lead"]`, `nda_signed: true`
- Team `nolim`, sole member, created `2026-08-27T21:22:45.812Z`

## How this was verified, not just believed

`ic_hack_submit` was called directly against the event's MCP endpoint
(`https://www.immersivecommons.com/api/mcp`) with a real, human-approved agent token, and the raw
JSON response above was read back and captured — not inferred from a UI or assumed from a prior
call succeeding once.

Submission is idempotent/overwrite-until-lock (`locked: false` as of the timestamp above): safe to
resubmit if the repo changes materially before the event's submission lock.
