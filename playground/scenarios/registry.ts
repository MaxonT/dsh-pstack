import type { BehaviorScenario } from "../types.ts";
import { environments } from "./environments.ts";

const modules = import.meta.glob("./*/*.ts", {
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

const environmentIds = new Set([
  "capabilities",
  ...environments.map((environment) => environment.id),
]);

function environmentOf(path: string): string {
  const directory = path.split("/")[1] ?? "";
  if (!environmentIds.has(directory)) {
    throw new Error(`scenario file is in unknown environment directory: ${path}`);
  }
  return directory === "capabilities" ? "base" : directory;
}

const collected = Object.entries(modules).flatMap(([path, module]) => {
  const environmentId = environmentOf(path);
  return Object.values(module)
    .filter(isBehaviorScenario)
    .map((scenario) => {
      if (scenario.environmentId !== undefined && scenario.environmentId !== environmentId) {
        throw new Error(
          `scenario ${scenario.id} declares ${scenario.environmentId}, but lives in ${environmentId}`,
        );
      }
      return { ...scenario, environmentId };
    });
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
