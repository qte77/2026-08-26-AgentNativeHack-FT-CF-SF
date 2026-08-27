import type { Episode } from "./types";

export function checkpointKey(id: string): string {
  return `episode:${id}`;
}

export async function writeCheckpoint(kv: KVNamespace, episode: Episode): Promise<void> {
  await kv.put(checkpointKey(episode.id), JSON.stringify(episode, null, 2));
}

export async function readCheckpoint(kv: KVNamespace, id: string): Promise<Episode | null> {
  const raw = await kv.get(checkpointKey(id));
  return raw ? (JSON.parse(raw) as Episode) : null;
}

export async function listCheckpointIds(kv: KVNamespace, limit = 20): Promise<string[]> {
  const { keys } = await kv.list({ prefix: "episode:", limit });
  return keys.map((k) => k.name.replace(/^episode:/, ""));
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
    `Cotal coordination: mode=${episode.cotal.mode}`,
    `  ${episode.cotal.detail}`,
  ];
  return lines.join("\n");
}
