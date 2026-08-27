import type { Episode } from "./types";

// Keyed as episode:<startedAt-ISO>|<id> so KV's lexicographic key ordering
// is also chronological order - UUIDs alone sort randomly, which silently
// broke "most recent" ordering in /checkpoints (caught by live E2E check).
export function checkpointKey(id: string, startedAt: string): string {
  return `episode:${startedAt}|${id}`;
}

export async function writeCheckpoint(kv: KVNamespace, episode: Episode): Promise<void> {
  await kv.put(checkpointKey(episode.id, episode.startedAt), JSON.stringify(episode, null, 2));
}

export async function readCheckpoint(kv: KVNamespace, id: string): Promise<Episode | null> {
  const { keys } = await kv.list({ prefix: "episode:" });
  const match = keys.find((k) => k.name.endsWith(`|${id}`));
  if (!match) return null;
  const raw = await kv.get(match.name);
  return raw ? (JSON.parse(raw) as Episode) : null;
}

export async function listCheckpointIds(kv: KVNamespace, limit = 20): Promise<string[]> {
  const { keys } = await kv.list({ prefix: "episode:" });
  const sortedNames = keys.map((k) => k.name).sort();
  return sortedNames.slice(-limit).map((name) => name.slice(name.indexOf("|") + 1));
}

// Pure function of a committed Episode - no network, no clock, no randomness.
// Used both for the live checkpoint response and for `npm run replay`, so a
// committed checkpoint reproduces byte-for-byte offline. This is the "it
// runs" gate's offline half; the live Worker trigger is the online half.
export function renderEpisode(episode: Episode): string {
  const lines = [
    `Episode ${episode.id} (started ${episode.startedAt})`,
    "",
    "Signals observed:",
    ...episode.signals.map((s) => `  - [${s.source}] ${s.summary}`),
    "",
    `AIsa decision (mode=${episode.aisaReceipt.mode}, model=${episode.aisaReceipt.model}):`,
    `  goal: ${episode.aisaReceipt.goal ?? "NONE"}`,
    `  reasoning: ${episode.aisaReceipt.reasoning}`,
    "",
    `Final decision: ${episode.decision.goal}`,
    `  source: ${episode.decision.source}`,
    `  reasoning: ${episode.decision.reasoning}`,
    "",
    `Execution: mode=${episode.execution.mode}`,
    `  ${episode.execution.detail}`,
    `  counterparty (org2): mode=${episode.execution.counterparty.mode}`,
    `    ${episode.execution.counterparty.detail}`,
    `Check: verified=${episode.check.verified}`,
    `  ${episode.check.detail}`,
    "",
    `Cotal coordination: mode=${episode.cotal.mode}`,
    `  ${episode.cotal.detail}`,
  ];
  return lines.join("\n");
}
