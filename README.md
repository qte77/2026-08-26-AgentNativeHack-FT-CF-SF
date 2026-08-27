# Agent Natives Builders Hackathon — internal track submission

An agent that wakes with no queued task, self-selects **one** concrete goal from a small,
bounded set of live signals, and checkpoints the episode so it can pick the job back up
tomorrow where it left off today.

## Try it live

| | URL |
|---|---|
| Landing page (demo entrypoint) | https://qte77.github.io/2026-08-26-AgentNativeHack-FT-CF-SF/ |
| Worker (live episode) | https://agent-native-hack.cloudflare-driveway392.workers.dev/trigger |
| Agent card | https://agent-native-hack.cloudflare-driveway392.workers.dev/.well-known/ai-agent.json |
| Checkpoint feed | https://agent-native-hack.cloudflare-driveway392.workers.dev/checkpoints |
| MCP server (agent plug-in) | https://agent-native-hack.cloudflare-driveway392.workers.dev/mcp |
| Counterparty repo (org2) | https://github.com/qte77/2026-08-26-AgentNativeHack-FT-CF-SF-org2 |

Click the landing page's button, or `GET /trigger` directly — either runs one full episode
against real signals, right now, with no setup. That's the "it runs" gate: an unbriefed judge
can hit this and watch it happen. The landing page is static (GitHub Pages) and calls the Worker
client-side; it doesn't replace it.

No live deploy URL yet? Reproduce a committed episode deterministically, offline, no network:

```
npm install && npm run replay
# or: make replay
```

## How it decides

1. **Observe** three bounded, cheap signals on this repo itself — not open-ended exploration:
   GitHub Actions run status, open Dependabot alerts, and which file/directory has the
   highest edit frequency in the last 10 commits.
2. **Decide** — one AIsa-gated LLM call (`qwen-flash`, OpenAI-compatible, `api.aisa.one/v1`)
   is asked for exactly one goal sentence, or `NONE`. That call is the real-boundary receipt:
   a metered request across an actual external system, captured in the checkpoint.
3. **Fall back on purpose** — if nothing live is actionable, that's a designed branch, not a
   failure: the agent reads the next open row from this project's own
   [remaining-work table](docs/plans/0001-agent-native-hackathon-submission.md) and works on
   itself instead of idling or crashing.
