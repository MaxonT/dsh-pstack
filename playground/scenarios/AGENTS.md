# 场景目录规则

本文件约束 `playground/scenarios/` 下的全部能力探针。场景是能力的运行时证据，每个 probe 对应一个明确的能力观察目标。

## 目录结构

```text
playground/scenarios/
├── capabilities/          # base 环境的通用能力 probe
├── <environment>/         # 仅该环境需要的能力或冲突 probe
├── capability-inventory.json
├── capability-exclusions.json
├── environments.ts
├── index.ts
└── registry.ts
```

- `capabilities/` 对应 `base`。
- 其他场景目录名必须与 `environments.ts` 中的环境 id 完全一致。
- 目录按执行环境组织；能力通过场景的 `capability` 字段表达。
- 只有实际存在 probe 时才建立环境目录。

## capabilities 目录

- `capabilities/` 存放 base 环境的通用能力 probe。
- 能力从 `upstream/cursor-plugins/pstack/` 源树中的上游文档，以及 `playground/raw/dsh.md` 的映射行提取，归一化为稳定的 capability id；提取不依赖固定子目录名。
- 一个 capability 对应一个 probe；不同行为、环境或冲突分支使用不同的 capability id。
- 每个场景必须设置 `capability` 字段，并默认导出 `BehaviorScenario`。
- 能力清单由 `playground:capabilities` 从同一来源生成，不在代码里手写固定能力列表。
- 新增 probe 后运行 `playground:capabilities` 重新生成 inventory 并检查覆盖状态；确实不需要的能力写入 `capability-exclusions.json` 并保留原因。

## 文件约定

- 一个文件默认导出一个 `BehaviorScenario`：

```ts
const scenario: BehaviorScenario = { ... };
export default scenario;
```

- 文件路径决定环境：`capabilities/` 为 `base`，其他目录使用目录名。
- 不同能力分支拆成不同文件。
- registry 按默认导出的 `BehaviorScenario` 类型收集场景。

## 能力来源

能力需求只来自：

- `upstream/cursor-plugins/pstack/` 源树中的上游文档。
- `playground/raw/dsh.md` 的映射行。

以下内容只作为执行环境或 `dsh.md` 证据，不是能力来源：

- `playground/raw/pstack/` 和根 `pstack/` 是生成物，不是提取来源。
- DSH 运行时和 profile。
- `playground/raw/dsh-evidence.md`。

如果上游树缺失或结构不对，直接报错，不使用生成树或其他目录兜底。不要从当前插件实现反推 raw 需要验证什么。

## 阶段边界

| 阶段 | 允许输入 | 禁止输入 | probe 目标 |
| --- | --- | --- | --- |
| raw | `reviews/raw-*`、`playground/raw/dsh.md`、上游 pstack 源树、场景 fixture、当前 raw session | `port/dsh.md`、`src/**`、已发布的端口实现、插件工具、`reviews/adapted-*`、adapted 证据 | 观察原生 DSH 能力 |
| adapted | `reviews/adapted-*`、`port/dsh.md`、`src/**`、当前插件实现和角色文件、当前 adapted session | `reviews/raw-*`、raw 分析结论、raw 证据 | 验证适配实现 |

- 场景声明 `phases` 时，只能在该阶段运行；不声明表示 raw/adapted 都允许。
- 阶段专属环境或能力必须显式声明 `phases`，例如 `phases: ["adapted"]`。
- 发现需要读取跨阶段文件时，停止该 probe 或分析并重新选择来源，不能把跨阶段内容作为当前阶段依据。
- raw 不预置 port 工具或角色文件；adapted 不反推 raw 结论。

## 场景写法

- prompt 用自然语言描述用户目标和约束，不写工具名、实现名或预期答案。
- `rubric` 描述用户可观察的合格/不合格边界，不把某一种实现当成唯一答案。
- `assertions` 只做机械事实；语义效果由 rubric、实际 tool call、截图和产物共同判断。
- 非文本产物必须检查实际呈现；源码、路径、文件卡片和 assistant 文本不能替代渲染或播放结果。
- 环境缺失或能力不可用时按 `ignore-environment` 或 `待你判断` 记录，不因降级直接判通过。
- 一个 probe 只覆盖一个能力分支；分支按行为、环境或降级路径拆分。

## 其他环境

- `base` 是默认环境，不加载额外插件。
- 其他环境必须在 `environments.ts` 中登记，并写清 `description`、`kind` 和需要的插件包。
- 只有 probe 确实需要该环境时才建立目录；冲突环境只用于用户明确指定的冲突验证。
- `run-batch --full --environment <id>` 只运行该环境目录下的 probe，不跨环境启动。

## 能力清单与排除

- `capability-inventory.json` 由 `playground:capabilities` 从上游 pstack 和 `raw/dsh.md` 生成，不手写固定清单。
- `description` 使用中文；`generatedAt` 使用本地时间；`upstreamRevision` 使用实际上游 revision。
- 确实不需要的能力写入 `capability-exclusions.json`，保留来源并标记 `excluded`，不要静默删除。
- 新增 probe 后重新运行生成器并确认 inventory 与 probe 一致。

## 验证

- 新增或修改场景后运行 `vp check --fix` 和 `vp test`。
- 修改能力来源、inventory 或环境后运行 `vp run playground:capabilities --check`。
