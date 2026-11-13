export const PHASES = ["raw", "adapted"] as const;
export type Phase = (typeof PHASES)[number];

export function isPhase(value: unknown): value is Phase {
  return typeof value === "string" && PHASES.some((phase) => phase === value);
}

export interface TestTarget {
  provider: string;
  model: string;
  effort: string;
}

export interface ProviderAllowance {
  apiKey: string;
  models: Record<string, string[]>;
}

export interface PlaygroundConfig {
  testModel: TestTarget;
  providers: Record<string, ProviderAllowance>;
  roleModels?: Record<string, TestTarget>;
  hostPatchFile?: string;
  credentialsFile?: string;
}

export type AllowedRoute = TestTarget & {
  efforts: string[];
  apiKey: string;
};

export type Assertion =
  | { kind: "turn-completed" }
  | { kind: "skill-loaded"; skill: string }
  | { kind: "no-tool-error" }
  | { kind: "artifact-contains"; path: string; text: string }
  | { kind: "artifact-dir-nonempty"; path: string }
  | { kind: "assistant-contains"; text: string };

export interface WorkspaceFixture {
  files: Record<string, string>;
}

export interface SemanticRubric {
  prompt: string;
}

export interface UiObservation {
  id: string;
  description: string;
}

export interface BehaviorScenario {
  id: string;
  turns: Array<{ prompt: string }>;
  workspace: WorkspaceFixture;
  assertions: Assertion[];
  rubric: SemanticRubric;
  uiObservations: UiObservation[];
  /** Phases this probe is allowed to run in; omitted means both raw and adapted. */
  phases?: readonly Phase[];
  environmentId?: string;
  answers?: Array<{ match: string; selected?: string[]; custom?: string }>;
  /** Capability id this probe covers. */
  capability: string;
}

export type EnvironmentKind = "base" | "capability" | "conflict";

export interface EnvironmentMatrix {
  id: string;
  /** Why this environment exists. Written in Chinese. */
  description: string;
  kind: EnvironmentKind;
  enabledPluginPackages: string[];
  /** Package names force-loaded despite a peer/runtime version mismatch. */
  versionExemptions?: string[];
}

export interface RunEnvironment {
  worker: number;
  dshVersion: string;
  adaptedVersion: string | null;
  matrix: EnvironmentMatrix;
  upstreamRevision: string;
  configHash: string;
}

export type ToolCallStatus = "pending" | "ok" | "error";

export interface ToolCallEvidence {
  name: string;
  status: ToolCallStatus;
  /**
   * Tool name plus its whitelisted audit arguments, capped at 200 characters. Only
   * listed keys (paths, commands, patterns, targets) are copied, so credentials and
   * payload parameters never reach the record.
   */
  argsSummary: string;
  errorText?: string;
}

export const SKILL_TOOL_NAMES = ["skill", "pstack_skill", "pstack-skill"] as const;
export interface ToolAttemptAnalysis {
  name: string;
  attempts: number;
  failures: number;
  finalStatus: "ok" | "error" | "pending";
}

export interface SessionAnalysis {
  tools: ToolAttemptAnalysis[];
  artifacts: string[];
  warnings: string[];
}

export interface SessionFacts {
  sessionId: string;
  sessionFile: string;
  workspacePath: string | null;
  agentPreset: string | null;
  skillLoads: string[];
  toolCalls: ToolCallEvidence[];
  turnEndReason: string | null;
  assistantText: string;
  userText: string;
  /** Every user-authored turn text in order; userText stays the first one for the entry check. */
  userTexts: string[];
  autoAnswers: Array<{ question: string; answer: string }>;
  analysis?: SessionAnalysis;
}

export interface ArtifactEvidence {
  recordFile: string;
  screenshotFile?: string;
  observed: string[];
}

export const SEMANTIC_REVIEW_STATUSES = ["supported", "gap", "inconclusive"] as const;
export type SemanticReviewStatus = (typeof SEMANTIC_REVIEW_STATUSES)[number];

export type SemanticReview =
  | { status: "pending"; reason: string }
  | {
      status: SemanticReviewStatus;
      reason: string;
      reviewer: { kind: "model"; route: TestTarget } | { kind: "human"; name: string };
    };

export const VERDICT_STATUSES = [
  "observed",
  "gap",
  "blocked",
  "unobserved",
  "verified",
  "not-verified",
  "inconclusive",
] as const;

export type Verdict =
  | { phase: "raw"; status: "observed"; gaps: string[] }
  | { phase: "raw"; status: "gap"; gaps: string[] }
  | { phase: "raw"; status: "blocked"; reason: string }
  | { phase: "raw"; status: "unobserved"; reason: string }
  | { phase: "adapted"; status: "verified" }
  | { phase: "adapted"; status: "not-verified"; failures: string[] }
  /** A conflict regression whose expected startup conflict reproduced: blocked by design. */
  | { phase: "adapted"; status: "blocked"; reason: string }
  | { phase: "adapted"; status: "inconclusive"; reason: string };

export interface RunRecord {
  scenarioId: string;
  phase: Phase;
  environment: RunEnvironment;
  target: TestTarget | null;
  session: SessionFacts | null;
  artifacts: ArtifactEvidence;
  semanticReview: SemanticReview;
  /**
   * Every mechanical check result at capture time (assertions, workspace, entry, route).
   * Always recorded: an unobserved or inconclusive verdict must not hide them, and a
   * review revision must not launder them. Records written before this field existed
   * lack it on disk.
   */
  mechanicalFailures: string[];
  verdict: Verdict;
  capturedAt: string;
  /** Batch that produced this record; optional on records written before current snapshots. */
  batchId?: string;
}
