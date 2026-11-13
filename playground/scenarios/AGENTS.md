# 场景目录规则

本文件约束 `playground/scenarios/` 下的全部能力探针。场景是能力的运行时证据，不按上游 skill/playbook 数量复制用例。

## 目录结构

```text
playground/scenarios/
├── capabilities/          # base 环境的通用能力 probe
├── <environment>/         # 仅该环境需要的能力/冲突 probe
├── capability-inventory.json
├── capability-exclusions.json
├── environments.ts
├── index.ts
└── registry.ts
```

- `capabilities/` 默认对应 `base`。
- 其他场景目录的名字必须与 `environments.ts` 中的环境 id 完全一致。
- 只有实际存在 probe 时才建立环境目录；不要预建空环境。
- 不按 skill、playbook 或插件名称建立子目录。

## 文件约定

- 一个文件只放一个独立 probe，默认导出 `BehaviorScenario`：

```ts
const scenario: BehaviorScenario = { ... };
export default scenario;
```

- 文件路径决定环境：`capabilities/` 为 `base`，其他目录使用目录名。
- 场景必须设置 `capability`；`skill` 可选，不要求绑定某个技能。
- 不要在一个文件里导出多个独立场景；不同分支拆成不同文件。
- registry 依赖默认导出和类型定义，不在运行时做 shape guard。

## 能力来源

能力需求只来自：

- pstack skills、playbooks、commands、角色说明中的实际依赖。
- `playground/raw/dsh.md` 的映射行。

以下内容只作为执行环境或 `dsh.md` 证据，不是能力来源：

- DSH 运行时和 profile
- `playground/raw/dsh-evidence.md`

不要从当前插件实现反推 raw 需要验证什么。

## 阶段边界

- raw probe 只观察原生 DSH 能力，不预置 port 工具或角色文件。
- adapted probe 才验证适配实现。
- raw 不读取或引用 `port/dsh.md`、当前实现和 adapted 证据。
- adapted 不反推 raw 结论。
- 跨阶段结论无效，必须丢弃重做。

## 场景写法

- prompt 用自然语言描述用户目标和约束，不写工具名、实现名或预期答案。
- `rubric` 描述用户可观察的合格/不合格边界，不把某一种实现当成唯一答案。
- `assertions` 只做机械事实；语义效果由 rubric、实际 tool call、截图和产物共同判断。
- 非文本产物必须检查实际呈现；源码、路径、文件卡片和 assistant 文本不能替代渲染或播放结果。
- 环境缺失或能力不可用时按 `ignore-environment` 或 `待你判断` 记录，不因降级直接判通过。
- 一个 probe 只覆盖一个能力分支；拆分的是行为/环境/降级分支，不是技能数量。

## 环境

- `base` 是默认环境，不加载额外插件。
- 只有某个 probe 确实需要特殊环境时才加入对应环境目录和 `environments.ts` 条目。
- 冲突环境必须由用户明确指定；没有对应 probe 时不启动。
- `run-batch --full --environment <id>` 只运行该环境目录下的 probe，不跨环境启动。

## 能力清单与排除

- `capability-inventory.json` 由 `playground:capabilities` 从 pstack 和 `raw/dsh.md` 生成，不手写固定清单。
- `description` 使用中文；`generatedAt` 使用本地时间；`upstreamRevision` 使用实际上游 revision。
- 确实不需要的能力写入 `capability-exclusions.json`，保留来源并标记 `excluded`，不要静默删除。
- 新增 probe 后更新对应 capability 记录和覆盖状态。

## 验证

- 新增或修改场景后运行 `vp check --fix` 和 `vp test`。
- 修改能力来源、inventory 或环境后运行 `vp run playground:capabilities --check`。
