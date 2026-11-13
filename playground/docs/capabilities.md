# 能力覆盖

测试覆盖单位是 capability，不是上游 skill 或 playbook。skill/playbook 是能力的消费者，只有依赖关系；只有能力和它的 probe 进入 raw/adapted 覆盖。

## 来源

- pstack skills、playbooks、commands、角色说明中的实际依赖。
- `playground/raw/dsh.md` 的映射行和 `playground/raw/dsh-evidence.md` 的判定依据。
- `playground/capabilities.ts` 中登记的能力清单。

DSH 运行时和 profile 只用于执行 probe 和解释结果，不作为能力需求的来源。raw 的任务是发现 pstack 依赖的能力在真实 DSH 中是否成立，不是枚举 DSH 已经提供的工具。

## 能力记录

每项能力记录：

- `id`：稳定的能力标识
- `description`：用户可观察的行为
- `source`：来自哪些 pstack 使用和 raw 映射
- `requiredBy`：消费这项能力的 skill/playbook
- `phases`：适用阶段
- `probe`：验证该能力的场景 id

## Probe

- raw probe 只观察原生 DSH 行为，不预置 port 工具。
- adapted probe 验证 port 实现；需要角色或模型路由时，由 `prepare` 写入角色文件。
- probe 不要求某个工具名，不把现有实现作为预期答案。
- 能力缺失、部分支持、环境限制和未知都要记录，用于下一阶段整理 `dsh.md` 和插件工具。
- 非文本输出的 probe 必须检查实际呈现，不把源码、文件路径或文件卡片当作渲染结果。

## 覆盖守卫

`tests/playground-contracts.test.ts` 检查每项 capability 都有 probe；删除或漏写能力探针会直接失败。skill/playbook 不要求各自拥有完整 worker 场景，只作为能力消费者登记。
