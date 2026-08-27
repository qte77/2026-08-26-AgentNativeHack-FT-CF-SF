import type { CheckResult, ExecutionResult, SingleTargetResult } from "./types";

const GITHUB_API = "https://api.github.com";

// A genuinely separate repo (same GitHub account, but independent codebase,
// history, and issue tracker) standing in for "a system this agent does not
// own." See its README for the counterparty framing.
const COUNTERPARTY_OWNER = "qte77";
const COUNTERPARTY_REPO = "2026-08-26-AgentNativeHack-FT-CF-SF-org2";

function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "agent-native-hack-worker",
    "content-type": "application/json",
  };
}

async function createIssue(
  owner: string,
  repo: string,
  goal: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<SingleTargetResult> {
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
    return { mode: "no-op", issueUrl: null, issueNumber: null, detail: `issue creation failed (HTTP ${res.status})` };
  }
  const created = (await res.json()) as { html_url: string; number: number };
  return {
    mode: "live",
    issueUrl: created.html_url,
    issueNumber: created.number,
    detail: `created issue #${created.number} on ${owner}/${repo}`,
  };
}

async function readIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  token: string,
  fetchImpl: typeof fetch,
): Promise<SingleTargetResult["detail"]> {
  const res = await fetchImpl(`${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}`, {
    headers: ghHeaders(token),
  });
  if (!res.ok) return `verification fetch failed (HTTP ${res.status}) on ${owner}/${repo}`;
  const json = (await res.json()) as { state: string };
  return `issue #${issueNumber} confirmed present on ${owner}/${repo}, state=${json.state}`;
}

// Execution: turn the decided goal into a real, visible side effect - a
// GitHub issue on this repo AND a second one on an independently-maintained
// counterparty repo - instead of only recording the decision internally.
export async function executeGoal(
  goal: string,
  owner: string,
  repo: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<ExecutionResult> {
  if (!token) {
    const noop: SingleTargetResult = {
      mode: "no-op",
      issueUrl: null,
      issueNumber: null,
      detail: "no GITHUB_TOKEN bound - execution skipped, goal recorded only",
    };
    return { ...noop, counterparty: noop };
  }
  const [self, counterparty] = await Promise.all([
    createIssue(owner, repo, goal, token, fetchImpl),
    createIssue(COUNTERPARTY_OWNER, COUNTERPARTY_REPO, goal, token, fetchImpl),
  ]);
  return { ...self, counterparty };
}

// Checking: read both executions back rather than trust the write responses -
// confirms each side effect actually landed, not just that the API calls
// returned 2xx.
export async function checkExecution(
  execution: ExecutionResult,
  owner: string,
  repo: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<CheckResult> {
  if (!token) {
    return { verified: false, detail: "nothing to verify (no-op execution)" };
  }
  const details: string[] = [];
  let anyVerified = false;

  if (execution.issueNumber !== null) {
    details.push(await readIssue(owner, repo, execution.issueNumber, token, fetchImpl));
    anyVerified = true;
  }
  if (execution.counterparty.issueNumber !== null) {
    details.push(
      await readIssue(COUNTERPARTY_OWNER, COUNTERPARTY_REPO, execution.counterparty.issueNumber, token, fetchImpl),
    );
    anyVerified = true;
  }
  if (!anyVerified) {
    return { verified: false, detail: "nothing to verify (no-op execution)" };
  }
  return { verified: true, detail: details.join("; ") };
}
