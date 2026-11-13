# 能力覆盖

测试覆盖单位是 capability，不是上游 skill 或 playbook。skill/playbook 是能力的消费者，只有依赖关系；只有能力和它的 probe 进入 raw/adapted 覆盖。

## 来源

- pstack skills、playbooks、commands、角色说明中的实际依赖。
- `playground/raw/dsh.md` 的映射行。
- 从上述来源由 agent 现场整理的能力清单；仓库不提交固定能力清单。

DSH 运行时和 profile 只用于执行 probe 和解释结果，不作为能力需求的来源。`raw/dsh-evidence.md` 只用于证明 `dsh.md` 的替换项，也不作为能力来源。raw 的任务是发现 pstack 依赖的能力在真实 DSH 中是否成立，不是枚举 DSH 已经提供的工具。

## 能力记录

每次编写前由 agent 从来源提取，至少说明：

- 能力标识和用户可观察行为
- 来自哪些 pstack 使用和 raw 映射
- 哪些 skill/playbook 消费它
- 适用阶段
- 对应 probe 场景文件

能力不是仓库预设常量；raw 不允许预置能力集合。

## Probe

- raw probe 只观察原生 DSH 行为，不预置 port 工具。
- adapted probe 验证 port 实现；需要角色或模型路由时，由 `prepare` 写入角色文件。
- probe 不要求某个工具名，不把现有实现作为预期答案。
- 能力缺失、部分支持、环境限制和未知都要记录，用于下一阶段整理 `dsh.md` 和插件工具。
- 非文本输出的 probe 必须检查实际呈现，不把源码、文件路径或文件卡片当作渲染结果。

## 覆盖守卫

场景文件是能力提取的产物。新会话按本文件的提取流程在 `scenarios/capabilities/` 下生成 probe；`scenarios/inventory.json` 是由上游和 raw/dsh 生成的派生清单，不是手写预设。skill/playbook 不要求各自拥有完整 worker 场景，只作为能力消费者登记。

## 描述与排除

- 清单里的 `description` 来自 `raw/dsh.md` 对应行的 DSH 替换说明，用来解释能力实际做什么。
- 能力确实不需要时，在 `playground/scenarios/capability-exclusions.json` 写：

```json
{
  "capability-id": "排除原因"
}
```

生成器会保留该能力的来源和说明，把状态标为 `excluded`，不会直接删除条目。上游更新后仍可追踪这个能力。
- `status` 只能是 `discovered`、`covered`、`excluded` 或 `retired`。
- `covered` 必须有对应的 `capability` probe；`excluded` 必须有 `exclusionReason`。

## 生成命令

```sh
vp run playground:capabilities
vp run playground:capabilities -- --check
```

`--check` 会检查 inventory 是否与当前上游和 raw/dsh 派生结果一致。
