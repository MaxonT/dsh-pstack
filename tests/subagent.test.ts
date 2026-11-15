import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";

import type { Agent } from "@deepseek-ai/dsh-agent";
import {
  createPstackInterruptTool,
  createPstackSubagentTool,
  normalizeConfig,
  parseDelegationArgs,
  planDelegation,
  startChild,
  type DelegationRuntime,
} from "../src/subagent.ts";

const directories: string[] = [];

function tempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "pstack-subagent-"));
  directories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function args(overrides: Record<string, unknown> = {}) {
  return parseDelegationArgs({
    description: "inspect parser",
    prompt: "Read the parser and report.",
    agent: "poteto-agent",
    provider: null,
    model: null,
    reasoningEffort: null,
    cwd: null,
    ...overrides,
  });
}

function fakeRuntime(overrides: Partial<DelegationRuntime> = {}): DelegationRuntime {
  return {
    subagents: {
      getProvider: () => ({
        name: "spawn",
        capabilities: { agentOptions: true, agentPreset: true, depthLimit: true },
        inheritsParentContext: false,
      }),
      list: () => ["spawn"],
      resolveMaxDepth: () => 2,
      resolveName: async (_caller: unknown, name: string) => name as never,
      startActivation: async () => ({ childId: "child-1" }),
    },
    llm: { resolveCallConfig: async () => ({}) },
    workingDirectory: { ensure: async () => "/session" },
    potetoModeSkillPath: "/pkg/pstack/skills/poteto-mode/SKILL.md",
    ...overrides,
  } as unknown as DelegationRuntime;
}

const parent = {
  id: "parent-1",
  options: { provider: "cpa", model: "parent" },
  session: { requestHeader: () => undefined },
} as unknown as Agent;

