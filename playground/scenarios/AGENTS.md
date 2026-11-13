# 能力用例编写规则

本文件约束 `playground/scenarios/capabilities/` 下的能力探针。场景是能力证据，不是某个 skill/playbook 的效果验收。

## 能力来源

- pstack skills、playbooks、commands、角色说明中的实际依赖。
- `playground/raw/dsh.md` 的映射行。
- 从上述来源现场提取的能力集合；仓库不预先维护固定能力清单。

DSH 运行时和 profile 只用于执行 probe 和解释结果，不能作为 raw 能力来源。raw 要发现 pstack 依赖的能力在真实 DSH 中是否成立，不是枚举 DSH 已经提供的工具。

## 场景写法

- 一个能力一个 probe；prompt 用自然语言描述用户目标，不写工具名或实现名。
- raw probe 不预置 port 工具或角色文件；adapted probe 才验证 port 实现。
- 不允许跨阶段：raw 不读取或引用 adapted 文档、当前实现和插件工具；adapted 不反推 raw 结论。
- `assertions` 只做机械事实；能力是否成立由 `rubric`、实际 tool call、截图和产物共同判断。
- 非文本产物必须检查实际呈现，源码、文件路径、文件卡片和 assistant 文本不能替代渲染或播放结果。
- 场景不要求某个工具名、某个插件或某个具体实现；能力缺失、部分支持、环境限制和未知按证据记录。
- 新能力由 pstack 使用和 `raw/dsh.md` 现场提取后直接写成 probe；仓库不维护固定能力清单。

## 完成条件

- 同步检查 `tests/playground-contracts.test.ts` 的场景结构约束。
- 运行 `vp check --fix` 和 `vp test`，没有格式、类型或测试失败才算完成。
