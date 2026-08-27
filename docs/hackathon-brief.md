# Agent Natives Builders Hackathon — compiled brief

Source: https://www.immersivecommons.com/events/hackathon (re-fetched multiple times this session
for verification — not assumed from memory). Event: Aug 26-27, Cloudflare HQ, SF.

**Correction on record:** an earlier pass this session found a *different* page
(luma.com/agentnativebuildershackathon) describing 5 categories (Discovery/Access/Usability/
Payments/Accessibility) with wording nearly identical to ora.ai's own 4-pillar rubric. That page
appears to be either stale or a different listing — the tracks/rubric below, from
immersivecommons.com directly, are what's actually judged.

## Problem statement

"Two days where fifty builders from startups that already ship make their products legible to AI
agents. Not chatbots bolted onto human websites, but products designed for a web where agents are
first-class users."

## Two tracks

**External:** "Can an agent nobody on your team briefed, arriving with nothing but your domain name,
discover what your product does, get a credential, and complete a real transaction in it?" (re-fetched
fresh; wording has drifted slightly from an earlier read this session but meaning is unchanged.)

**Internal:** "Can the tooling your own company runs on get real work done through an agent, across
systems it does not own, and pick the job back up tomorrow where it left off today?"

No elaboration is given anywhere on the page for what counts as a valid "credential" or
"transaction" — no FAQ, no examples, no rules page. Interpretive latitude, but also nothing to point
at if challenged — the demo has to make it self-evidently true.

## Judging rubric (identical shape, both tracks; ranked by mean score across 5 judges, not sum)

| Weight | External | Internal |
|---|---|---|
| 30 | Cold-start success | Real work across a real boundary |
| 25 | **It runs** — HARD GATE | It runs — HARD GATE |
| 20 | Surface quality | Coordination design |
| 15 | Lands in the product | Lands in the product |
| 10 | Demo | Demo |

**The gate, verbatim:** "It runs" prevents placement if judges cannot trigger the submission **live,
themselves** — not us demoing it to them. This is the single biggest risk factor: whatever gets
built must be triggerable by someone who has never touched it before, with no hand-holding.

**No sponsor-tool-usage bonus is scored.** Using a sponsor's tool is optional and not separately
rewarded — it can only help indirectly (surface/coordination quality, demo), never as a checkbox.

## Sponsors + tools (re-verified fresh against first-party sources this session)

Dollar amounts below are re-confirmed against the live event page (fetched fresh) and, where noted,
cross-checked against each sponsor's own site/docs — not carried over from an earlier read.

- **Cloudflare** — Workers, Durable Objects, Workers AI, AI Gateway, Agents SDK. Venue/host only —
  the page states directly: "They are not a sponsor and they are not paying for anything."
- **Runtype** — $500 cash (best use) + $50 credits per builder. **Verified directly against
  docs.runtype.com / runtype.ai / runtype.com** (never checked before this pass): an "AI Product
  Platform" — build agents, prompt flows, evals, chat widgets, REST APIs, and scheduled automations;
  Runtype MCP can create/operate agents, flows, evals, and surfaces. Confirmed distinct from the
  unrelated `runtype` TypeScript runtime-type-checking library (different domain, different product
  category, no collision found).
