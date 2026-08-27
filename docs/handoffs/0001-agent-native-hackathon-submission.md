# Handoff 0001 — Agent Natives Builders Hackathon submission

Read [`docs/plans/0001-agent-native-hackathon-submission.md`](../plans/0001-agent-native-hackathon-submission.md)
first — this doc onboards you to *that* plan, doesn't repeat its content.

## What shipped this session

Pure research + documentation. **Zero code.** Two docs remain in `docs/`: `hackathon-brief.md`
(compiled, source-verified event facts) and `plans/0001-...md` (current design + the single
remaining-work table). `candidates.md` (original candidate list) was fully superseded and **deleted**
in a later pass of this session, after re-checking it line-by-line against a fresh first-party
verification sweep — nothing in it was more accurate than what's now in `plans/0001-...md` or
`hackathon-brief.md`, and it was untracked (not recoverable via git).

**A later verification pass this session** re-checked every sponsor/vendor claim against first-party
sources only (rejecting blog posts, Yahoo Finance, Capterra, Toolify, Wikipedia as verification).
Headline results: Runtype and Mitosis Labs are now independently verified (previously only
characterized secondhand); Tenki's "Firecracker microVM / sub-2s boot" claim did not survive
re-verification and was retracted (never stated on tenki.cloud itself); the hackathon page's sponsor
dollar amounts were all corrected to more precise, currently-live figures; and the "3:00 PM
Thursday" vs. "today 2026-08-27" deadline framing some earlier notes flagged as worth checking
turned out to be **fully consistent** (2026-08-27 is a Thursday) — not a real conflict.

**A live-testing pass, later still, with a real owner-provided AIsa key**: both AIsa payment surfaces
confirmed genuinely working (Bearer-key chat completions on free-tier models; the x402
no-registration path returned a real HTTP 402 challenge with real $0.008 USDC terms across 11
chains). "Private Beta" describes support/maturity, not brokenness — downgrade any earlier note
calling this an unresolved risk. Full detail in `hackathon-brief.md` and `plans/0001-...md`.

**Track decision: RESOLVED — internal chosen.** Liminal-flux idle-discovery pattern (implemented
fresh, that repo has no running code) + AIsa-metered resource spend as the real-boundary receipt for
each checkpoint + Cotal-mesh coordination + checkpoint/replay. External is kept documented as a
fallback, not deleted, since both its AIsa dependencies are confirmed working.

## What's next, in order

1. **All six verification rows (1-6) are now done — nothing left to verify, only to build.**
   Row 5 (Cotal) had a false-negative mid-session (a render timeout that was just too short) —
   corrected on retry: `/graph` is public with zero setup, and `/agents` boots a ready-to-go hosted
   agent in ~2 minutes with no local install. Full detail in plan row 5.
2. Go straight to row 7 (build) — the remaining-work table is the single source of open work, don't
   recreate a second list anywhere else.
3. Rows marked `agent` gate can be picked up and run without waiting on the owner. Rows marked
   `owner` need a human decision or external action (an email, a deadline check, a submission
   click) — an agent session should flag these clearly rather than guess past them.

## The loop (track already picked — internal)

1. Build the AIsa-receipt + checkpoint/replay pieces first (fully self-contained, already proven
   this session), then wire in Cotal via `/agents`' ~2-minute hosted-agent launch (row 5, confirmed
   working) for the live coordination-visibility layer.
2. Build the Worker + integrations (row 7). Small, testable increments — given the time pressure
   this session was under, TDD was explicitly waived for speed; if picked back up under less time
   pressure, default back to this repo's normal discipline (once one exists — no `AGENTS.md`/
   `CLAUDE.md` has been written yet either, see watch-outs below).
3. Rehearse cold (row 8) *before* it matters — "it runs, judge-triggered live" is a hard gate that
   zeroes the whole score regardless of everything else, confirmed verbatim from the event page.
