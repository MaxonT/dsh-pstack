/**
 * `pstack_subagent`: pstack's delegation entry point.
 *
 * One call starts exactly one fresh child through `ctx.subagents.startActivation`.
 * The caller either passes a `provider` + `model` route, with an optional
 * `reasoningEffort`, or omits both to inherit the parent route. Fan-out belongs
 * to the caller: it starts several children by calling this tool several times
 * in one message. Results arrive as completion notices; this tool never polls.
 */

import { existsSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

import type { Agent, AgentOptions } from "@deepseek-ai/dsh-agent";
import type { Context } from "@deepseek-ai/cordis";
import type { LlmRuntime, ReasoningEffortId } from "@deepseek-ai/dsh-llm";
import type { WorkingDirectoryService } from "@deepseek-ai/dsh-working-directory";
import type {
  SubagentActivation,
  SubagentCapabilities,
  SubagentRuntime,
} from "@deepseek-ai/dsh-subagent";
import type { JsonSchemaNode, ToolDefinition, ToolRunContext } from "@deepseek-ai/dsh-tools";

import { POTETO_MODE_SKILL_PATH } from "./lib/paths.ts";

export const name = "pstack-subagent";

export const inject = ["tools", "subagents", "llm", "workingDirectory"];

export const TOOL_NAME = "pstack_subagent";

/** Default subagent backend when the row does not name one. */
export const DEFAULT_PROVIDER = "spawn";

/** Child kinds this tool can brief. */
export const AGENT_KINDS = ["poteto-agent", "comment-sicko", "readonly", "general"] as const;

export type AgentKind = (typeof AGENT_KINDS)[number];

/** Preset id for each independently composed child kind. */
const AGENT_PRESETS: Readonly<Record<Exclude<AgentKind, "general">, string>> = {
  "poteto-agent": "poteto-agent",
  "comment-sicko": "comment-sicko",
  readonly: "readonly",
};

/** Row configuration. `provider` names the subagent backend, not a model route. */
export interface PstackSubagentConfig {
  readonly provider: string;
  readonly maxDepth?: number;
}

const DEFAULT_CONFIG: PstackSubagentConfig = { provider: DEFAULT_PROVIDER };

export interface DelegationArgs {
  readonly description: string;
  readonly prompt: string;
  readonly agent: AgentKind;
  readonly provider: string | null;
  readonly model: string | null;
  readonly reasoningEffort: string | null;
  readonly cwd: string | null;
  readonly maxDepth: number | null;
}

/** One child ready to start. */
export interface DelegationPlan {
  /** Registered subagent backend that carries the child. */
  readonly backend: string;
  readonly label: string;
  readonly agent: AgentKind;
  readonly prompt: string;
  readonly routeLabel: string;
  readonly agentOptions?: AgentOptions;
  readonly agentPreset?: string;
  readonly cwd?: string;
  readonly maxDepth?: number;
}

export interface ChildRecord {
  readonly childId: string;
  readonly agent: string;
  readonly route: string;
  readonly effort?: string;
  readonly maxDepth?: number;
}

/** The live services one delegation reads. */
export interface DelegationRuntime {
  readonly subagents: SubagentRuntime;
  readonly llm: LlmRuntime;
  readonly workingDirectory: WorkingDirectoryService;
  readonly potetoModeSkillPath: string;
}

/** Validate the row's own config; omitted config uses the default backend. */
export function normalizeConfig(value: unknown): PstackSubagentConfig {
  if (value === undefined || value === null) return DEFAULT_CONFIG;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("pstack-subagent: config must be a mapping");
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key !== "provider" && key !== "maxDepth") {
      throw new Error(`pstack-subagent: unknown config field "${key}"`);
    }
  }
  const provider = record["provider"];
  if (provider !== undefined && (typeof provider !== "string" || provider.trim() === "")) {
    throw new Error("pstack-subagent: provider must be a non-empty string");
  }
  const maxDepth = record["maxDepth"];
  if (maxDepth !== undefined && !isDepth(maxDepth)) {
    throw new Error("pstack-subagent: maxDepth must be a positive safe integer");
  }
  return {
    provider: typeof provider === "string" ? provider : DEFAULT_PROVIDER,
    ...(maxDepth === undefined ? {} : { maxDepth }),
  };
}

