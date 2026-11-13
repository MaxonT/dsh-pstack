import type { BehaviorScenario } from "../types.ts";

const modules = import.meta.glob("./capabilities/*.ts", {
  eager: true,
}) as Record<string, Record<string, unknown>>;

function isBehaviorScenario(value: unknown): value is BehaviorScenario {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Partial<BehaviorScenario>;
  return (
    candidate.type === "behavior" &&
    typeof candidate.id === "string" &&
    Array.isArray(candidate.turns)
  );
}

const collected = Object.values(modules)
  .flatMap((module) => Object.values(module))
  .filter(isBehaviorScenario);

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
