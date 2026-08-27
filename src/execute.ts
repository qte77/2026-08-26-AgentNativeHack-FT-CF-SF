import type { CheckResult, ExecutionResult } from "./types";

const GITHUB_API = "https://api.github.com";

function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "agent-native-hack-worker",
    "content-type": "application/json",
  };
}

// Execution: turn the decided goal into a real, visible side effect (a GitHub
// issue) instead of only recording the decision internally. This is what
// makes "goal setting" into "goal setting AND doing something about it."
export async function executeGoal(
  goal: string,
  owner: string,
  repo: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<ExecutionResult> {
  if (!token) {
    return {
      mode: "no-op",
      issueUrl: null,
      issueNumber: null,
      detail: "no GITHUB_TOKEN bound - execution skipped, goal recorded only",
    };
  }
  const title = `[idle-discovery] ${goal}`.slice(0, 250);
  const res = await fetchImpl(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({
      title,
      body:
        `Auto-proposed by the idle-discovery agent from live signals - not human-authored.\n\n` +
        `Goal: ${goal}\n\nSee the checkpoint feed for the full episode this came from.`,
    }),
  });
  if (!res.ok) {
    return {
      mode: "no-op",
      issueUrl: null,
      issueNumber: null,
      detail: `issue creation failed (HTTP ${res.status})`,
    };
  }
  const created = (await res.json()) as { html_url: string; number: number };
  return {
    mode: "live",
    issueUrl: created.html_url,
    issueNumber: created.number,
    detail: `created issue #${created.number}`,
  };
}

// Checking: read the execution back rather than trust the write response -
// confirms the side effect actually landed, not just that the API call
// returned 2xx.
export async function checkExecution(
  execution: ExecutionResult,
  owner: string,
  repo: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<CheckResult> {
  if (execution.mode === "no-op" || execution.issueNumber === null || !token) {
    return { verified: false, detail: "nothing to verify (no-op execution)" };
  }
  const res = await fetchImpl(`${GITHUB_API}/repos/${owner}/${repo}/issues/${execution.issueNumber}`, {
    headers: ghHeaders(token),
  });
  if (!res.ok) {
    return { verified: false, detail: `verification fetch failed (HTTP ${res.status})` };
  }
  const json = (await res.json()) as { state: string };
  return {
    verified: true,
    detail: `issue #${execution.issueNumber} confirmed present on GitHub, state=${json.state}`,
  };
}
