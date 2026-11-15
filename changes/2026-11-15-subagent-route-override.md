`pstack_subagent` 改为薄包装，只接受 `provider`、`model` 和可选的 `reasoningEffort` 来覆盖子代理路由。

此前的角色下标（roleIndex）和每个模型的推理档位经常被误传。现在与上游的调用方式保持一致，并在 dsh.md 中要求先查当前部署支持的模型元数据再传，准确性更好。

省略 `provider` 和 `model` 时子代理继承父代理的路由；原来按角色或按下标传参不再可用，需要先用 `pstack_roles` 查到具体路由，再显式传给 `pstack_subagent`。