/** Validate every model-facing argument before doing any Host call. */
export function parseDelegationArgs(raw: unknown): DelegationArgs {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("pstack_subagent arguments must be an object");
  }
  const record = raw as Record<string, unknown>;
  const known = new Set([
    "description",
    "prompt",
    "agent",
    "provider",
    "model",
    "reasoningEffort",
    "cwd",
    "maxDepth",
  ]);
  for (const key of Object.keys(record)) {
    if (!known.has(key)) throw new Error(`unknown pstack_subagent argument "${key}"`);
  }
  if (!Object.hasOwn(record, "prompt")) throw new Error('missing required argument "prompt"');

  const prompt = record["prompt"];
  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("prompt must be a non-empty string");
  }

  const description = record["description"];
  const descriptionText =
    description === undefined
      ? prompt.trim().split(/\s+/).slice(0, 5).join(" ").slice(0, 80)
      : description;
  if (typeof descriptionText !== "string" || descriptionText.trim() === "") {
    throw new Error("description must be a non-empty string when provided");
  }

  const agent = record["agent"] ?? "general";
  if (typeof agent !== "string" || !(AGENT_KINDS as readonly string[]).includes(agent)) {
    throw new Error(`agent must be one of: ${AGENT_KINDS.join(", ")}`);
  }

  const provider = record["provider"] ?? null;
  const model = record["model"] ?? null;
  if (provider !== null && (typeof provider !== "string" || provider.trim() === "")) {
    throw new Error("provider must be a non-empty string or null");
  }
  if (model !== null && (typeof model !== "string" || model.trim() === "")) {
    throw new Error("model must be a non-empty string or null");
  }
  if ((provider === null) !== (model === null)) {
    throw new Error("provider and model must be provided together, or both omitted");
  }

  const reasoningEffort = record["reasoningEffort"] ?? null;
  if (reasoningEffort !== null) {
    if (typeof reasoningEffort !== "string" || reasoningEffort.trim() === "") {
      throw new Error("reasoningEffort must be a non-empty string or null");
    }
    if (/\s/.test(reasoningEffort.trim())) {
      throw new Error("reasoningEffort must be one token, exactly as the model advertises it");
    }
  }

  const cwd = record["cwd"] ?? null;
  if (cwd !== null && (typeof cwd !== "string" || cwd.trim() === "")) {
    throw new Error("cwd must be a non-empty string or null");
  }

  const maxDepth = record["maxDepth"];
  if (maxDepth !== undefined && maxDepth !== null && !isDepth(maxDepth)) {
    throw new Error("maxDepth must be a positive safe integer or null");
  }

  return {
    description: descriptionText.trim(),
    prompt: prompt.trim(),
    agent: agent as AgentKind,
    provider: typeof provider === "string" ? provider.trim() : null,
    model: typeof model === "string" ? model.trim() : null,
    reasoningEffort: typeof reasoningEffort === "string" ? reasoningEffort.trim() : null,
    cwd: typeof cwd === "string" ? cwd.trim() : null,
    maxDepth: maxDepth === undefined ? null : (maxDepth as number | null),
  };
}

/** Resolve the child's route, preset, prompt, and depth before activation starts. */
export function planDelegation(
  args: DelegationArgs,
  runtime: DelegationRuntime,
  config: PstackSubagentConfig = DEFAULT_CONFIG,
): DelegationPlan {
  const agentPreset = args.agent === "general" ? undefined : AGENT_PRESETS[args.agent];
  const prompt =
    args.agent === "poteto-agent"
      ? injectPotetoModePath(args.prompt, runtime.potetoModeSkillPath)
      : args.prompt;
  const hostDepth = runtime.subagents.resolveMaxDepth(config.maxDepth);
  const depth = resolveChildDepth(args.maxDepth, config, hostDepth);
  const effort = args.reasoningEffort ?? undefined;
  const agentOptions = buildAgentOptions(args.provider, args.model, effort);

  return {
    backend: config.provider,
    label: args.description,
    agent: args.agent,
    prompt,
    routeLabel: formatRoute(args.provider, args.model, effort),
    ...(agentOptions === undefined ? {} : { agentOptions }),
    ...(agentPreset === undefined ? {} : { agentPreset }),
    ...(args.cwd === null ? {} : { cwd: args.cwd }),
    ...(depth === undefined ? {} : { maxDepth: depth }),
  };
}

/** Check capabilities, resolve cwd, preflight the route, then start one child. */
export async function startChild(
  parent: Agent,
  plan: DelegationPlan,
  runtime: DelegationRuntime,
  signal: AbortSignal,
): Promise<ChildRecord> {
  const provider = runtime.subagents.getProvider(plan.backend);
  if (provider === undefined) {
    const available = runtime.subagents.list();
    throw new Error(
      `subagent provider "${plan.backend}" is not registered; available providers: ${available.length === 0 ? "(none)" : available.join(", ")}`,
    );
  }

  assertCapabilities(provider.capabilities, plan);
  const sessionRoot = await runtime.workingDirectory.ensure(parent, signal);
  const cwd = plan.cwd === undefined ? undefined : resolveChildCwd(plan.cwd, sessionRoot);

  await preflightRoute(runtime.llm, plan, signal);
  signal.throwIfAborted();

  const activation = await runtime.subagents.startActivation({
    provider: plan.backend,
    label: plan.label,
    request: {
      prompt: [{ type: "text", text: plan.prompt }],
      parent,
      ...(plan.agentPreset === undefined ? {} : { agentPreset: plan.agentPreset }),
      ...(cwd === undefined ? {} : { cwd }),
      ...(plan.agentOptions === undefined ? {} : { agentOptions: plan.agentOptions }),
      ...(plan.maxDepth === undefined ? {} : { maxDepth: plan.maxDepth }),
    },
    signal,
    delivery: "parent",
  });
  return recordFor(plan, activation);
}

