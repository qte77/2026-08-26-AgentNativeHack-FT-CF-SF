import type { AisaReceipt, Signal } from "./types";

// Confirmed against AIsa's own OpenAPI spec (https://aisa.one/openapi.yaml):
// LLM inference server is https://api.aisa.one/v1, OpenAI-compatible,
// Bearer auth. qwen-flash is one of the free-tier models live-tested
// working in an earlier session (see docs/hackathon-brief.md).
const AISA_CHAT_URL = "https://api.aisa.one/v1/chat/completions";

const SYSTEM_PROMPT =
  "You monitor a software repository's health signals. Given the observed " +
  "signals, respond with ONE concrete, achievable goal in a single sentence " +
  "starting with a verb — or respond with exactly the word NONE if nothing " +
  "in the signals is actionable right now. Do not add any other text.";

function buildPrompt(signals: Signal[]): string {
  return signals.map((s) => `- [${s.source}] ${s.summary}`).join("\n");
}

function parseGoalContent(content: string): { goal: string | null; reasoning: string } {
  const trimmed = content.trim();
  if (/^none\b/i.test(trimmed)) {
    return { goal: null, reasoning: trimmed };
  }
  return { goal: trimmed.split("\n")[0], reasoning: trimmed };
}

// Deterministic, network-free fallback used when no AISA_API_KEY is bound,
// or the live call fails. Pure function of `signals` so it's replay-safe.
function dryRunDecision(
  signals: Signal[],
  model: string,
  request: unknown,
  note: string,
): AisaReceipt {
  const actionable = signals.find((s) => /failing|open \d+ .*alert/i.test(s.summary));
  const goal = actionable ? `Address: ${actionable.summary}` : null;
  const reasoning = actionable
    ? `${note}; heuristic matched signal from "${actionable.source}"`
    : `${note}; no signal matched the actionable heuristic`;
  return { mode: "dry-run", model, request, response: null, goal, reasoning };
}

export async function decideGoal(
  signals: Signal[],
  apiKey: string | undefined,
  model: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AisaReceipt> {
  const request = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(signals) },
    ],
    max_tokens: 120,
  };

  if (!apiKey) {
    return dryRunDecision(signals, model, request, "dry-run (no AISA_API_KEY bound)");
  }

  try {
    const res = await fetchImpl(AISA_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    const json = await res.json();
    if (!res.ok) {
      return dryRunDecision(signals, model, request, `AIsa call failed (HTTP ${res.status})`);
    }
    const content =
      (json as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message
        ?.content ?? "";
    const { goal, reasoning } = parseGoalContent(content);
    return { mode: "live", model, request, response: json, goal, reasoning };
  } catch (err) {
    return dryRunDecision(signals, model, request, `AIsa call threw: ${String(err)}`);
  }
}
