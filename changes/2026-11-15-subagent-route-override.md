`pstack_subagent` 改为薄包装，只接受 `provider`、`model` 和可选的 `reasoningEffort` 来覆盖子代理路由。

角色名、角色下标这类选择逻辑从工具里移除。选哪个模型由调用方读取角色文件后自己决定，工具只做参数校验、路由预检和启动。

省略 `provider` 和 `model` 时子代理继承父代理的路由。原来按角色或按下标传参不再可用，需要先用 `pstack_roles` 查到具体路由，再显式传给 `pstack_subagent`。
