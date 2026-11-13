import { describe, expect, it } from "vite-plus/test";

import { CAPABILITIES } from "../playground/capabilities.ts";
import { parseConfig } from "../playground/scripts/lib/config.ts";
import { behaviorScenario, environments, exclusions } from "../playground/scenarios/index.ts";

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

describe("scenario registry", () => {
  it("reuses one natural-language scenario across both phases", () => {
    const scenario = behaviorScenario("poteto-help-smoke");
    expect(behaviorScenario(scenario.id)).toBe(scenario);
    const prompt = scenario.turns[0]?.prompt ?? "";
    expect(prompt).toMatch(/^\/poteto-help /);
    expect(prompt.replace("/poteto-help ", "")).not.toMatch(/skill|工具/);
    expect(scenario.assertions.some((assertion) => assertion.kind === "turn-completed")).toBe(true);
    expect(scenario.rubric.prompt).toContain("技能加载只是过程证据");
    expect(scenario.rubric.prompt).toContain("效果成立");
  });

  it("leaves the explain-the-number effect to the rubric instead of a word-level check", () => {
    const scenario = behaviorScenario("principle-explain-the-number-apply");
    expect(scenario.assertions).toEqual([{ kind: "turn-completed" }]);
    expect(scenario.rubric.prompt).toContain("限制");
  });

  it("asserts the benchmark verdict word the real reply actually carries", () => {
    const scenario = behaviorScenario("benchmark-checklist-export-claim");
    expect(scenario.assertions).toContainEqual({ kind: "assistant-contains", text: "47%" });
    expect(scenario.assertions).not.toContainEqual({ kind: "assistant-contains", text: "可信" });
    // The rubric keeps naming the allowed judgment words; only the mechanical token changed.
    expect(scenario.rubric.prompt).toContain("可信");
  });

  it("asserts the verification skill artifacts without hardcoding the index file name", () => {
    const scenario = behaviorScenario("create-verification-skill-notes-web");
    expect(scenario.assertions).toEqual([
      { kind: "turn-completed" },
      { kind: "artifact-contains", path: "verify/SKILL.md", text: "name: verify" },
      { kind: "artifact-dir-nonempty", path: "verify/features" },
    ]);
    expect(scenario.rubric.prompt).toContain("README.md 或 index.md");
  });

  it("declares complete plugin environments instead of host inheritance", () => {
    for (const environment of environments) {
      expect(environment.id).not.toBe("");
      expect(new Set(environment.enabledPluginPackages).size).toBe(
        environment.enabledPluginPackages.length,
      );
    }
  });

  it("only excludes capabilities that require Cursor services or bots", () => {
    expect(exclusions.map((entry) => entry.id)).toEqual(["make-bot-ui", "automations-benny"]);
  });

  it("covers every capability with a probe scenario in its declared phases", () => {
    for (const capability of CAPABILITIES) {
      expect(capability.id).not.toBe("");
      expect(capability.source).not.toBe("");
      expect(capability.requiredBy.length).toBeGreaterThan(0);
      expect(capability.phases.length).toBeGreaterThan(0);
      const scenario = behaviorScenario(capability.probe);
      expect(scenario.id).toBe(capability.probe);
      expect(scenario.turns.length).toBeGreaterThan(0);
    }
  });
});
