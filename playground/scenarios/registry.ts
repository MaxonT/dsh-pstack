import { SCENARIO_GROUPS } from "../types.ts";
import type { BehaviorScenario, ScenarioGroup } from "../types.ts";

const modules = import.meta.glob("./*/*.ts", {
  eager: true,
}) as Record<string, Record<string, unknown>>;

function isBehaviorScenario(value: unknown): value is BehaviorScenario {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Partial<BehaviorScenario>;
  return (
    candidate.type === "behavior" &&
    typeof candidate.id === "string" &&
    typeof candidate.skill === "string" &&
    Array.isArray(candidate.turns)
  );
}

function groupOf(path: string): ScenarioGroup {
  const group = SCENARIO_GROUPS.find((name) => path.includes(`/${name}/`));
  if (group === undefined) throw new Error(`scenario file is outside a known group: ${path}`);
  return group;
}

const collected = Object.entries(modules).flatMap(([path, module]) => {
  const group = groupOf(path);
  return Object.values(module)
    .filter(isBehaviorScenario)
    .map((scenario) => ({ ...scenario, group }));
});

const duplicates = collected
  .map((scenario) => scenario.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicates.length > 0) throw new Error(`duplicate scenario ids: ${duplicates.join(", ")}`);

export const behaviorScenarios: readonly BehaviorScenario[] = collected;
export const scenariosById = new Map(behaviorScenarios.map((scenario) => [scenario.id, scenario]));

export function behaviorScenario(id: string): BehaviorScenario {
  const scenario = scenariosById.get(id);
  if (!scenario) throw new Error(`unknown scenario: ${id}`);
  return scenario;
}

export function reviewScenarioIds(): string[] {
  return behaviorScenarios.map((scenario) => scenario.id);
}
