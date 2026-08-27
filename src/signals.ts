import type { Signal } from "./types";

const GITHUB_API = "https://api.github.com";

function ghHeaders(token: string | undefined): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "agent-native-hack-worker",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function safeGet(
  url: string,
  token: string | undefined,
  fetchImpl: typeof fetch,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetchImpl(url, { headers: ghHeaders(token) });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json };
}

// Signal 1: recent GitHub Actions run status on the target repo.
export async function fetchActionsSignal(
  owner: string,
  repo: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<Signal> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/actions/runs?per_page=5`;
  const { ok, status, json } = await safeGet(url, token, fetchImpl);
  if (!ok) {
    return {
      source: "github_actions",
      summary: `unavailable (HTTP ${status})`,
      data: null,
    };
  }
  const runs = (json as { workflow_runs?: Array<{ status: string; conclusion: string | null; name: string }> })
    .workflow_runs ?? [];
  const failing = runs.filter((r) => r.conclusion === "failure");
  const summary =
    runs.length === 0
      ? "no workflow runs recorded"
      : failing.length > 0
        ? `${failing.length}/${runs.length} recent runs failing (${failing.map((r) => r.name).join(", ")})`
        : `${runs.length} recent runs, all passing/in-progress`;
  return { source: "github_actions", summary, data: runs };
}

// Signal 2: open Dependabot / vulnerability alerts on the target repo.
export async function fetchSecurityAlertsSignal(
  owner: string,
  repo: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<Signal> {
  if (!token) {
    return {
      source: "security_alerts",
      summary: "unavailable (no GITHUB_TOKEN bound)",
      data: null,
    };
  }
  const url = `${GITHUB_API}/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=10`;
  const { ok, status, json } = await safeGet(url, token, fetchImpl);
  if (!ok) {
    return {
      source: "security_alerts",
      summary: `unavailable (HTTP ${status})`,
      data: null,
    };
  }
  const alerts = (json as Array<{ security_advisory?: { summary?: string } }>) ?? [];
  const summary =
    alerts.length === 0
      ? "no open Dependabot alerts"
      : `${alerts.length} open Dependabot alert(s): ${alerts
          .slice(0, 3)
          .map((a) => a.security_advisory?.summary ?? "unnamed")
          .join("; ")}`;
  return { source: "security_alerts", summary, data: alerts };
}

// Signal 3: unusually high recent edit frequency on one file/directory,
// bounded to the last 10 commits (a small, known set, not open-ended history).
export async function fetchEditFrequencySignal(
  owner: string,
  repo: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<Signal> {
  const listUrl = `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=10`;
  const list = await safeGet(listUrl, token, fetchImpl);
  if (!list.ok) {
    return {
      source: "edit_frequency",
      summary: `unavailable (HTTP ${list.status})`,
      data: null,
    };
  }
  const commits = (list.json as Array<{ sha: string }>) ?? [];
  const counts = new Map<string, number>();
  for (const c of commits) {
    const detail = await safeGet(
      `${GITHUB_API}/repos/${owner}/${repo}/commits/${c.sha}`,
      token,
      fetchImpl,
    );
    if (!detail.ok) continue;
    const files = (detail.json as { files?: Array<{ filename: string }> }).files ?? [];
    for (const f of files) {
      const dir = f.filename.includes("/") ? f.filename.split("/")[0] : f.filename;
      counts.set(dir, (counts.get(dir) ?? 0) + 1);
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const summary =
    sorted.length === 0
      ? "no recent file-level edit data"
      : `hottest path in last ${commits.length} commits: "${sorted[0][0]}" (${sorted[0][1]} touches)`;
  return { source: "edit_frequency", summary, data: sorted };
}

export async function collectSignals(
  owner: string,
  repo: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<Signal[]> {
  return Promise.all([
    fetchActionsSignal(owner, repo, token, fetchImpl),
    fetchSecurityAlertsSignal(owner, repo, token, fetchImpl),
    fetchEditFrequencySignal(owner, repo, token, fetchImpl),
  ]);
}
