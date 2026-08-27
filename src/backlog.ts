// Fallback goal source when live signals yield NONE: the next open row in
// this project's own remaining-work table (the single source of open work
// per docs/plans/0001-agent-native-hackathon-submission.md). A real branch,
// not a crash — see docs/plans/0001-... for the design rationale.

const PLAN_PATH = "docs/plans/0001-agent-native-hackathon-submission.md";

export async function fallbackGoalFromPlan(
  owner: string,
  repo: string,
  token: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${PLAN_PATH}`;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetchImpl(url, { headers });
  if (!res.ok) {
    return `review the open rows in ${PLAN_PATH} (fallback fetch returned HTTP ${res.status})`;
  }
  const text = await res.text();
  for (const line of text.split("\n")) {
    if (!line.startsWith("|") || line.startsWith("|---")) continue;
    const cells = line.split("|").map((c) => c.trim());
    // | # | Item | Gate | Done-when |  ->  ["", "#", "Item", "Gate", "Done-when", ""]
    const num = cells[1];
    const item = cells[2];
    if (!num || !item || num === "#") continue;
    if (num.startsWith("~~")) continue; // already struck through = shipped
    return item;
  }
  return `no open rows found in ${PLAN_PATH}`;
}
