# 场景目录规则

本文件约束 `playground/scenarios/` 下的全部能力探针。场景是能力的运行时证据，每个 probe 对应一个明确的能力观察目标。

## 目录结构

```text
playground/scenarios/
├── capabilities/          # base 环境的通用能力 probe
├── <environment>/         # 仅该环境需要的能力或冲突 probe
├── capability-inventory.json
├── capability-exclusions.json
├── capability-exclusions.proposed.json
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
- 输出形态属于能力提取范围：上游文档要求截图、图片、图表、Mermaid/画布、实际 UI 渲染、视频或音频播放时，必须提取对应的 `render-*` 能力，并建立独立 probe；不能只依赖一条“非文本产物要检查”的通用场景写法。
- `dsh.md` 的 `Paths`（路径布局）和 `Cursor-only features`（Cursor 专属能力）不纳入能力提取；它们是适配事实或跳过规则，不是可验证的会话能力。
- 一个 capability 对应一个 probe；不同行为、环境或冲突分支使用不同的 capability id。
- 每个场景必须设置 `capability` 字段，并默认导出 `BehaviorScenario`。
- 能力清单由 agent 从上游 pstack 和 `raw/dsh.md` 现场提取后手工维护 `capability-inventory.json`；不解析上游表格，也不预置固定能力列表。
- 新增或删除 probe 后同步更新 inventory 的 `probe`、`status` 和能力记录。
- agent 可以整理排除建议到 `capability-exclusions.proposed.json`，但只有用户批准后才能写入 `capability-exclusions.json`。

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
| raw | `reviews/raw-*`、`playground/raw/dsh.md`、上游 pstack 源树、场景 fixture、当前 raw session、已登记的 capability 对照环境 | `port/dsh.md`、`src/**`、已发布的端口实现、`reviews/adapted-*`、adapted 证据 | 观察原生 DSH 能力；capability 环境只做对照 |
| adapted | `reviews/adapted-*`、`port/dsh.md`、`src/**`、当前适配实现和环境文件、当前 adapted session | `reviews/raw-*`、raw 分析结论、raw 证据 | 验证适配实现 |

- 场景声明 `phases` 时，只能在该阶段运行；不声明表示 raw/adapted 都允许。
- 阶段专属环境或能力必须显式声明 `phases`，例如 `phases: ["adapted"]`。
- `raw/base` 是 native baseline；`raw/<capability-environment>` 只用于证明可选依赖是否改变结果，不能替代 base 对照。
- 发现需要读取跨阶段文件时，停止该 probe 或分析并重新选择来源，不能把跨阶段内容作为当前阶段依据。
- raw 不预置适配工具或环境文件；adapted 不反推 raw 结论。

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
- `render` 是 `kind: "capability"` 的渲染对照环境，加载 `@changfenhuang/dsh-genui`；用于和 `base` 比较渲染结果。
- 只有 probe 确实需要该环境时才建立目录；冲突环境只用于用户明确指定的冲突验证。
- `run-batch --full --environment <id>` 只运行该环境目录下的 probe，不跨环境启动。

## 能力清单与排除

- `capability-inventory.json` 是 agent 手工维护的派生清单；不编写自动解析上游文档的脚本。
- `description` 优先取 `raw/dsh.zh.md`，缺失时用 `raw/dsh.md`，统一中文。
- `status` 只能是 `discovered`、`covered` 或 `excluded`。
- `covered` 必须有对应 `capability` probe；`excluded` 必须写 `exclusionReason`。
- agent 可以把候选排除理由写入 `capability-exclusions.proposed.json`；该文件不产生 `excluded` 状态。
- 只有用户明确批准时，才把决定写入 `capability-exclusions.json`，格式为 `{"capability-id": {"reason": "...", "decidedBy": "user"}}`；inventory 只消费这份批准文件。
- `excluded` 必须有用户批准的决定和原因，不能自动排除，也不能静默删除。
- 上游变化或 probe 增删后，由 agent 手工同步 inventory 并检查与当前来源一致。

## 验证

- 新增或修改场景、inventory 或排除项后运行 `vp check --fix` 和 `vp test`。
