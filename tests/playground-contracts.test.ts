import { describe, expect, it } from "vite-plus/test";

import { CAPABILITIES } from "../playground/capabilities.ts";
import { parseConfig } from "../playground/scripts/lib/config.ts";
import { behaviorScenario, environments } from "../playground/scenarios/index.ts";

function config(provider = "provider-a", model = "model-a", effort = "low") {
  return {
    testModel: { provider, model, effort },
    providers: {
      "provider-a": { apiKey: "secret-a", models: { "model-a": ["low", "high"] } },
      "provider-b": { apiKey: "secret-b", models: { "model-b": ["medium"] } },
    },
  };
}

describe("playground configuration", () => {
  it.each([
    ["provider-a", "model-a", "high"],
    ["provider-b", "model-b", "medium"],
  ])("selects an allowed target %s/%s[%s]", (provider, model, effort) => {
    expect(parseConfig(config(provider, model, effort)).testModel).toEqual({
      provider,
      model,
      effort,
    });
  });

  it.each([
    ["unknown-provider", "model-a", "low"],
    ["provider-a", "unknown-model", "low"],
    ["provider-b", "model-b", "low"],
  ])("rejects a target outside the allowance %s/%s[%s]", (provider, model, effort) => {
    expect(() => parseConfig(config(provider, model, effort))).toThrow(/testModel/);
  });

  it("uses the existing bare model ids in the provider allowlist", () => {
    expect(parseConfig(config()).providers["provider-a"]?.models).toHaveProperty("model-a");
  });

  it("accepts role model routes that resolve against the provider allowlist", () => {
    const parsed = parseConfig({
      ...config(),
      roleModels: {
        "bug-fix": { provider: "provider-a", model: "model-a", effort: "low" },
      },
    });
    expect(parsed.roleModels?.["bug-fix"]).toEqual({
      provider: "provider-a",
      model: "model-a",
      effort: "low",
    });
  });
});

describe("playground environments", () => {
  it("declares complete plugin environments instead of host inheritance", () => {
    for (const environment of environments) {
      expect(environment.id).not.toBe("");
      expect(new Set(environment.enabledPluginPackages).size).toBe(
        environment.enabledPluginPackages.length,
      );
    }
  });
});

describe("capability catalog", () => {
  it("records a source and required consumers for every capability", () => {
    for (const capability of CAPABILITIES) {
      expect(capability.id).not.toBe("");
      expect(capability.source).not.toBe("");
      expect(capability.requiredBy.length).toBeGreaterThan(0);
      expect(capability.phases.length).toBeGreaterThan(0);
      expect(["pending", "covered"]).toContain(capability.status);
    }
  });

  it("requires a real probe whenever a capability is marked covered", () => {
    for (const capability of CAPABILITIES) {
      if (capability.status !== "covered") continue;
      if (capability.probe === undefined) throw new Error(`${capability.id} has no probe`);
      const scenario = behaviorScenario(capability.probe);
      expect(scenario.turns.length).toBeGreaterThan(0);
    }
  });
});
