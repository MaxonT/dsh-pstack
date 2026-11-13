export const PHASES = ["raw", "adapted"] as const;
export type Phase = (typeof PHASES)[number];

export function isPhase(value: unknown): value is Phase {
  return typeof value === "string" && (PHASES as readonly string[]).includes(value);
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

export interface PreparedEnv {
  phase: Phase;
  home: string;
  browserHome: string;
  port: number;
  url: string;
  workspaceDirs: Record<string, string>;
}

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

export interface ScenarioSource {
  upstreamSkill: string;
  regression?: string;
}

export const SCENARIO_GROUPS = [
  "skills",
  "playbooks",
  "official-plugins",
  "runtime-tools",
  "capabilities",
] as const;
export type ScenarioGroup = (typeof SCENARIO_GROUPS)[number];
export const SCENARIO_GROUP_PHASES: Record<ScenarioGroup, readonly Phase[]> = {
  skills: ["raw", "adapted"],
  playbooks: ["raw", "adapted"],
  "official-plugins": ["adapted"],
  "runtime-tools": ["adapted"],
  capabilities: ["raw", "adapted"],
};

export interface BehaviorScenario {
  type: "behavior";
  id: string;
  skill: string;
  turns: Array<{ prompt: string }>;
  workspace: WorkspaceFixture;
  assertions: Assertion[];
  rubric: SemanticRubric;
  uiObservations: UiObservation[];
  source: ScenarioSource;
  environmentId?: string;
  answers?: Array<{ match: string; selected?: string[]; custom?: string }>;
  /** Set by the registry from the directory name. */
  group?: ScenarioGroup;
  /** Upstream playbook filename stem for playbook scenarios. */
  playbook?: string;
  /** Official plugin package id for official-plugin scenarios. */
  plugin?: string;
  /** Environments a plugin scenario runs in; omitted means base only. */
  environments?: string[];
  /** Skill names the scenario should observe for availability and loading. */
  dependencies?: string[];
}

export type Scenario = BehaviorScenario;

export function isOfficialPluginScenario(scenario: Pick<BehaviorScenario, "plugin">): boolean {
  return scenario.plugin !== undefined;
}

export interface Exclusion {
  id: string;
  skill: string;
  reason: string;
  evidence: string;
}

export interface EnvironmentMatrix {
  id: string;
  enabledPluginPackages: string[];
  /**
   * Plugin packages force-loaded despite a peer/runtime version mismatch. Two fixtures need
   * this: `session-search`, whose experimental plugin pins session-query packages the runtime
   * does not satisfy, and `agent-team`, whose experimental Agent Teams plugins declare
   * a peer range the pinned dsh runtime does not satisfy. The loader disables those rows unless
   * the exact package@version is exempted for this runtime. `prepare` reads the installed
   * version and the actual runtime version to grant each exemption.
   */
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

export interface ToolCallEvidence {
  name: string;
  status: string;
  /**
   * Tool name plus its whitelisted audit arguments, capped at 200 characters. Only
   * listed keys (paths, commands, patterns, targets) are copied, so credentials and
   * payload parameters never reach the record.
   */
  argsSummary: string;
  errorText?: string;
}

export const SKILL_TOOL_NAMES = ["skill", "pstack_skill", "pstack-skill"] as const;
export type SkillLoadPath = "skill" | "pstack_skill" | "read" | "user-gesture" | "none";

export interface SkillInvocationAnalysis {
  requested: string;
  loadedVia: SkillLoadPath;
  attempts: number;
  errors: string[];
}

export interface DependencyAnalysis {
  name: string;
  available: boolean;
  loaded: boolean;
  fallback: string | null;
}

export interface ToolAttemptAnalysis {
  name: string;
  attempts: number;
  failures: number;
  finalStatus: "ok" | "error" | "pending";
}

export interface SessionAnalysis {
  skillInvocation: SkillInvocationAnalysis;
  dependencies: DependencyAnalysis[];
  tools: ToolAttemptAnalysis[];
  userGesture: boolean;
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
