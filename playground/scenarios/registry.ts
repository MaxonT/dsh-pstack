import type { BehaviorScenario } from "../types.ts";
import { environments } from "./environments.ts";

const modules = import.meta.glob<{ default: BehaviorScenario }>("./*/*.ts", {
  eager: true,
});

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

const collected = Object.entries(modules).map(([path, module]) => {
  const environmentId = environmentOf(path);
  const scenario = module.default;
  if (scenario.environmentId !== undefined && scenario.environmentId !== environmentId) {
    throw new Error(
      `scenario ${scenario.id} declares ${scenario.environmentId}, but lives in ${environmentId}`,
    );
  }
  return { ...scenario, environmentId };
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
