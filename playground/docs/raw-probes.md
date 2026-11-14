# raw 能力用例提取规则

本文件定义 `playground/scenarios/` 中的能力用例如何从上游和 raw 资料提取、如何写成 probe，以及 inventory 与排除项如何维护。

## 目录与文件

```text
playground/scenarios/
├── capabilities/                    # base 环境的 probe
├── <environment>/                   # 该环境专用的 probe 或环境对照
├── capability-inventory.json        # 手工维护的能力清单
├── capability-exclusions.json       # 用户批准的排除决定
├── capability-exclusions.proposed.json
├── environments.ts
├── index.ts
└── registry.ts
```

- 一个文件只放一个独立 probe，默认导出 `BehaviorScenario`。
- `capabilities/` 对应 `base`。
- 其他目录名必须与 `environments.ts` 中的环境 id 完全一致。
- 目录按环境组织，能力通过场景的 `capability` 字段表达。
- 只有实际存在 probe 时才建立环境目录。

```ts
import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = { ... };
export default scenario;
```

## 能力来源

能力需求只来自：

- `upstream/cursor-plugins/pstack` 源树中的上游文档。
- `playground/raw/dsh.md` 的映射行。

以下内容不是能力来源：

- `playground/raw/pstack/` 和根 `pstack/` 生成物。
- DSH 运行时和 profile。
- `playground/raw/dsh-evidence.md`。
- 当前插件实现。

如果上游树缺失或结构不符合预期，直接失败，不使用生成树或其他目录兜底。

## 提取流程

1. 扫描上游 pstack 的技能、playbook、命令和 agent 文档，找出用户可观察的行为和依赖。
2. 对照 `playground/raw/dsh.md` 的映射行，确认该行为在 raw DSH 中应如何观察。
3. 将同一行为归并为稳定的 capability id；一个 capability 只对应一个 base probe。
4. 为每个 capability 设计自然语言 prompt、workspace fixture、机械 assertions、语义 rubric 和 UI 观察点。
5. 在 `capability-inventory.json` 中记录能力、来源、`probes`、状态和用户批准过的排除原因。
6. 新增或删除 probe 后同步 inventory，确保 `probes.base` 指向实际场景。

## 输出形态

输出形态属于能力提取范围。上游文档要求以下内容时，必须提取对应的 `render-*` 能力并建立独立 probe：

- 截图或实际页面
- 图片或生成图像
- 图表或 Mermaid 图
- 画布或实际 UI 渲染
- 视频或音频播放

不能只在场景写法里写一句“非文本产物要检查实际呈现”来代替能力提取。缺少对应 `render-*` capability 和 probe 本身就是覆盖缺口。

## 阶段边界

| 阶段 | 允许输入 | 禁止输入 | 观察目标 |
| --- | --- | --- | --- |
| raw | `reviews/raw-*`、`playground/raw/dsh.md`、上游 pstack 源树、场景 fixture、当前 raw session、已登记的 capability 对照环境 | `port/dsh.md`、`src/**`、已发布端口实现、`reviews/adapted-*`、adapted 证据 | 原生 DSH 能力；capability 环境只做对照 |
| adapted | `reviews/adapted-*`、`port/dsh.md`、`src/**`、当前适配实现和环境文件、当前 adapted session | `reviews/raw-*`、raw 分析结论、raw 证据 | 适配实现 |

- 场景声明 `phases` 时，只能在该阶段运行；不声明表示 raw/adapted 都允许。
- `raw/base` 是 native baseline；`raw/<capability-environment>` 只用于证明可选依赖是否改变结果，不能替代 base 对照。
- 发现需要读取跨阶段文件时，停止该 probe 或分析，重新选择来源。
- raw 不预置适配工具或环境文件；adapted 不反推 raw 结论。

## 环境与 re-export

- `base` 是默认环境，不加载额外插件。
- 其他环境必须在 `environments.ts` 中登记 `description`、`kind` 和 `enabledPluginPackages`。
- 具体第三方包名只写在 `environments.ts`，文档只写环境 id、用途和对照方式。
- 只有同题能力对照环境（如 `render`）可以使用 re-export：从对应 `capabilities/` base 场景 import 默认对象，spread 后只覆盖环境身份和阶段字段。
- 非同题对照的特殊目的场景使用独立用例，不能复用 base prompt。
- 环境文档不提前假设某个环境一定是冲突环境；用途由 `environments.ts` 的 `description` 和 `kind` 表达。

## probe 写法

- prompt 用自然语言描述用户目标和约束，不写工具名、实现名或预期答案。
- `rubric` 描述用户可观察的合格/不合格边界，不把某一种实现当成唯一答案。
- `assertions` 只做机械事实；语义效果由 rubric、实际 tool call、截图和产物共同判断。
- 非文本产物必须检查实际呈现；源码、路径、文件卡片和 assistant 文本不能替代渲染或播放结果。
- 环境缺失或能力不可用时按 `ignore-environment` 或 `待你判断` 记录，不因降级直接判通过。
- 一个 probe 只覆盖一个能力分支；分支按行为、环境或降级路径拆分。

## inventory 与排除

- `capability-inventory.json` 是 agent 手工维护的派生清单；不写自动解析上游文档的脚本。
- `probes` 按环境记录场景 id：普通能力为 `probes.base`，对照环境追加对应环境键。
- `status` 只能是 `discovered`、`covered` 或 `excluded`。
- `covered` 必须有 `probes.base` 或对应环境 probe；`excluded` 必须写 `exclusionReason`。
- agent 可以把候选排除理由写入 `capability-exclusions.proposed.json`；该文件不产生 `excluded` 状态。
- 只有用户明确批准时，才把决定写入 `capability-exclusions.json`，格式为：

```json
{
  "capability-id": {
    "reason": "为什么排除",
    "decidedBy": "user"
  }
}
```

- `excluded` 必须有用户批准的决定和原因，不能自动排除，也不能静默删除。
- 上游变化或 probe 增删后，由 agent 手工同步 inventory 并检查与当前来源一致。

## 验证

新增或修改场景、inventory 或排除项后运行：

```sh
vp check --fix
vp test
```
