import { collectSignals } from "./signals";
import { decideGoal } from "./aisa";
import { publishToMesh } from "./cotal";
import { fallbackGoalFromPlan } from "./backlog";
import { executeGoal, checkExecution } from "./execute";
import type { Env, Episode, GoalDecision } from "./types";

export interface RunEpisodeParams {
  id: string;
  startedAt: string;
  env: Env;
  fetchImpl?: typeof fetch;
}

// One idle-discovery episode: observe bounded live signals, ask AIsa for ONE
// goal (or NONE), fall back to this project's own open-work table when
// nothing is actionable, then attempt mesh coordination. Every step degrades
// to a documented no-op instead of throwing, so the loop always completes.
export async function runEpisode({ id, startedAt, env, fetchImpl = fetch }: RunEpisodeParams): Promise<Episode> {
  const signals = await collectSignals(
    env.TARGET_REPO_OWNER,
    env.TARGET_REPO_NAME,
    env.GITHUB_TOKEN,
    fetchImpl,
  );

  const aisaReceipt = await decideGoal(signals, env.AISA_API_KEY, env.AISA_MODEL, fetchImpl);

  let decision: GoalDecision;
  if (aisaReceipt.goal) {
    decision = { goal: aisaReceipt.goal, source: "aisa", reasoning: aisaReceipt.reasoning };
  } else {
    const fallbackGoal = await fallbackGoalFromPlan(
      env.TARGET_REPO_OWNER,
      env.TARGET_REPO_NAME,
      env.GITHUB_TOKEN,
      fetchImpl,
    );
    decision = {
      goal: fallbackGoal,
      source: "backlog_fallback",
      reasoning:
        "no live signal was actionable (a designed branch, not a failure) - falling back to " +
        "the next open row in this project's own remaining-work table",
    };
  }

  const execution = await executeGoal(
    id,
    decision.goal,
    env.TARGET_REPO_OWNER,
    env.TARGET_REPO_NAME,
    env.GITHUB_TOKEN,
    fetchImpl,
  );
  const check = await checkExecution(
    execution,
    env.TARGET_REPO_OWNER,
    env.TARGET_REPO_NAME,
    env.GITHUB_TOKEN,
    fetchImpl,
  );

  const cotal = await publishToMesh(env.COTAL_TOKEN);

  return { id, startedAt, signals, aisaReceipt, decision, execution, check, cotal };
}