- **Cotal** — $300 cash (best use). No credits (their hosted product hasn't launched). What they
  built for this event: `hack.cotal.ai`, a **hosted, shared** mesh — NOT self-hosted NATS. Confirmed
  by rendering the JS page (polyfetch/patchright, since plain fetch only returned the SPA shell): real
  nav is `/graph` (the literal "shared graph of who's working on what"), `/messages`, `/teams`,
  `/agents` ("Launch agent"), `/connect` ("Connect laptop"), `/personas`, `/device` ("Approve
  device") — a device-authorization-style flow to join the mesh, not a broker you stand up yourself.
  **Re-confirmed today directly against docs.cotal.ai**: NATS + JetStream transport, MCP tool catalog
  (`cotal_send`/`cotal_dm`/`cotal_anycast` for messaging, `cotal_spawn`/`cotal_persona` for
  teammates), credentials minted via `cotal mint <name> --profile agent`. (The `/connect`+`/device`
  flow itself has still never been walked end-to-end — nav existing doesn't confirm the auth
  mechanics work as assumed.)
- **Sandbox VR** — $330 in experiences. Not previously recorded in this brief; found on the fresh
  fetch of the event page.
- **Tenki** — $100 credits per builder, **self-serve and automatic**: confirmed directly on
  `tenki.cloud/events/agent-native` — "Sign up through this event page while the offer is active,"
  "$100 is applied to your workspace automatically. No promo code required" (signup at
  `app.tenki.cloud/auth/registration?event=agent-native`). SDK, confirmed on tenki.cloud: CLI or
  Go/TypeScript/Python — `npm install @tenkicloud/sandbox`, `go get
  github.com/LuxorLabs/tenki-sdk-go/sandbox`, `pip install tenki`.
  **Falsified and removed:** the "real Firecracker-microVM sandboxes, sub-2s boot" claim carried in
  an earlier pass this session — neither "Firecracker" nor any sub-2-second boot figure appears
  anywhere on tenki.cloud itself. That claim traced only to third-party blogs (blaxel.ai, a Wikipedia
  page, sourceforge, Open WebUI forum posts), never to Tenki's own site, and does not hold up under
  first-party re-verification. Treat the underlying sandbox tech as **unconfirmed/unspecified** by
  the vendor until stated on tenki.cloud directly.
- **AIsa** — $100 credits per builder per the event page. Tagline, confirmed on aisa.one/docs.aisa.one
  directly: "the Unified Resource and Transaction Network for AI Agents" — one API key, OpenAI-
  compatible base URL, 50+ models plus 100+ specialized endpoints (Twitter, Tavily, Perplexity,
  equity/prediction-market data, etc.) behind unified billing. **Correction:** the earlier claim that
  AIsa's credit-claim is "manual, no self-serve" does not hold for the general product — AIsa's own
  docs (`docs.aisa.one/docs/getting-started`) confirm a self-serve API Playground that grants **$5
  credit instantly on signup**, no promo code. Whether the **hackathon-specific** $100/builder credit
  uses that same self-serve flow or a manual one is still unconfirmed — flagged as open, not assumed
  either way.
  **Payment path — live-tested this session with the real, provided key (not just read from docs):**
  Two distinct payment surfaces exist. (1) **Bearer-key account balance** (`/v1`, `/apis/v1`):
  confirmed live — `POST /v1/chat/completions` with `Authorization: Bearer <key>` succeeded end-to-end
  against `qwen-flash` (one of 7 models, out of 104 total, not requiring `recharge_required`); the
  other 97 models (including everything from OpenAI/Anthropic) returned `402 {"code":
  "recharge_required"}` — the tested key's account balance does not currently cover paid models,
  contradicting an "already funded" assumption for premium inference specifically (the free-tier
  models work fine). (2) **x402 pay-per-call, no registration** (`/apis/v2`, mirrors `/apis/v1`):
  confirmed genuinely live, not vaporware — an unauthenticated `GET /apis/v2/coingecko/exchanges/binance`
  returned a real HTTP `402` with a well-formed `payment-required` header (base64 JSON, x402Version 2)
  offering the same resource for **$0.008 (8000 units of USDC, real mainnet contract address)** across
  ~11 chains simultaneously (Ethereum, Base, Arbitrum, Optimism, Polygon, etc.) via the EIP-3009
  "exact" scheme. **Settlement was deliberately NOT attempted** — completing it requires signing an
  EIP-712 payment authorization with a funded on-chain wallet's private key, which nobody should paste
  into an agent conversation; that step needs the wallet holder's own signing tool, not an agent. Net:
  the payment MECHANISM is confirmed real and working at the protocol level for both surfaces: "Private
  Beta" describes maturity/support-level, not brokenness.
- **Nebius** — $75 Builder Program credits per builder (previously recorded only as "GPU credits" —
  now precise, per the fresh event-page fetch).
- **Tavily** — 8,000 credits per builder (9,000 total with the free tier) — previously recorded only
  as "search/RAG credits."
- **Mitosis Labs** — **no builder credits.** The event page's own words: "They are not offering
  builder credits, so there is no code, no page and nothing to claim. What they brought instead is
  Cortex, the memory layer on the published stack, and their own screen on the floor. Prakshal and
  Alex are here today and will walk you through it." **Verified directly against mitosislabs.ai**
  (never checked before this pass): a real, distinct-from-crypto company (not to be confused with the
  unrelated "Mitosis" DeFi/liquidity protocol at mitosis.org — no collision found), product name
  **Cortex**, positioned as "the source of truth for your agents" — a verified-accuracy memory/
  persistence layer, benchmarked via an independent "Agentic Memory Index" (Verging Labs, 8 systems,
  2,176 tasks). **Practical implication for a build:** there is no confirmed self-serve API/credit
  path for this hackathon — engagement is in-person (a booth, two named people), not a programmatic
  integration you can wire up unattended before the deadline.
- **Hacker Bob** — security scan + a monthly subscription for winners (previously recorded only as
  "security scanning").
- **HUD** — $3,000 training credits for overall winners, plus an interview (previously recorded
  without the interview detail).
- **Immersive Commons** — model key provisioning (the event organizer itself).

## Submission mechanics (re-verified against a fresh fetch of the live page)

- Tool: `ic_hack_submit` — **one submission per team, overwritten until it locks**. Safe to submit
  something early and keep refining.
- Required fields: `title`, `blurb`, `repo_url`, `demo_url`, `agent_surface` (identifies the surface
  type — literally "MCP server, ai-agent.json, A2A endpoint, etc."), optional `folder_id`.
- **Lock: 3:00pm Thursday, August 27** (exact page wording, date included). **Day/date reconciliation
  — resolved, no conflict:** 2026-08-27 is independently confirmed to be a Thursday (`date -d
  2026-08-27` → Thursday; Aug 26 → Wednesday). The page's "Thursday" wording and the owner-confirmed
  deadline of "today (2026-08-27) 3:00 PM PT / 10:00 PM UTC" (see
  [`plans/0001-...md`](plans/0001-agent-native-hackathon-submission.md)) refer to the same day — this
  was flagged as a discrepancy to check, but it checks out clean.
- **Agent-driven submission is NOT mandatory.** The page explicitly offers a human path: "Or use
  [the form](/events/hackathon/apply) and a person reads the same thing" — at
  `/events/hackathon/apply`. No token-minting required for that route.
- If going the agent/CLI route anyway: `npx -y @immersivecommons/cli auth --scopes
  hack:read,hack:register,hack:team,hack:submit,keys:request`. **Scopes freeze at mint** — a missing
  scope means minting a whole new token and getting re-approved, so request everything up front if
  used at all.
- `ic_request_workshop_key` (scope `keys:request`) appears to be for in-event model access, separate
  from registration/submission.
- Applications were already closed before the event started — remaining live tools are team
  management, submission, and the chat/floor feed.
- **Full `ic_*` tool list, re-confirmed fresh against the live page (broader than previously
  recorded):** `ic_hack_apply`, `ic_hack_get`, `ic_hack_me`, `ic_hack_sign_nda`, `ic_hack_team_list`,
  `ic_hack_team_create`, `ic_hack_team_join`, `ic_hack_submit`, `ic_hack_chat_read`,
  `ic_hack_chat_post`, `ic_request_workshop_key`, `ic_get_my_workshop_key`, `ic_hack_credits_list`,
  `ic_hack_credits_mark`, `ic_feedback_submit`, `ic_hack_judge_score` (the last is presumably
  judge-only). `ic_hack_sign_nda` is new information — an NDA-signing step may exist somewhere in the
  team/registration flow; not previously recorded.

## Research citations consulted (not used for the rubric itself, background only)

- `patterns.smithers.sh` (via its GitHub README, since the site itself 403'd on direct fetch): named
  orchestration patterns — Review loops, Parallel ticket fleets, Supervisors, Panels, Debates,
  Migrations, RAG citation loops, **Repo janitors** (autonomous, self-directed repo maintenance —
  closest named pattern to "autonomously-set goals"). Durability model: persists every completed
  step to SQLite "the moment it finishes," so runs "survive crashes and resume from the last
  finished step."
- `github.com/dntywntme/2026-08-15-SF-0HumanCompanyHack-firm` — a **different** hackathon (Terac's
  "Zero-Human Company Hackathon," not this one), but a real, running, tested reference: deterministic
  checkpointed 9-stage pipeline, `make replay` reproduces a committed run byte-for-byte offline,
  fenced-JSON-only interpreted channel (prose outside the fence is inert — cheap prompt-injection
  defense), compliance-gate-before-spend, and a citation of real research against multi-agent
  swarms (arXiv:2512.08296: 17.2× error amplification for independent-topology multi-agent vs 4.4×
  centralized vs 1.0× single-agent, 260 configs; arXiv:2503.13657 MAST: 41-86.7% multi-agent failure
  rate across 7 frameworks) as an explicit case for restraint over swarm complexity.
- `/workspaces/qte77/liminal-flux-gh-acc` — design-only (its own README: "no running infrastructure
  yet"), but names the cheapest known mechanism for autonomous goal-setting: **idle discovery** — an
  empty goal queue flips the heartbeat from idling to one `if/else` branch that observes state,
  generates one goal, and lets the next heartbeat dispatch it. No new agent or workflow needed.
