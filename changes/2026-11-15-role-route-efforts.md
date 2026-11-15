`pstack_roles` 现在在每条已配置路由上附带该模型实际支持的 `efforts`、`defaultEffort` 和 `served` 状态。`served: false` 表示角色文件里的这条路由已不再被提供。

之前这里只有一个用户选定的 `reasoningEffort`。模型派发子代理时想临时调高档位或降低档位，只能凭经验猜，猜错就吃一次路由预检失败，甚至反复提交被拒绝的档位。

迁移提示：派发前先读 `pstack_roles`，从该路由的 `efforts` 里选档位；`pstack_models` 只用于 setup-pstack 发现可用路由或校验某条路由是否存在。
