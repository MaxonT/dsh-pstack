新增 `pstack_agents`、`pstack_send`、`pstack_interrupt` 三个子代理控制工具。

原生的 `list_agents`、`send_message`、`interrupt_agent` 只识别原生子代理。新的工具按 `pstack_subagent` 返回的 child id 列出、续聊和中断它启动的子代理。

需要跟进或停止一个 pstack 子代理时，用这三个工具，而不是同名的原生工具。
