`pstack_models` 现在把模型 id 放在对应 provider 标题下，`pstack_roles` 用 `provider`、`model` 和 `reasoningEffort` 报告路由。三个 pstack 工具开始用同一组字段表示路由。

之前 `pstack_models` 把 `provider/model` 合并串当成模型行，调用方照抄给 `pstack_subagent` 的 `model` 时，provider 会被重复拼接，路由预检直接失败。

迁移提示：从 `pstack_models` 取模型时，用标题里的 provider id 作 `provider`，用行里的模型 id 作 `model`；读 `pstack_roles` 时把 `effort` 改成 `reasoningEffort`。