describe("pstack_subagent arguments and planning", () => {
  it("normalizes a default config and rejects unknown keys", () => {
    expect(normalizeConfig(undefined)).toEqual({ provider: "spawn" });
    expect(() => normalizeConfig({ nope: true })).toThrow(/unknown config field/);
  });

  it("rejects missing required arguments", () => {
    expect(() => parseDelegationArgs({ agent: "general" })).toThrow(/missing required argument/);
  });

  it("defaults optional delegation arguments instead of requiring null", () => {
    expect(parseDelegationArgs({ prompt: "Read the parser and report." })).toMatchObject({
      agent: "general",
      provider: null,
      model: null,
      reasoningEffort: null,
      cwd: null,
      maxDepth: null,
    });
  });

  it("requires provider and model as a pair", () => {
    expect(() => args({ provider: "cpa", model: null })).toThrow(/provided together/);
    expect(() => args({ provider: null, model: "model-a" })).toThrow(/provided together/);
  });

  it("accepts a reasoningEffort token but rejects whitespace", () => {
    expect(args({ reasoningEffort: "high" }).reasoningEffort).toBe("high");
    expect(() => args({ reasoningEffort: "high tier" })).toThrow(/one token/);
  });

  it("maps the three preset agents and general explicitly", () => {
    const runtime = fakeRuntime();
    expect(planDelegation(args(), runtime).agentPreset).toBe("poteto-agent");
    expect(planDelegation(args({ agent: "comment-sicko" }), runtime).agentPreset).toBe(
      "comment-sicko",
    );
    expect(planDelegation(args({ agent: "readonly" }), runtime).agentPreset).toBe("readonly");
    expect(planDelegation(args({ agent: "general" }), runtime).agentPreset).toBeUndefined();
  });

  it("inherits the parent route when provider and model are omitted", () => {
    const plan = planDelegation(args(), fakeRuntime());
    expect(plan.routeLabel).toBe("inherit-parent");
    expect(plan.agentOptions).toBeUndefined();
  });

  it("builds agentOptions from an explicit provider, model, and effort", () => {
    const plan = planDelegation(
      args({ provider: "cpa", model: "model-a", reasoningEffort: "high" }),
      fakeRuntime(),
    );
    expect(plan.routeLabel).toBe("cpa/model-a [high]");
    expect(plan.agentOptions).toEqual({
      provider: "cpa",
      model: "model-a",
      reasoningEffort: "high",
    });
  });

  it("keeps only the effort when a route is inherited", () => {
    const plan = planDelegation(args({ reasoningEffort: "low" }), fakeRuntime());
    expect(plan.routeLabel).toBe("inherit-parent [low]");
    expect(plan.agentOptions).toEqual({ reasoningEffort: "low" });
  });

  it("preflights the explicit route before starting the child", async () => {
    const calls: unknown[] = [];
    const runtime = fakeRuntime({
      llm: {
        resolveCallConfig: async (config: unknown) => {
          calls.push(config);
          return {};
        },
      } as unknown as DelegationRuntime["llm"],
    });
    await startChild(
      parent,
      planDelegation(args({ provider: "cpa", model: "model-a", reasoningEffort: "high" }), runtime),
      runtime,
      new AbortController().signal,
    );
    expect(calls).toEqual([{ provider: "cpa", model: "model-a", reasoningEffort: "high" }]);
  });

  it("starts exactly one child with the planned agentOptions", async () => {
    const starts: unknown[] = [];
    const runtime = fakeRuntime({
      subagents: {
        getProvider: () => ({
          name: "spawn",
          capabilities: { agentOptions: true, agentPreset: true, depthLimit: true },
          inheritsParentContext: false,
        }),
        list: () => ["spawn"],
        resolveMaxDepth: () => 2,
        startActivation: async (spec: unknown) => {
          starts.push(spec);
          return { childId: "child-1" };
        },
      } as unknown as DelegationRuntime["subagents"],
    });
    const record = await startChild(
      parent,
      planDelegation(args({ provider: "cpa", model: "model-a" }), runtime),
      runtime,
      new AbortController().signal,
    );
    expect(record).toMatchObject({
      childId: "child-1",
      agent: "poteto-agent",
      route: "cpa/model-a",
    });
    expect(starts).toHaveLength(1);
  });

  it("resolves a relative cwd against the session directory", async () => {
    const directory = tempDir();
    const starts: { cwd?: string }[] = [];
    const runtime = fakeRuntime({
      workingDirectory: {
        ensure: async () => directory,
      } as unknown as DelegationRuntime["workingDirectory"],
      subagents: {
        getProvider: () => ({
          name: "spawn",
          capabilities: { agentOptions: true, agentPreset: true, depthLimit: true },
          inheritsParentContext: false,
        }),
        list: () => ["spawn"],
        resolveMaxDepth: () => 2,
        startActivation: async (spec: unknown) => {
          starts.push(spec as { cwd?: string });
          return { childId: "child-1" };
        },
      } as unknown as DelegationRuntime["subagents"],
    });
    await startChild(
      parent,
      planDelegation(args({ cwd: "." }), runtime),
      runtime,
      new AbortController().signal,
    );
    expect(starts[0]?.cwd).toBe(directory);
  });

  it("rejects a depth above the configured cap", () => {
    expect(() =>
      planDelegation(args({ maxDepth: 3 }), fakeRuntime(), { provider: "spawn", maxDepth: 2 }),
    ).toThrow(/exceeds/);
  });

  it("rejects maxDepth 0 before planning", () => {
    expect(() => args({ maxDepth: 0 })).toThrow(/positive safe integer/);
  });

  it("uses the Host cap when maxDepth is omitted", () => {
    expect(planDelegation(args(), fakeRuntime()).maxDepth).toBe(2);
  });

  it("omits maxDepth when neither the caller nor the Host sets a cap", () => {
    const runtime = fakeRuntime({
      subagents: {
        getProvider: () => ({
          name: "spawn",
          capabilities: { agentOptions: true, agentPreset: true, depthLimit: true },
          inheritsParentContext: false,
        }),
        list: () => ["spawn"],
        resolveMaxDepth: () => undefined,
        startActivation: async () => ({ childId: "child-1" }),
      } as unknown as DelegationRuntime["subagents"],
    });
    const plan = planDelegation(args(), runtime);
    expect(plan.maxDepth).toBeUndefined();
    expect("maxDepth" in plan).toBe(false);
  });

  it("renders the single child record", async () => {
    const record = await startChild(
      parent,
      planDelegation(
        args({ provider: "cpa", model: "model-a", reasoningEffort: "high" }),
        fakeRuntime(),
      ),
      fakeRuntime(),
      new AbortController().signal,
    );
    const rendered = createPstackSubagentTool(fakeRuntime()).output?.render(
      {},
      record as never,
    ) as {
      text: string;
    }[];
    expect(rendered[0]?.text).toContain("started child child-1");
    expect(rendered[0]?.text).toContain("route=cpa/model-a [high]");
    expect(rendered[0]?.text).toContain("effort=high");
  });

  it("rejects an unregistered backend provider", async () => {
    const runtime = fakeRuntime({
      subagents: {
        getProvider: () => undefined,
        list: () => ["spawn"],
        resolveMaxDepth: () => 2,
        startActivation: async () => ({ childId: "child-1" }),
      } as unknown as DelegationRuntime["subagents"],
    });
    await expect(
      startChild(parent, planDelegation(args(), runtime), runtime, new AbortController().signal),
    ).rejects.toThrow(/not registered/);
  });
});

describe("pstack interrupt tool", () => {
  const signal = new AbortController().signal;
  const exec = { agent: parent, signal } as never;

  it("resolves a child name or Session id before interrupting under ancestor authority", async () => {
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
