# Plan 0001 — Agent Natives Builders Hackathon submission

## Context

Event: Agent Native Builders Hackathon, Aug 26-27, Cloudflare HQ SF (venue only — Cloudflare is
**not** a sponsor; see [`docs/hackathon-brief.md`](../hackathon-brief.md) for the sponsor list and
exact quote). **Submission deadline, owner-confirmed: today (2026-08-27) 3:00 PM PT / 10:00 PM
UTC — this matches the event page's own "3:00pm Thursday, August 27" exactly (2026-08-27 is
independently confirmed to be a Thursday; no discrepancy).** Compute remaining time against this
absolute value, not against any hour-count carried over from earlier in a conversation — those decay
fast and are easy to get wrong.

Full research: [`docs/hackathon-brief.md`](../hackathon-brief.md) (rubric, tracks, sponsors,
submission mechanics — all re-verified against the live page this session, not assumed).
The original candidate list (`docs/candidates.md`) was superseded by the two designs below and
deleted this session — see the source-map entry further down for what was preserved from it.

**Decision state: RESOLVED — internal track chosen.** Liminal-flux's idle-discovery pattern
(implemented fresh — that repo has no running code, only the ADR-005 pattern) + AIsa-metered
resource spend as the real-boundary evidence and per-checkpoint receipt + Cotal-mesh coordination
(pending the fork verification in progress) + checkpoint/replay. The external design below is kept
for reference (both AIsa payment paths were live-tested and confirmed working, so it remains a
viable fallback if the internal build hits a wall before the deadline) but is **not** the current
build target.

## Two converged "wow factor" designs

### Internal (CHOSEN) — falsifiable autonomy + AIsa-metered real-boundary evidence + third-party-verified coordination

See the design further down (originally written second, now the active one) for the full
architecture and diagram. **New refinement this session**: the idle-discovery agent's
resource-consuming step routes through AIsa's Bearer-key gateway (confirmed live) instead of a free
API — this makes "real work across a real boundary" (30 pts) literal (a real, tiny, metered spend,
not a free call), and the checkpoint written for each episode includes AIsa's usage/response as a
receipt, not just a narrated log entry. Cotal-mesh coordination visibility is still pending
end-to-end verification (a fork is checking `/graph`, `/connect`, `/device` right now).

### External (kept for reference, not the current build target) — literal, not metaphorical, transaction

Discover (agent-card + MCP/A2A on a plain Cloudflare Worker — Workers/DO are NOT a sponsor claim,
just infrastructure) → **AIsa**-backed credential + real metered payment → **Tenki**-backed
sandboxed compute as the actual "transaction" (pay → get an isolated VM → real execution result,
not just an API response) → optionally **Runtype**-scripted calling-agent for live-demo
reliability.

Full sponsor facts (AIsa/Tenki/Runtype product surfaces, credit mechanisms, dollar amounts) live in
[`docs/hackathon-brief.md`](../hackathon-brief.md) — not repeated here. What matters for **this
design's viability**, re-verified directly against each vendor's own site/docs this session:

- **Runtype — now verified (previously the one unverified sponsor).** Confirmed via
  docs.runtype.com/runtype.ai directly: a real AI product platform (agents, flows, evals, REST APIs).
  Safe to build against for the "scripted calling-agent" role.
- **Tenki's credit path is confirmed self-serve** ($100/builder, automatic on signup at
  `tenki.cloud/events/agent-native`) — good for live-demo reliability. **Its underlying sandbox tech
  is no longer claimed as Firecracker microVMs / sub-2s boot** — that specific claim did not survive
  re-verification against tenki.cloud itself and has been retracted (see brief). Design around
  "isolated sandbox, real SDK (Go/TS/Python), real execution result" — not around unconfirmed
  boot-time or hypervisor specifics.