4. Register/confirm team (row 9), then submit (row 10). Submission is overwrite-until-lock — submit
   something early and working, then keep improving it, rather than holding out for a "finished"
   version that might not land before the lock.

## Owner-gates (batch these, don't trickle-ask)

- **Track decision (plan row 1) — the one thing standing between this handoff and a build starting.**
  Given how little time is left today, default to picking ONE track / ONE candidate over anything
  ambitious — the "it runs, judge-triggered live" gate zeroes the score regardless of everything
  else.
- ~~Real deadline~~ — resolved: **2026-08-27, 3:00 PM PT / 10:00 PM UTC**, owner-confirmed and
  independently cross-checked against the event page's own "3:00pm Thursday, August 27" (consistent
  — 2026-08-27 is a Thursday).
- AIsa **payment-path** end-to-end test (row 3) if external — sharper than a generic "API call
  works" check: AIsa's own docs mark Circle Nanopayments/MPP/x402 as Private Beta, so this
  specifically needs to be proven live, not assumed.
- Team/registration status — genuinely unknown as of this handoff; "we got enrolled" was the only
  signal received, never disambiguated into "team exists" vs. "application approved, team still
  needed."

## Commands / access notes

- Hackathon page: `https://www.immersivecommons.com/events/hackathon` — re-fetch fresh if picking
  this up more than a few hours later; event pages like this can and do change during a live event.
- JS-rendered sponsor pages (e.g. `hack.cotal.ai`) don't render via plain fetch — use
  `uv run --directory /workspaces/qte77/polyfetch-scrape polyfetch fetch <url> --tier patchright
  --wait-until networkidle --show-body`. Chromium had to be installed once this session via
  `polyfetch doctor --fix` (~300MB download) — check it's still present before assuming this works
  cold.
- Submission web form (no token needed): `/events/hackathon/apply` off the same domain.
- Agent-driven submission (optional, not required): `npx -y @immersivecommons/cli auth --scopes
  hack:read,hack:register,hack:team,hack:submit,keys:request` — **scopes freeze at mint**, request
  everything needed up front if this path is used at all.

## Watch-outs

- **This repo has no `AGENTS.md`/`CLAUDE.md` yet** — a future session (agent or human) has no
  standing conventions to follow beyond what's in these two docs. Worth writing one once the track
  is picked and real code starts, so build discipline doesn't have to be re-derived every session.
- **`candidates.md` is gone (deleted this session)** — it predated the "no Cloudflare sponsorship"
  correction and the full AIsa/Tenki/Runtype/Mitosis Labs first-party verification pass, and was
  confirmed fully superseded before removal. `plans/0001-...md` is the current source of truth;
  there is no other doc to cross-check against.
- **Deadline is fixed and confirmed: 2026-08-27, 3:00 PM PT / 10:00 PM UTC**, and independently
  cross-checked against the event page's own "3:00pm Thursday, August 27" wording (2026-08-27 is a
  Thursday — no conflict). Still re-derive actual remaining time from the current clock each time
  work resumes — a fixed deadline doesn't save you from forgetting how much of it is already gone.
- **AIsa's payment mechanism was live-tested this session with a real, owner-provided key — both
  surfaces confirmed genuinely working** (Bearer-key chat completions on free-tier models; x402
  returned a real HTTP 402 challenge with real $0.008 USDC terms across 11 chains). Settlement
  itself was deliberately not completed — that needs a funded on-chain wallet and a human doing the
  EIP-712 signing, not an agent. **That test key is rotated/dead by the time you read this** — it
  was owner-provided, one-time, kept only in `/tmp/aisa_key.env` (never written to this repo), and
  explicitly flagged for rotation after testing. Get a fresh key before any further AIsa work.
- **Tenki's sandbox tech is no longer described as Firecracker microVMs with sub-2s boot** — that
  claim traced only to third-party blogs, not tenki.cloud itself, and was retracted. Don't repeat it
  in a demo pitch to judges as a vendor-confirmed fact.