/** Complete delegation: plan, check, start one child. */
export async function delegate(
  parent: Agent,
  args: DelegationArgs,
  runtime: DelegationRuntime,
  config: PstackSubagentConfig,
  signal: AbortSignal,
): Promise<ChildRecord> {
  return startChild(parent, planDelegation(args, runtime, config), runtime, signal);
}

export function apply(ctx: Context, rawConfig?: unknown): void {
  const config = normalizeConfig(rawConfig);
  const runtime: DelegationRuntime = {
    subagents: ctx.subagents,
    llm: ctx.llm,
    workingDirectory: ctx.workingDirectory,
    potetoModeSkillPath: POTETO_MODE_SKILL_PATH,
  };
  ctx.tools.register(createPstackSubagentTool(runtime, config));
}

/** Build the model-facing tool. Exported for tests. */
export function createPstackSubagentTool(
  runtime: DelegationRuntime,
  config: PstackSubagentConfig = DEFAULT_CONFIG,
): ToolDefinition {
  return {
    name: TOOL_NAME,
    description: TOOL_DESCRIPTION,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        description: {
          type: "string",
          description:
            "Optional short 3-5 word label for the child; derived from the prompt when omitted.",
        },
        prompt: {
          type: "string",
          description:
            "The complete, self-contained brief. The child does not see this conversation.",
        },
        agent: {
          type: "string",
          enum: [...AGENT_KINDS],
          description:
            'Optional child preset; defaults to "general". "poteto-agent" for pstack implementation, "comment-sicko" for comment review, "readonly" for a sandbox-enforced read-only researcher.',
        },
        provider: {
          type: ["string", "null"],
          description:
            "Optional model provider; pass together with `model` to override the child route, or omit both to inherit the parent route.",
        },
        model: {
          type: ["string", "null"],
          description:
            "Optional model id; pass together with `provider` to override the child route, or omit both to inherit the parent route.",
        },
        reasoningEffort: {
          type: ["string", "null"],
          description:
            "Optional advertised reasoning-effort token; omit to keep the route's default effort.",
        },
        cwd: {
          type: ["string", "null"],
          description:
            "Optional initial child working directory; omit to inherit the session directory.",
        },
        maxDepth: {
          type: ["integer", "null"],
          minimum: 1,
          description:
            "Optional delegation-depth cap. Omit or null to use the configured row and Host cap; explicit values must be at least 1 and cannot exceed that cap.",
        },
      },
      required: ["prompt"],
    },
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => [
        { type: "text", text: renderDelegation(value as unknown as ChildRecord) },
      ],
    },
    isConcurrencySafe: () => true,
    async execute(rawArgs, exec: ToolRunContext) {
      if (exec.agent === undefined) throw new Error("pstack_subagent requires a calling Agent");
      return delegate(exec.agent, parseDelegationArgs(rawArgs), runtime, config, exec.signal);
    },
  };
}

const TOOL_DESCRIPTION = [
  "Delegate self-contained work to one subagent.",
  "",
  "Only prompt is required. Pass `provider` and `model` together, plus an optional `reasoningEffort` token the model advertises, to override the child route; omit both to inherit the parent route.",
  "",
  "One call starts one child. Fan out by calling this tool several times in one message; each call is independent.",
  "",
  "`agent` picks a DSH agent preset: `poteto-agent` mounts the pstack implementation delegate and receives the absolute path of the poteto-mode instructions; `comment-sicko` mounts the comment reviewer; `readonly` mounts a read-only research preset with the sandbox policy set to read-only; `general` joins the parent preset.",
  "",
  "Omit `cwd` to inherit the session directory. Omit `maxDepth` to use the configured row and Host delegation cap; an explicit value cannot exceed that cap.",
  "",
  "Returns the child id with its resolved route. Results arrive as a completion notice; do not poll.",
].join("\n");

