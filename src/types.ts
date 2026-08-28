export interface Env {
  CHECKPOINTS: KVNamespace;
  TARGET_REPO_OWNER: string;
  TARGET_REPO_NAME: string;
  AISA_MODEL: string;
  GITHUB_TOKEN?: string;
  AISA_API_KEY?: string;
  COTAL_TOKEN?: string;
}

export interface Signal {
  source: "github_actions" | "security_alerts" | "edit_frequency";
  summary: string;
  data: unknown;
}

export interface AisaReceipt {
  mode: "live" | "dry-run";
  model: string;
  request: unknown;
  response: unknown;
  goal: string | null;
  reasoning: string;
}

export interface GoalDecision {
  goal: string;
  source: "aisa" | "backlog_fallback";
  reasoning: string;
}

export interface CotalResult {
  mode: "live" | "no-op";
  detail: string;
}

export interface SingleTargetResult {
  mode: "live" | "existing" | "no-op";
  issueUrl: string | null;
  issueNumber: number | null;
  detail: string;
}

export interface ExecutionResult extends SingleTargetResult {
  counterparty: SingleTargetResult;
}

export interface CheckResult {
  verified: boolean;
  detail: string;
}

export interface Episode {
  id: string;
  startedAt: string;
  signals: Signal[];
  aisaReceipt: AisaReceipt;
  decision: GoalDecision;
  execution: ExecutionResult;
  check: CheckResult;
  cotal: CotalResult;
}
