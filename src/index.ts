import { runEpisode } from "./episode";
import { writeCheckpoint, readCheckpoint, listCheckpointIds, renderEpisode } from "./checkpoint";
import type { Env } from "./types";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const AGENT_CARD = {
  name: "agent-native-hack-idle-discovery",
  description:
    "Internal-track submission: an agent that wakes with no queued task, self-selects one goal " +
    "from bounded live signals via an AIsa-metered call, coordinates over the Cotal mesh, and " +
    "checkpoints every episode for offline replay.",
  agent_surface: "HTTP API",
  endpoints: {
    trigger: "/trigger",
    checkpoints: "/checkpoints",
    checkpoint_by_id: "/checkpoints/{id}",
  },
  track: "internal",
  repo: "https://github.com/qte77/2026-08-26-AgentNativeHack-FT-CF-SF",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/.well-known/ai-agent.json") {
      return json(AGENT_CARD);
    }

    if (url.pathname === "/" ) {
      return json({
        ...AGENT_CARD,
        hint: "GET or POST /trigger to run one live episode. It runs the real signal-collection, " +
          "AIsa-decision, and checkpoint-write path - judge-triggerable, no hand-holding.",
      });
    }

    if (url.pathname === "/trigger" && (request.method === "GET" || request.method === "POST")) {
      const id = crypto.randomUUID();
      const startedAt = new Date().toISOString();
      const episode = await runEpisode({ id, startedAt, env });
      await writeCheckpoint(env.CHECKPOINTS, episode);
      return json({ episode, rendered: renderEpisode(episode) });
    }

    if (url.pathname === "/checkpoints" && request.method === "GET") {
      const ids = await listCheckpointIds(env.CHECKPOINTS);
      return json({ ids });
    }

    const checkpointMatch = url.pathname.match(/^\/checkpoints\/([^/]+)$/);
    if (checkpointMatch && request.method === "GET") {
      const episode = await readCheckpoint(env.CHECKPOINTS, checkpointMatch[1]);
      if (!episode) return json({ error: "not found" }, 404);
      return json({ episode, rendered: renderEpisode(episode) });
    }

    return json({ error: "not found", hint: "see /.well-known/ai-agent.json" }, 404);
  },
};