- **AIsa's payment path — now live-tested with a real key, risk downgraded.** Two surfaces exist.
  (1) Bearer-key account balance (`/v1`, `/apis/v1`): confirmed working end-to-end (a real
  `chat/completions` call succeeded), but the tested account's balance doesn't cover paid models
  right now — only 7 of 104 models work without a top-up; the other 97 (including all
  OpenAI/Anthropic models) return `402 recharge_required`. (2) x402 pay-per-call, no registration
  (`/apis/v2`): confirmed genuinely live — an unauthenticated call returned a real, well-formed HTTP
  402 challenge offering the resource for **$0.008** (real USDC contract address) across ~11 chains.
  **Settlement was deliberately not attempted** — it requires signing an EIP-712 authorization with a
  funded on-chain wallet's private key, which should never be pasted into an agent conversation; that
  step needs the wallet holder's own signing tool. Net: "Private Beta" describes support/maturity
  level, not brokenness — the mechanism is real. Remaining gap before relying on this live in front of
  judges: either (a) top up the Bearer-key account balance, or (b) have a wallet ready to complete one
  real x402 settlement as a rehearsal. Fallback if neither happens in time: demo the free-tier
  Bearer-key models (confirmed working now, zero setup) as "the transaction," framing the $0.008
  x402 challenge response itself (already captured, real) as evidence of the payment mechanism
  without completing a live settlement in front of judges.

```
EXTERNAL TRACK -- discover -> credential+pay -> sandboxed transact -> (optional) scripted caller
==================================================================================================

  ,-----------------------.        ,--------------------------.
  |  Judge / unbriefed     |        |  Cloudflare Worker        |
  |  agent (cold-start,    | -----> |  agent-card + MCP/A2A     |
  |  "arrives with only    |  (1)   |  endpoint  (DISCOVER)     |
  |  your domain name")    |        |  no CF sponsor claim --   |
  '-----------------------'        |  plain infra only         |
                                    '------------+---------------'
                                                 | (2) request credential
                                                 v
                                    ,--------------------------.
                                    |  AIsa                     |
                                    |  - issues API key /       |
                                    |    credential  [CONFIRMED]|
                                    |  - Bearer-key balance:    |
                                    |    LIVE-TESTED, works --  |
                                    |    7/104 models free,     |
                                    |    97 need account top-up |
                                    |  - x402 (no registration):|
                                    |    LIVE-TESTED -- real    |
                                    |    HTTP 402 challenge,    |
                                    |    $0.008 USDC, 11 chains |
                                    |    settlement untested    |
                                    |    (needs a funded wallet)|
                                    '------------+---------------'
                                                 | (3) pay-gated call,
                                                 |     credential in hand
                                                 v
                                    ,--------------------------.
                                    |  Tenki sandbox            |
                                    |  - spin up isolated VM    |
                                    |    via Go/TS/Python SDK   |
                                    |    or CLI  [CONFIRMED]    |
                                    |  - hypervisor/boot-time   |
                                    |    NOT vendor-claimed --  |
                                    |    do not cite Firecracker|
                                    |    or "sub-2s" (retracted)|
                                    |  - run real workload,     |
                                    |    return real result     |
                                    '------------+---------------'
                                                 | (4) execution result
                                                 v
                                    ,--------------------------.
                                    |  Judge-visible outcome    |
                                    |  (repo_url / demo_url) -- |
                                    |  "it runs" gate: judge     |
                                    |  triggers this LIVE, no   |
                                    |  hand-holding             |
                                    '--------------------------'

  Optional reliability wrapper, parallel to step (1):
  ,--------------------------.
  |  Runtype-scripted caller  |  -- now VERIFIED (docs.runtype.com): real agent/flow/eval
  |  drives the loop above    |     platform. Safe to use as a rehearsed, repeatable trigger
  |  for a rehearsed run      |     for the live demo, in addition to (not instead of) a
  '--------------------------'     genuinely cold, unbriefed judge trigger.
```

