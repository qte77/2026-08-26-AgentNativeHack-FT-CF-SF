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
4. **Checkpoint** every episode (`src/checkpoint.ts`) so a skeptical judge can replay it later,
   byte-for-byte, with zero live calls (`npm run replay`).

Cotal mesh coordination is documented as a deliberate no-op for now — `docs.cotal.ai` confirms
the only client interface is a persistent NATS+JetStream connection, which a stateless Worker
request can't hold without a Durable Object bridge. Rather than fake that integration, the
judge-visible `/checkpoints` feed carries the coordination-visibility story instead. Full
reasoning: [`docs/plans/0001-...md`](docs/plans/0001-agent-native-hackathon-submission.md).

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
