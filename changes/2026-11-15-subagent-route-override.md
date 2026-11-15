`pstack_subagent` 改为薄包装，只接受 `provider`、`model` 和可选的 `reasoningEffort` 覆盖路由。

原来 roleIndex 和模型推理档位经常被误传；现在与上游调用方式一致，并要求先查当前部署支持的模型元数据再传。

省略 `provider`、`model` 时继承父路由；按角色或下标传参不再可用，先用 `pstack_roles` 查路由再显式传入。
