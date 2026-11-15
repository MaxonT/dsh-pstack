新增 `pstack_agents`、`pstack_send`、`pstack_interrupt` 三个子代理控制工具。

以前只是避免与 Agent Teams 共存时的冲突；现在 pstack 子代理只用随包工具列出、续聊和中断，避免 Agent Teams 插件启用时的冲突。

原生同名工具只识别原生子代理；跟进或停止 pstack 子代理时用这三个工具。