const OUTPUT_SCHEMA: JsonSchemaNode = {
  type: "object",
  additionalProperties: false,
  properties: {
    childId: { type: "string" },
    agent: { type: "string" },
    route: { type: "string" },
    effort: { type: "string" },
    maxDepth: { type: "integer" },
  },
  required: ["childId", "agent", "route"],
};

function renderDelegation(child: ChildRecord): string {
  return [
    `started child ${child.childId}: agent=${child.agent} route=${child.route}${child.effort === undefined ? "" : ` effort=${child.effort}`}${child.maxDepth === undefined ? "" : ` maxDepth=${child.maxDepth}`}`,
    "The result arrives as a completion notice; do not poll for it.",
  ].join("\n");
}

function buildAgentOptions(
  provider: string | null,
  model: string | null,
  effort: string | undefined,
): AgentOptions | undefined {
  const effortOption = effort === undefined ? {} : { reasoningEffort: effort as ReasoningEffortId };
  if (provider !== null && model !== null) {
    return { provider, model, ...effortOption };
  }
  return effort === undefined ? undefined : effortOption;
}

function formatRoute(provider: string | null, model: string | null, effort?: string): string {
  const base = provider !== null && model !== null ? `${provider}/${model}` : "inherit-parent";
  return effort === undefined ? base : `${base} [${effort}]`;
}

function recordFor(plan: DelegationPlan, activation: SubagentActivation): ChildRecord {
  return {
    childId: activation.childId,
    agent: plan.agent,
    route: plan.routeLabel,
    ...(plan.agentOptions?.reasoningEffort === undefined
      ? {}
      : { effort: plan.agentOptions.reasoningEffort }),
    ...(plan.maxDepth === undefined ? {} : { maxDepth: plan.maxDepth }),
  };
}

function resolveChildDepth(
  requested: number | null,
  config: PstackSubagentConfig,
  hostLimit: number | undefined,
): number | undefined {
  const depth = requested ?? hostLimit;
  if (depth === undefined) return undefined;
  if (!Number.isSafeInteger(depth) || depth < 1) {
    throw new Error("maxDepth must be a positive safe integer or null");
  }
  if (config.maxDepth !== undefined && depth > config.maxDepth) {
    throw new Error(`maxDepth ${depth} exceeds this row's configured cap of ${config.maxDepth}`);
  }
  if (hostLimit !== undefined && depth > hostLimit) {
    throw new Error(`maxDepth ${depth} exceeds the Host delegation limit of ${hostLimit}`);
  }
  return depth;
}

function assertCapabilities(capabilities: SubagentCapabilities, plan: DelegationPlan): void {
  const missing = [
    ...(plan.agentOptions !== undefined && !capabilities.agentOptions ? ["agentOptions"] : []),
    ...(plan.agentPreset !== undefined && !capabilities.agentPreset ? ["agentPreset"] : []),
    ...(plan.maxDepth !== undefined && !capabilities.depthLimit ? ["maxDepth"] : []),
  ];
  if (missing.length > 0) {
    throw new Error(`subagent provider does not support ${missing.join(", ")}`);
  }
}

async function preflightRoute(
  llm: LlmRuntime,
  plan: DelegationPlan,
  signal: AbortSignal,
): Promise<void> {
  const options = plan.agentOptions;
  if (options === undefined || options.provider === undefined || options.model === undefined)
    return;
  try {
    await llm.resolveCallConfig(
      {
        provider: options.provider,
        model: options.model,
        ...(options.reasoningEffort === undefined
          ? {}
          : { reasoningEffort: options.reasoningEffort }),
      },
      signal,
    );
  } catch (error) {
    throw new Error(`route ${plan.routeLabel} failed route preflight: ${describeError(error)}`);
  }
}

function resolveChildCwd(requested: string, sessionRoot: string): string {
  const target = isAbsolute(requested) ? resolve(requested) : resolve(sessionRoot, requested);
  let directory = false;
  try {
    directory = statSync(target).isDirectory();
  } catch {
    directory = false;
  }
  if (!directory) throw new Error(`cwd ${target} does not exist or is not a directory`);
  if (isWithin(sessionRoot, target) || existsSync(join(target, ".git"))) return target;
  throw new Error(
    `cwd ${target} is outside the session directory (${sessionRoot}) and is not a Git worktree`,
  );
}

function isWithin(root: string, target: string): boolean {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function injectPotetoModePath(task: string, path: string): string {
  return [
    "Absolute path injected by `pstack_subagent`:",
    `- \`poteto-mode\` SKILL.md: \`${path}\``,
    "",
    "Read it directly before doing any work. Your skill catalog hides this skill, so a missing catalog entry does not mean pstack is absent.",
    "",
    "Task:",
    "",
    task,
  ].join("\n");
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isDepth(value: unknown): value is number {
  return isNonNegativeInteger(value) && value >= 1;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
