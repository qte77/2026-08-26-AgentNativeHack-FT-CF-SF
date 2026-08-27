import { runEpisode } from "./episode";
import { writeCheckpoint, renderEpisode } from "./checkpoint";
import type { Env } from "./types";

// Minimal MCP server (JSON-RPC 2.0 over plain HTTP) so other agents can plug
// into this build directly, not just judges clicking a button. One tool:
// running a live idle-discovery episode.
const TOOLS = [
  {
    name: "run_idle_discovery_episode",
    description:
      "Run one live idle-discovery episode: read bounded signals from this repo " +
      "(CI status, security alerts, edit-hotspot), ask AIsa for one goal or NONE, " +
      "checkpoint the result, and return the rendered episode.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

function rpcResult(id: unknown, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

function rpcError(id: unknown, code: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), {
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

export async function handleMcp(request: Request, env: Env): Promise<Response> {
  let body: { id?: unknown; method?: string; params?: { name?: string } };
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }
  const { id, method, params } = body;

  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: "2026-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "idle-discovery-agent", version: "0.1.0" },
    });
  }
  if (method === "notifications/initialized") {
    return new Response(null, { status: 202 });
  }
  if (method === "tools/list") {
    return rpcResult(id, { tools: TOOLS });
  }
  if (method === "tools/call") {
    const name = params?.name;
    if (name !== "run_idle_discovery_episode") {
      return rpcError(id, -32602, `Unknown tool: ${String(name)}`);
    }
    const episodeId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const episode = await runEpisode({ id: episodeId, startedAt, env });
    await writeCheckpoint(env.CHECKPOINTS, episode);
    return rpcResult(id, { content: [{ type: "text", text: renderEpisode(episode) }] });
  }
  return rpcError(id, -32601, `Method not found: ${method}`);
}