4. **Execute** — the decided goal becomes a real GitHub issue on this repo, and a real issue plus
   a committed file on
   [`2026-08-26-AgentNativeHack-FT-CF-SF-org2`](https://github.com/qte77/2026-08-26-AgentNativeHack-FT-CF-SF-org2),
   an independently-maintained counterparty repo (`src/execute.ts`) — not just an internal record.
   `org2` has its **own** independent GitHub Actions agent that reacts on its own (comments on the
   issue, logs to its own `PROCESSED.md`) using only its own Actions-provided `GITHUB_TOKEN` — two
   separately-authenticated systems, not one agent narrating both sides. Then **check**: every
   write is read back to confirm it actually landed, rather than trusting the write responses.
5. **Checkpoint** every episode (`src/checkpoint.ts`) so a skeptical judge can replay it later,
   byte-for-byte, with zero live calls (`npm run replay`).

Other agents can plug in directly at `/mcp` (JSON-RPC 2.0: `initialize`, `tools/list`,
`tools/call`) instead of only clicking a button — `run_idle_discovery_episode` is a real callable
tool, discoverable with no auth or setup.

Cotal mesh coordination is a documented no-op in the Worker itself, but real progress exists
outside it: a persistent Tenki cloud sandbox has `cotal` installed, the `hack` mesh registered, and
login succeeded — `cotal send msg` is written and tested (`scripts/cotal-bridge.sh`), but blocked
on a mesh-operator ACL grant this account doesn't have yet. Not an architecture limit anymore, a
permissions one. `/checkpoints` plus `org2`'s own reactive agent carry the coordination-visibility
story in the meantime. Full detail: [`docs/plans/0001-...md`](docs/plans/0001-agent-native-hackathon-submission.md) row 7a.

## Architecture, boundaries, and data flow

```
  Human, browser              Agent, MCP client
  ──────────────►             ──────────────►
  click "Run a live episode"  POST /mcp (JSON-RPC)
       │                            │
       ▼                            ▼
  ┌───────────────────┐      ┌─────────────────────────────────┐
  │ GitHub Pages        │────►│  Cloudflare Worker                │
  │ docs/index.html     │     │  index.ts (router)                │
  │ static, CORS fetch  │     │  episode.ts (orchestrator)        │
  └───────────────────┘      └───┬─────┬─────┬─────┬─────────────┘
                                  │     │     │     │
              (1) signals.ts     │     │     │     │  (4) execute.ts
        ┌─────────────────────────┘     │     │     │
        │ read: Actions status,         │     │     │
        │ Dependabot, edit-hotspot      │     │     │
        ▼                               │     │     ▼
  ══════════════════════╗               │     │  ══════════════════════════╗
  ║ GitHub REST API      ║◄──────────────┘     │  ║ GitHub REST API (write)   ║
  ║ (real boundary #1)   ║◄─────────────────────┼──║ - this repo               ║
  ══════════════════════╝                      │  ║ - org2 (counterparty repo)║
              (2) aisa.ts                       │  ══════════════════════════╝
        ┌─────────────────────────────────────────┘
        │ one metered chat/completions call        (3) backlog.ts, on NONE:
        ▼                                           reads this repo's own plan.md
  ══════════════════════╗                           for the next open row
  ║ AIsa api.aisa.one    ║                           (self-referential fallback)
  ║ (real boundary #2,   ║
  ║  real $ receipt)     ║
  ══════════════════════╝

                          (5) checkpoint.ts
                          ┌─────────────────────────┐
                          │  Workers KV                │
                          │  episode history            │
                          │  /checkpoints, /replay      │
                          └─────────────────────────┘

  Cotal (in progress) — a Tenki sandbox has cotal installed + logged in, ready to
  publish episode summaries to hack.cotal.ai/graph via scripts/cotal-bridge.sh -
  blocked on a mesh-operator ACL grant, not on architecture.

  ══════ = a real external system this build does not own (the "boundary")
```

## Observe, analyze, test — for agents

- **Observe**: `GET /.well-known/ai-agent.json` (agent card) and `GET /checkpoints` (episode
  history) — zero auth, zero setup.
- **Analyze**: `GET /checkpoints/{id}` returns the full episode — every signal read, the AIsa
  request/response, the decision, the GitHub issue written, and its read-back confirmation.
- **Test**: `POST /mcp` with `{"method":"tools/list"}` to discover `run_idle_discovery_episode`,
  then `{"method":"tools/call","params":{"name":"run_idle_discovery_episode","arguments":{}}}`
  to actually run one — a real callable tool, not just a clickable button. `GET /trigger` does
  the same over plain HTTP if MCP isn't convenient.
- **Onboarding**: none needed. No credential, no signup, no local install — an agent with nothing
  but this domain can discover and call the full surface cold.

## Observe, analyze, test — for humans

- **Observe**: the [landing page](https://qte77.github.io/2026-08-26-AgentNativeHack-FT-CF-SF/) —
  use case, a diagram marking exactly which edges are real external-system boundaries, and a live
  checkpoint timeline.
- **Analyze**: click through to the [source repo](https://github.com/qte77/2026-08-26-AgentNativeHack-FT-CF-SF)
  and its [Issues tab](https://github.com/qte77/2026-08-26-AgentNativeHack-FT-CF-SF/issues), or the
  [counterparty repo's issues](https://github.com/qte77/2026-08-26-AgentNativeHack-FT-CF-SF-org2/issues) —
  every issue in both was opened by the agent itself, not a person, as real, checkable evidence of
  execution across two independent repos.
- **Test**: click "Run a live episode" on the landing page and watch it happen in real time.
- **Onboarding**: none needed. One URL, one button, no signup.

## Development

```
npm install
cp .dev.vars.example .dev.vars   # fill in AISA_API_KEY / GITHUB_TOKEN to go live; blank = dry-run
npm run dev                       # wrangler dev, fully local, no Cloudflare login needed
npm run typecheck
npm run test
npm run replay                    # or: make install|dev|typecheck|test|replay|deploy
```

`npm run deploy` (or `make deploy`) needs `wrangler login` first (`--device` works in
containers/remote sessions where the localhost OAuth callback can't be reached).

### Environment variables

| Name | Where | Required | Effect if unset |
|---|---|---|---|
| `GITHUB_TOKEN` | `.dev.vars` (local) / `wrangler secret put GITHUB_TOKEN` (deployed) | no | Unauthenticated GitHub calls (low rate limit); Dependabot-alerts signal reports "unavailable" |
| `AISA_API_KEY` | `.dev.vars` (local) / `wrangler secret put AISA_API_KEY` (deployed) | no | `aisaReceipt.mode` stays `"dry-run"` (deterministic heuristic, no live call) instead of `"live"` |
| `COTAL_TOKEN` | `.dev.vars` / `wrangler secret put COTAL_TOKEN` | no | No effect yet — Cotal publish is a documented no-op regardless (see below) |
| `TARGET_REPO_OWNER`, `TARGET_REPO_NAME`, `AISA_MODEL` | `wrangler.jsonc` `vars` | — | Non-secret config, already set |

## Docs

- [`docs/hackathon-brief.md`](docs/hackathon-brief.md) — compiled, source-verified event research
- [`docs/plans/0001-agent-native-hackathon-submission.md`](docs/plans/0001-agent-native-hackathon-submission.md) — design + the single remaining-work table
- [`docs/handoffs/0001-agent-native-hackathon-submission.md`](docs/handoffs/0001-agent-native-hackathon-submission.md) — session handoff