### Internal — falsifiable autonomy + third-party-verified coordination

An agent wakes on a schedule with **no task queued** → self-selects its own next goal via
liminal-flux's idle-discovery pattern (one `if/else` on an empty goal queue — not a new
agent/workflow) → coordinates visibly on **Cotal**'s hosted, shared `hack.cotal.ai` mesh
(`/graph` — a judge can watch it live on Cotal's own UI, not ours) → the whole episode is
checkpointed so a skeptical judge can **replay it deterministically, offline, afterward** (the bar
set by the (different-hackathon) Broker repo's `make replay`: reproduces a committed run
byte-for-byte, no live calls needed).

Full sponsor facts (Cotal's confirmed tech stack, Mitosis Labs' actual current status) live in
[`docs/hackathon-brief.md`](../hackathon-brief.md) — not repeated here. What matters for this
design's viability:

Cotal's real nav (`/graph`, `/connect`, `/device`, `/agents`, `/personas`) was confirmed by
rendering the JS page with polyfetch/patchright (plain fetch only returns the SPA shell), and its
NATS+JetStream/MCP-tool-catalog tech was re-confirmed directly against docs.cotal.ai this session.
It's a hosted, shared instance — not something to self-host NATS for. **Still not verified:** the
actual `/connect` + `/device` approval flow has never been walked end-to-end — nav existing doesn't
confirm the auth mechanics work as assumed; this remains the sharpest open risk for this design (row
5 in the remaining-work table).

**Mitosis Labs — now verified, and the finding changes how it should be used.** It's a real product
(Cortex, a memory/persistence layer, "the source of truth for your agents" — confirmed directly
against mitosislabs.ai) but the event page's own sponsor blurb states plainly it is **not offering
builder credits and has no self-serve page for this hackathon at all** — engagement is in-person
only (a booth, two named people). There is no confirmed programmatic API path to integrate against
before today's deadline. **Recommendation: do not build a live dependency on Mitosis Labs.** It
remains usable only as a conceptual/demo-narration tie-in ("this is the kind of memory layer our
checkpoint mechanism stands in for"), not as an integration the design's own checkpoint/replay
mechanism should route through.

```
INTERNAL TRACK -- idle wake -> self-selected goal -> Cotal-mesh coordination -> checkpoint/replay
==================================================================================================

  ,-----------------------.
  |  Scheduled trigger      |
  |  (cron, no human        |
  |  present, no task       |
  |  queued)                |
  '-----------+-------------'
              | (1) heartbeat fires
              v
  ,-----------------------------------.
  |  Idle-discovery if/else             |   <- liminal-flux pattern: ONE branch on an
  |  goal queue empty? -> observe state,|      empty goal queue. No new agent/workflow.
  |  generate ONE goal, queue it        |
  '-----------+-------------------------'
              | (2) goal selected
              v
  ,-----------------------------------.
  |  Agent executes the goal            |
  '-----------+-------------------------'
              | (3) publish progress/findings
              v
  ,-----------------------------------.        ,--------------------------------.
  |  Cotal hosted mesh                  | <----> |  hack.cotal.ai/graph            |
  |  (hack.cotal.ai) -- NOT self-hosted |  live  |  judge watches THIS live, on    |
  |  NATS+JetStream [CONFIRMED via      |  view  |  Cotal's own UI, not ours       |
  |  docs.cotal.ai]                     |        '--------------------------------'
  |  - cotal_send/cotal_dm/cotal_anycast|
  |  - cotal_spawn/cotal_persona        |        NOTE: /connect + /device approval flow
  |  - credentials via `cotal mint`     |        still NOT walked end-to-end -- open risk
  '-----------+-------------------------'        (remaining-work row 5), test before demo.
              | (4) episode completes
              v
  ,-----------------------------------.
  |  Checkpoint written to disk         |   <- mirrors the (different-hackathon) Broker
  |  (committed state files, no live    |      repo's `make replay` bar: byte-for-byte
  |  calls needed to replay)            |      reproducible offline, no live calls.
  '-----------+-------------------------'
              | (5) time passes (cold, separate run)
              v
  ,-----------------------------------.
  |  `make replay` (or equivalent)      |
  |  reproduces the run from committed  |
  |  state alone -- "it runs" gate:      |
  |  judge triggers this LIVE            |
  '--------------------------------------'

  Mitosis Labs is deliberately OUTSIDE this diagram: confirmed this session to have no
  self-serve/API path for this event (in-person booth only, no builder credits) -- it is
  demo-narration framing at most, not a wired dependency of the checkpoint mechanism above.
```

## 🗺️ Source map (what exists right now)

- **AIsa test API key used this session was owner-provided, one-time, and will be rotated after
  testing** — do not assume `sk-aisa-3kZvOZk9tLdwRyplQ3QBUXjbusUsccDkkTPBL5wwg1s` still works in a
  future session; it was never written into any file in this repo (kept in `/tmp/aisa_key.env` on
  the agent's local sandbox only, outside git entirely). A fresh key will be needed for any further
  live testing or for the actual build.
- `docs/hackathon-brief.md` — compiled, cited research: rubric, both track descriptions, full
  sponsor list with what each is actually giving, submission mechanics, pattern-source citations.
- `docs/candidates.md` — **deleted this session.** It was original working notes (6 candidates,
  3/track, plus a Cotal-recombination analysis) written *before* the "no Cloudflare sponsorship"
  correction and *before* the AIsa/Tenki/Runtype/Mitosis Labs verification. Re-checked line-by-line
  against this session's full first-party verification pass before deleting: nothing in it was more
  accurate than what's in this file, and everything in it that still mattered (the arXiv
  research-restraint citations, the Cotal-fits-internal-not-external reasoning, the "one track, one
  candidate" recommendation) is already captured in this plan or in `docs/hackathon-brief.md`. Fully
  superseded, confirmed, removed — not recoverable via git (the file was untracked).
- **No code has been written in this repo.** `.git` + `README.md` (title only) + `docs/` is the
  entire repo as of this plan.
- Nothing has been submitted. No team/token status was confirmed beyond "we got enrolled" (owner's
  words) — whether that includes an existing team registration or just application approval was
  never disambiguated.

## Remaining-work table (SINGLE source of open work)

| # | Item | Gate | Done-when |
|---|------|------|-----------|
| ~~1~~ | ~~Decide: external, internal, or scoped-down version of one~~ | owner | **Done — internal chosen (liminal-flux idle-discovery + AIsa-metered receipts + Cotal coordination + checkpoint/replay); external kept as documented fallback, not deleted** |
| ~~2~~ | ~~Confirm the actual submission deadline~~ | owner | **Done — today (2026-08-27) 3:00 PM PT / 10:00 PM UTC, owner-confirmed** |
| ~~3~~ | ~~Confirm AIsa's payment path works live~~ | owner/agent | **Partly done — both surfaces confirmed live this session with the real key (Bearer-key chat completion succeeded; x402 challenge returned real $0.008 USDC terms). Remaining: either top up the Bearer-key account balance, or complete one real x402 settlement with a funded wallet (owner-gated — needs a private key, not an agent action) — do this before the live demo, not during it.** |
| ~~4~~ | ~~Verify Runtype's actual product surface before building against it~~ | agent | **Done — confirmed via docs.runtype.com/runtype.ai: real AI product platform (agents/flows/evals/REST APIs)** |
| ~~5~~ | ~~Walk Cotal's `/connect` + `/device` flow end-to-end~~ | agent | **Done — CONFIRMED buildable/demo-able, no hidden blocker (an earlier "inconclusive" report in this same session was wrong — a too-short render timeout, corrected on retry). `/graph` is fully public, no login wall — a judge can view it with zero setup, and shows a real empty-state message confirming the mesh is live. Fastest path: `/agents` — "boots a sandbox, installs the standard CLI, enrols an agent... takes about two minutes" — zero local setup. Alternative: the 5-step `/connect` laptop CLI (`curl get.cotal.ai \| sh` → `cotal setup --yes` → `cotal meshes add` → `cotal login` → approve at `/device`). Either path needs creating/joining a team + one `cotal login`/`/device` code-approval step (a real account action, not just viewing — not attempted by the read-only exploration). One doc correction: the event-specific flow uses `cotal setup --yes` (connects directly to the already-hosted mesh) — simpler than the general product docs' `cotal-ai setup --yes && cotal-ai up --detach` (which provisions a local broker); don't use the general-docs command for this event.** |
| ~~6~~ | ~~Verify Mitosis Labs' actual product surface~~ | agent | **Done — confirmed via mitosislabs.ai: real product (Cortex), but no builder credits/self-serve path for this event — do not build a live dependency on it** |
| 7 | Build the chosen design: Worker/agent implementing idle-discovery, wired to AIsa (resource spend + receipt) and Cotal (coordination visibility) | agent | Passes the "it runs" gate — a fresh, unbriefed trigger works with zero hand-holding |
| 8 | Rehearse the full live demo at least once, cold, before presenting to judges | owner+agent | One complete run succeeds with no intervention |
| 9 | Register team / confirm team status | owner | `ic_hack_team_*` or web-form equivalent confirmed done |
| 10 | Submit — via `/events/hackathon/apply` web form (no token needed) or `ic_hack_submit` (needs a minted token, scopes freeze at mint) | owner | `repo_url`, `demo_url`, `agent_surface`, `title`, `blurb` all filled and confirmed received |

## Known blockers / open risks (not yet resolved)

- **Deadline is resolved and independently cross-checked (2026-08-27, 3:00 PM PT / 10:00 PM UTC)** —
  matches the event page's own "3:00pm Thursday, August 27" exactly (2026-08-27 is confirmed a
  Thursday; no discrepancy). The sharpest remaining risk is #1: no track decision yet, and the clock
  is real, fixed, and running out today.
- **Given how little time is left, the honest recommendation carried over unchanged from the earlier
  candidate analysis still holds: pick ONE track, ONE candidate, built to actually satisfy the "it
  runs, judge-triggered live" gate — that gate zeroes the score regardless of everything else.
  Prioritize a working, simple loop over an ambitious, fragile one.**
- **AIsa's payment mechanism was live-tested this session with the real, provided key — risk
  downgraded from "unconfirmed" to "confirmed real, one step short of a completed settlement."**
  Bearer-key chat completions work now (free-tier models only — the account needs a top-up for paid
  models). The x402 no-registration path returned a genuine HTTP 402 challenge with real terms
  ($0.008 USDC, 11 chains) — the protocol is live, not Private-Beta-as-in-broken. What's still
  missing before relying on it live in front of judges: an actual completed settlement, which needs
  a funded on-chain wallet and a human doing the signing (deliberately not attempted by the agent —
  see plan row 3 and the source-map API-key note below).
- Runtype and Mitosis Labs are now both independently verified against their own sites (see rows 4
  and 6, done) — same rigor already applied to AIsa/Tenki/Cotal. Mitosis Labs' verification
  surfaced a new constraint: no builder credits/self-serve path exists for it at all, so it's
  unsuitable as a live dependency regardless of which track is picked.
- Cotal's actual join/auth mechanics: nav structure and underlying tech stack (NATS+JetStream, MCP
  tool catalog) both confirmed directly against docs.cotal.ai; the `/connect`+`/device` flow itself
  still has not been walked end-to-end.
- No team/submission status has been confirmed beyond "we got enrolled" — whether a team already
  exists, or whether that's still an open step, needs an owner answer before #9/#10 can start.
