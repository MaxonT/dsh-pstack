# 决策：以 capability 驱动验证并在全项目优先依靠类型定义

Status: proposed
Date: 2026-11-13
Scope: src/**, playground/**, tests/**, scripts/**, tsconfig.json, playground/tsconfig.json, docs/decisions/**
Implemented-by: -
Review: 2026-11-13

## 背景

旧 playground 覆盖以 skill、playbook 和官方插件分组组织，重写场景时容易漏掉跨切面能力，也容易把 adapted 实现或角色配置带入 raw 阶段。另有手写 `import-meta.d.ts`、可避免的类型断言和 `Partial` 等防御性代码，把类型系统本可表达的结构分散到了运行时检查中。该规则适用于整个项目的 TS 源码，不只 playground。

## 决策

- 覆盖单位是 capability，不是 skill/playbook 文件数量；skill/playbook 只作为能力消费者登记。
- 能力需求只从 pstack 使用和 `playground/raw/dsh.md` 提取；DSH 运行时、profile 和 `raw/dsh-evidence.md` 只作为执行或证据，不作为能力来源。
- `playground/scenarios/capability-inventory.json` 是派生清单；`description` 使用中文，生成时间和上游 revision 可审计；排除项写入 `capability-exclusions.json`。
- capability probe 放在 `playground/scenarios/capabilities/`；特殊环境 probe 放在与它平级的、和环境 id 一致的环境目录。
- 默认只保留 `base` 环境；`agent-team` 只用于用户明确指定的 pstack 与 Agent Teams 冲突 probe，其他环境按需增加。
- 全项目 TS 源码优先相信类型定义；边界之外不写重复防御逻辑，避免 `Pick`、`Omit`、类型强转和不必要的 `Partial`。外部 JSON、进程参数和运行时输入仍必须校验。
- 所有可由 TypeScript 静态导入的模块必须使用明确的导出类型；场景模块默认导出 `BehaviorScenario`，registry 使用类型化 glob 读取 `module.default`，不得用 `unknown` 加运行时 shape guard。
- 所有项目 TS 源码使用 `vite-plus/client` 提供的 Vite 类型；不在根 tsconfig 之外维护手写 `import-meta.d.ts`。
- 现有 skill/playbook 场景不再作为覆盖守卫；旧的按 skill/playbook 分组模型由 capability probe 取代。

## 替代方案

**继续按每个 skill/playbook 建场景。** 覆盖数量大但大量用例只重复同类行为，跨切面的角色、子代理和环境能力反而容易漏掉；该方案被否决。

**把 DSH 运行时和 profile 当成能力来源。** 这会只覆盖已有工具，漏掉 pstack 需要但 DSH 没有的能力；该方案被否决。

**继续维护手写 `import-meta.d.ts` 和大量类型断言。** 会与 Vite+ 类型漂移并增加维护成本；该方案被否决。

**为每个插件预置环境。** 没有对应 probe 的环境只会重复启动，冲突环境应由用户明确指定；该方案被否决。

## 后果

- capability 覆盖由 inventory 和 probe 驱动，skill/playbook 不再决定测试数量。
- raw/adapted 的输入边界和特殊环境更清楚。
- 类型声明和实现更接近 Vite+ 的实际类型，减少手写声明与防御代码。
- 本记录为 proposed；实现落地后按 decision-write 流程补充实现锚点。
