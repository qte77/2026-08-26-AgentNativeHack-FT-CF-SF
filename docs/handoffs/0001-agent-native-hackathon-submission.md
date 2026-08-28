# Handoff 0001 — Agent Natives Builders Hackathon submission

Read [`docs/plans/0001-agent-native-hackathon-submission.md`](../plans/0001-agent-native-hackathon-submission.md)
first — this doc onboards you to *that* plan, doesn't repeat its content. This handoff was fully
rewritten after the build shipped; an earlier version describing a pre-build, research-only state
is gone (it was stale for most of the session — don't trust an older copy of this file if you find
one elsewhere).

## What shipped

The idle-discovery loop is live, submitted, and verified end to end: `src/signals.ts` (3 bounded
GitHub signals) → `src/aisa.ts` (one stateless AIsa decision call) → `src/backlog.ts` (NONE-branch
fallback reading this repo's own plan) → `src/execute.ts` (real GitHub issue + file writes on this
repo **and** an independent counterparty repo, `org2`) → `src/checkpoint.ts` (KV history +
deterministic offline replay). `src/mcp.ts` exposes the same loop as a real MCP JSON-RPC tool.
`org2` has its own independent GitHub Actions agent (`respond.yml` + `respond.mjs`) reacting to
incoming requests on its own credential. Submission (`ic_hack_submit`) returned `ok: true` and is
recorded verbatim in [`docs/submission.md`](../submission.md).

## What's still open

The plan's remaining-work table is the only list of open items — don't recreate one here. As of
this rewrite, the one substantive open row is **7a (Cotal)**: a Tenki cloud sandbox has `cotal`
installed, the `hack` mesh registered, and login succeeded; `scripts/cotal-bridge.sh` is written
and tested; the only remaining block is a mesh-operator ACL grant this account doesn't have —
external, not self-serviceable.

## Known, accepted rough edges (not bugs to silently fix)

- **The AIsa decision call is fully stateless** — no memory of any prior episode, by design (see
  README's "How it decides" step 2). Because this repo's own `src/` directory has stayed the
  hottest-edit-frequency path all session (from the build's own commits), repeated live triggers
  have produced 20+ real but near-duplicate issues on the main repo and 15+ on `org2` — genuine
  output, not fabricated, but noisy. Flagged to the owner as a judgment call (clean up duplicates
  vs. leave as evidence); no decision recorded as of this rewrite.
- Real bugs found via live browser-driven E2E testing (not plain HTTP checks) and already fixed:
  checkpoint keys sorting non-chronologically, CORS headers missing on uncaught errors, older
  checkpoints 500ing after a schema change, `GET /mcp` 404ing. See `git log` for the actual PRs.

## Commands / access notes

- Live URLs, env vars, and CLI switches are documented in README.md's own tables — don't duplicate
  them here, they'll drift.
- Cloudflare secrets: `wrangler secret put GITHUB_TOKEN` / `AISA_API_KEY` — already set on the
  deployed Worker as of this rewrite.
- `env -u GH_TOKEN -u GITHUB_TOKEN` prefix needed before any `git push`/`gh` command in this
  environment — a Codespaces-injected `GITHUB_TOKEN` env var otherwise shadows the real credential
  and silently 403s pushes.
- Tenki sandbox (`01a0457e-...`, name `cotal-bridge-persistent`) is real, provisioned cloud infra —
  `TENKI_API_KEY` lives in local `.dev.vars`, never committed.
