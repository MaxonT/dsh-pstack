import { fileURLToPath } from "node:url";

import { runnerImport } from "vite-plus";

import type { BehaviorScenario } from "../../types.ts";

interface ScenarioRegistry {
  behaviorScenarios: readonly BehaviorScenario[];
  behaviorScenario: (id: string) => BehaviorScenario;
  reviewScenarioIds: () => string[];
}

const registryPath = fileURLToPath(new URL("../../scenarios/registry.ts", import.meta.url));
const loaded = (await runnerImport(registryPath)) as { module: ScenarioRegistry };
const registry = loaded.module;

export function listScenarioIds(): string[] {
  return registry.behaviorScenarios.map((scenario) => scenario.id);
}

/** Behavior scenario ids registered for review. */
export function listReviewScenarioIds(): string[] {
  return registry.reviewScenarioIds();
}

export function loadScenario(id: string): BehaviorScenario {
  return registry.behaviorScenario(id);
}

export function listScenariosForSkill(skill: string): BehaviorScenario[] {
  return registry.behaviorScenarios.filter((scenario) => scenario.skill === skill);
}
