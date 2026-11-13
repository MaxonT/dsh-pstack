import { existsSync } from "node:fs";
import { join } from "node:path";

import { SKILL_TOOL_NAMES } from "../../types.ts";
import type {
  BehaviorScenario,
  DependencyAnalysis,
  Phase,
  SessionAnalysis,
  SessionFacts,
  SkillLoadPath,
  ToolAttemptAnalysis,
} from "../../types.ts";
import { REPOSITORY_ROOT } from "./run-metadata.ts";

const SKILL_TOOLS = new Set<string>(SKILL_TOOL_NAMES);

function skillDirs(name: string, phase: Phase): string[] {
  const paths = [join(REPOSITORY_ROOT, "playground/raw/pstack/skills", name, "SKILL.md")];
  if (phase === "adapted") {
    paths.push(
      join(REPOSITORY_ROOT, "pstack/skills", name, "SKILL.md"),
      join(REPOSITORY_ROOT, "skills/.agents/skills", name, "SKILL.md"),
    );
  }
  return paths;
}

function dependencyAnalysis(
  scenario: BehaviorScenario,
  session: SessionFacts,
  phase: Phase,
): DependencyAnalysis[] {
  return (scenario.dependencies ?? []).map((name) => {
    const available = skillDirs(name, phase).some((path) => existsSync(path));
    const loaded =
      session.skillLoads.some((entry) => entry.split("#")[0] === name) ||
      session.toolCalls.some(
        (call) =>
          call.name === "read" &&
          call.argsSummary.includes(`skills/${name}/SKILL.md`) &&
          call.status === "ok",
      );
    return { name, available, loaded, fallback: null };
  });
}

function toolAnalysis(session: SessionFacts): ToolAttemptAnalysis[] {
  const grouped = new Map<string, ToolAttemptAnalysis>();
  for (const call of session.toolCalls) {
    const current = grouped.get(call.name) ?? {
      name: call.name,
      attempts: 0,
      failures: 0,
      finalStatus: "pending" as const,
    };
    current.attempts += 1;
    if (call.status === "error") current.failures += 1;
    current.finalStatus = call.status === "error" ? "error" : "ok";
    grouped.set(call.name, current);
  }
  return [...grouped.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function invocationAnalysis(
  scenario: BehaviorScenario,
  session: SessionFacts,
  phase: Phase,
): { loadedVia: SkillLoadPath; attempts: number; errors: string[] } {
  const requested = scenario.skill;
  const skillTools = phase === "raw" ? new Set<string>(["skill"]) : SKILL_TOOLS;
  const matching = session.toolCalls.filter(
    (call) =>
      (skillTools.has(call.name) && call.argsSummary.includes(requested)) ||
      (call.name === "read" && call.argsSummary.includes(`skills/${requested}/SKILL.md`)),
  );
  const errors = matching
    .map((call) => call.errorText)
    .filter((text): text is string => typeof text === "string" && text.length > 0);
  const loadedEntry = session.skillLoads.find((entry) => entry.split("#")[0] === requested);
  if (loadedEntry) {
    if (loadedEntry.endsWith("#user-gesture")) {
      return { loadedVia: "user-gesture", attempts: matching.length, errors };
    }
    const viaPstack = phase === "adapted" && matching.some((call) => call.name === "pstack_skill");
    return { loadedVia: viaPstack ? "pstack_skill" : "skill", attempts: matching.length, errors };
  }
  if (matching.some((call) => call.name === "read" && call.status === "ok")) {
    return { loadedVia: "read", attempts: matching.length, errors };
  }
  return { loadedVia: "none", attempts: matching.length, errors };
}

export function analyzeSession(
  scenario: BehaviorScenario,
  session: SessionFacts,
  phase: Phase,
): SessionAnalysis {
  const invocation = invocationAnalysis(scenario, session, phase);
  const dependencies = dependencyAnalysis(scenario, session, phase);
  const tools = toolAnalysis(session);
  const warnings: string[] = [];
  if (invocation.loadedVia === "none") warnings.push(`skill ${scenario.skill} was not loaded`);
  for (const dependency of dependencies) {
    if (!dependency.available) warnings.push(`dependency ${dependency.name} is unavailable`);
    else if (!dependency.loaded) warnings.push(`dependency ${dependency.name} was not loaded`);
  }
  for (const tool of tools) {
    if (tool.attempts > 1 && tool.failures > 0) {
      warnings.push(`${tool.name} needed ${tool.attempts} attempts with ${tool.failures} failures`);
    }
  }
  return {
    skillInvocation: { requested: scenario.skill, ...invocation },
    dependencies,
    tools,
    userGesture: session.userTexts.some((text) => text.includes(`/${scenario.skill}`)),
    artifacts: session.toolCalls
      .filter((call) => call.name === "write" || call.name === "edit")
      .map((call) => call.argsSummary)
      .slice(0, 20),
    warnings,
  };
}
