import { describe, expect, it } from "vite-plus/test";

import type { Agent } from "@deepseek-ai/dsh-agent";
import {
  createPstackInterruptTool,
  createPstackSubagentTool,
  normalizeConfig,
  parseDelegationArgs,
  planDelegation,
  startChild,
  type DelegationArgs,
  type DelegationRuntime,
} from "../src/subagent.ts";

const parent = { id: "parent-1" } as unknown as Agent;

function args(overrides: Partial<DelegationArgs> = {}): DelegationArgs {
  return {
    description: "Probe",
    prompt: "Do the probe",
    agent: "general",
    name: null,
    provider: null,
    model: null,
    reasoningEffort: null,
    cwd: null,
    maxDepth: null,
    ...overrides,
  };
}

function fakeRuntime(overrides: Partial<DelegationRuntime> = {}): DelegationRuntime {
  return {
    subagents: {
      startActivation: async () => ({ childId: "child-1" }),
      resolveName: async (_caller: unknown, name: string) => name,
      interrupt: () => {},
    },
    potetoModeSkillPath: "/pkg/pstack/skills/poteto-mode/SKILL.md",
    ...overrides,
  } as unknown as DelegationRuntime;
}

describe("normalizeConfig", () => {
  it("defaults to the spawn backend", () => {
    expect(normalizeConfig(undefined)).toEqual({ provider: "spawn" });
  });

  it("keeps provider and a valid maxDepth", () => {
    expect(normalizeConfig({ provider: "spawn", maxDepth: 2 })).toEqual({
      provider: "spawn",
      maxDepth: 2,
    });
  });

  it("rejects an empty provider or a non-positive maxDepth", () => {
    expect(() => normalizeConfig({ provider: "" })).toThrow(/provider/);
    expect(() => normalizeConfig({ provider: "spawn", maxDepth: 0 })).toThrow(/maxDepth/);
  });
});

describe("parseDelegationArgs", () => {
  it("requires prompt and description", () => {
    expect(() => parseDelegationArgs({})).toThrow(/prompt is required/);
    expect(() => parseDelegationArgs({ prompt: "do it" })).toThrow(/description is required/);
  });

  it("reads every optional field and the reasoning_effort param", () => {
    expect(
      parseDelegationArgs({
        description: "d",
        prompt: "p",
        agent: "readonly",
        name: "scout",
        provider: "cpa",
        model: "m",
        reasoning_effort: "high",
        cwd: "/work",
        maxDepth: 2,
      }),
    ).toEqual({
      description: "d",
      prompt: "p",
      agent: "readonly",
      name: "scout",
      provider: "cpa",
      model: "m",
      reasoningEffort: "high",
      cwd: "/work",
      maxDepth: 2,
    });
  });

  it("defaults the agent to general", () => {
    expect(parseDelegationArgs({ description: "d", prompt: "p" }).agent).toBe("general");
    expect(parseDelegationArgs({ description: "d", prompt: "p", agent: "nope" }).agent).toBe(
      "general",
    );
  });
});

describe("planDelegation", () => {
  it("maps a preset agent and injects the poteto-mode path", () => {
    const runtime = fakeRuntime();
    const plan = planDelegation(args({ agent: "poteto-agent", prompt: "work" }), runtime);
    expect(plan.agentPreset).toBe("poteto-agent");
    expect(plan.prompt).toContain(runtime.potetoModeSkillPath);
    expect(plan.prompt).toContain("work");
  });

  it("leaves general without a preset or injection", () => {
    const plan = planDelegation(args({ prompt: "plain" }), fakeRuntime());
    expect(plan.agentPreset).toBeUndefined();
    expect(plan.prompt).toBe("plain");
  });

  it("builds route agentOptions and labels the route", () => {
    const plan = planDelegation(
      args({ provider: "cpa", model: "model-a", reasoningEffort: "high" }),
      fakeRuntime(),
    );
    expect(plan.agentOptions).toEqual({
      provider: "cpa",
      model: "model-a",
      reasoningEffort: "high",
    });
    expect(plan.routeLabel).toBe("cpa/model-a [high]");
  });

  it("takes maxDepth from the argument, otherwise the row config", () => {
    expect(planDelegation(args({ maxDepth: 3 }), fakeRuntime()).maxDepth).toBe(3);
    expect(planDelegation(args(), fakeRuntime(), { provider: "spawn", maxDepth: 2 }).maxDepth).toBe(
      2,
    );
  });
});

describe("startChild", () => {
  it("starts exactly one activation and returns the child record", async () => {
    const specs: unknown[] = [];
    const runtime = fakeRuntime({
      subagents: {
        startActivation: async (spec: unknown) => {
          specs.push(spec);
          return { childId: "child-1" };
        },
      } as unknown as DelegationRuntime["subagents"],
    });
    const record = await startChild(
      parent,
      planDelegation(
        args({ name: "scout", cwd: "/work", provider: "cpa", model: "m", maxDepth: 2 }),
        runtime,
      ),
      runtime,
      new AbortController().signal,
    );
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({
      provider: "spawn",
      label: "Probe",
      delivery: "parent",
      name: "scout",
      cwd: "/work",
      maxDepth: 2,
      agentOptions: { provider: "cpa", model: "m" },
    });
    expect(record).toMatchObject({ childId: "child-1", agent: "general", route: "cpa/m" });
  });
});

describe("createPstackSubagentTool", () => {
  it("requires description and prompt and exposes reasoning_effort", () => {
    const parameters = createPstackSubagentTool(fakeRuntime()).parameters as {
      required: string[];
      properties: Record<string, unknown>;
    };
    expect(parameters.required).toEqual(["description", "prompt"]);
    expect(parameters.properties).toHaveProperty("reasoning_effort");
    expect(parameters.properties).not.toHaveProperty("reasoningEffort");
  });
});

describe("pstack interrupt tool", () => {
  const signal = new AbortController().signal;
  const exec = { agent: parent, signal } as never;

  it("resolves a name or Session id before interrupting under ancestor authority", async () => {
    const calls: unknown[] = [];
    const runtime = fakeRuntime({
      subagents: {
        resolveName: async (_caller: unknown, name: string) =>
          (name === "src-reader" ? "child-1" : name) as never,
        interrupt: (...callArgs: unknown[]) => {
          calls.push(callArgs);
        },
      } as unknown as DelegationRuntime["subagents"],
    });
    const byName = await createPstackInterruptTool(runtime).execute?.(
      { agent: "src-reader" },
      exec,
    );
    expect(byName).toEqual({ interrupted: true });
    expect(calls[0]).toEqual(["child-1", { kind: "ancestor", agent: parent }]);
    const byId = await createPstackInterruptTool(runtime).execute?.({ agent: "session-9" }, exec);
    expect(byId).toEqual({ interrupted: true });
    expect(calls[1]).toEqual(["session-9", { kind: "ancestor", agent: parent }]);
  });

  it("rejects an empty agent before touching the runtime", async () => {
    await expect(
      createPstackInterruptTool(fakeRuntime()).execute?.({ agent: " " }, exec),
    ).rejects.toThrow(/non-empty string/);
  });
});
