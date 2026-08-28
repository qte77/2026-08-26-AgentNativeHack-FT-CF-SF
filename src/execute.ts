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

// A 2xx response with a non-JSON body must not throw unhandled - every step
// here is supposed to degrade to a documented no-op, matching the pattern
// already used in signals.ts's safeGet and aisa.ts's decideGoal.
async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// The AIsa decision call is stateless (no memory of prior episodes - see
// README), so on a quiet repo it keeps re-proposing the same underlying
// observation in different words. Without this check, every episode opened
// a fresh issue regardless (confirmed live: 20+ near-duplicates piled up).
// Dedup on the fixed "[idle-discovery]" prefix, not the paraphrased goal
// text, since exact-title matching would miss the wording variance.
async function findOpenIdleDiscoveryIssue(
  owner: string,
  repo: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<SingleTargetResult | null> {
  const q = encodeURIComponent(`repo:${owner}/${repo} is:issue is:open in:title "[idle-discovery]"`);
  const res = await fetchImpl(`${GITHUB_API}/search/issues?q=${q}`, { headers: ghHeaders(token) });
  if (!res.ok) return null;
  const json = await safeJson<{ items?: Array<{ html_url: string; number: number }> }>(res);
  const existing = json?.items?.[0];
  if (!existing) return null;
  return {
    mode: "existing",
    issueUrl: existing.html_url,
    issueNumber: existing.number,
    detail: `reused already-open issue #${existing.number} on ${owner}/${repo} instead of piling up a duplicate`,
  };
}

async function createIssue(
  owner: string,
  repo: string,
  goal: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<SingleTargetResult> {
  const existing = await findOpenIdleDiscoveryIssue(owner, repo, token, fetchImpl);
  if (existing) return existing;

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
  const created = await safeJson<{ html_url: string; number: number }>(res);
  if (!created) {
    return { mode: "no-op", issueUrl: null, issueNumber: null, detail: `issue response not valid JSON on ${owner}/${repo}` };
  }
  return {
    mode: "live",
    issueUrl: created.html_url,
    issueNumber: created.number,
    detail: `created issue #${created.number} on ${owner}/${repo}`,
  };
}

function toBase64Utf8(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

// Commits an actual file to the counterparty repo (not just an issue) - real,
// browsable file-tree content, one file per episode, under requests/.
async function commitRequestFile(
  owner: string,
  repo: string,
  episodeId: string,
  goal: string,
  issueUrl: string | null,
  token: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  const path = `requests/${episodeId}.md`;
  const body = [
    `# Request from idle-discovery episode ${episodeId}`,
    "",
    `Goal: ${goal}`,
    "",
    issueUrl ? `Issue opened here: ${issueUrl}` : "",
    `Source: https://github.com/qte77/2026-08-26-AgentNativeHack-FT-CF-SF`,
  ]
    .filter(Boolean)
    .join("\n");
  const res = await fetchImpl(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: ghHeaders(token),
    body: JSON.stringify({
      message: `Request from episode ${episodeId}`,
      content: toBase64Utf8(body),
    }),
  });
  if (!res.ok) return `file commit failed (HTTP ${res.status}) on ${owner}/${repo}/${path}`;
  return `committed ${path} on ${owner}/${repo}`;
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
  const json = await safeJson<{ state: string }>(res);
  if (!json) return `verification response not valid JSON on ${owner}/${repo}`;
  return `issue #${issueNumber} confirmed present on ${owner}/${repo}, state=${json.state}`;
}

// Execution: turn the decided goal into a real, visible side effect - a
// GitHub issue on this repo AND a second one on an independently-maintained
// counterparty repo - instead of only recording the decision internally.
export async function executeGoal(
  episodeId: string,
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
  const fileDetail = await commitRequestFile(
    COUNTERPARTY_OWNER,
    COUNTERPARTY_REPO,
    episodeId,
    goal,
    counterparty.issueUrl,
    token,
    fetchImpl,
  );
  return { ...self, counterparty: { ...counterparty, detail: `${counterparty.detail}; ${fileDetail}` } };
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
