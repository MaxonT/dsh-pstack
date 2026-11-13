# 工作区与会话流程

本文说明如何运行一个真实场景并保存证据。完整流程见 [playground/AGENTS.md](../AGENTS.md) 和 [verification-loop.md](./verification-loop.md)。

## 隔离运行环境

一个 worker 有一套独立运行环境。home、浏览器 profile、证据、pid 和日志在仓库内 `playground/.workers/<phase>/<environmentId>/w<k>`，便于审计；被测会话的工作区和 raw 技能挂载在仓库外隔离根 `<isolatedRoot>/<phase>/<environmentId>/w<k>`（默认 `os.tmpdir()/dsh-pstack-playground`，环境变量 `PLAYGROUND_WORKSPACE_ROOT` 可覆盖）。沙箱只限写不限读，所以工作区与挂载路径都不得暴露仓库根。prepare 会为每个 worker 写入结构化的 `$DSH_HOME/AGENTS.md` 读取边界，明确只能读取当前工作区和系统挂载的只读运行时输入，禁止读取、列出或搜索工作区外路径。若仍有被测会话读取到场景定义、rubric、断言或当前评审快照，该次结果不能作为技能独立效果的证据，必须标为待人工审查并重采。environmentId 属于 RunRecord 的身份，不能只靠时间戳区分。

每个 scenario workspace 在写入 fixture 后执行本地 `git init`，不设置 origin；worker 的 DSH 环境不携带 Git/GitHub 凭证。

每个 worker 使用 `dsh --port 0`。prepare 从实际启动输出读取 URL 和端口。当前受管 web 生命周期只在 Linux 上运行。其他平台需要接入受管 DSH 进程，不能把未知 PID 当成 web 进程。

## 准备和运行

先运行 raw 生成器，再准备 raw 环境。raw 不能包含 dsh-pstack 或其他附加插件。standard preset 加 raw systemPrompt 提示提供与 poteto-mode 相同的常驻工作流入口。

`prepare` 启动的 DSH Web 只在当前 job 的 PID namespace/cgroup 内存活。`prepare`、`bootstrap`、`run-batch` 和 `collect` 必须放在同一个长期存活的 background job 中，不能拆成多次 bash 调用；`vp run` wrapper 被 SIGTERM 时改用 `vpx` 直调。

下面是单场景的抽样示例，只对 `w0` 运行场景；`prepare` 省略 `--workers`，由 `capacity.ts` 按环境容量启动全部 worker。若要限制为一个 worker，再显式加 `--workers 1`。

```sh
vp run playground:raw-generate
vp run playground:prepare -- --phase raw --environment base --reset
vp run playground:bootstrap -- --worker 0 --environment base
vp run playground:run -- --worker 0 --environment base --phase raw --scenario poteto-help-smoke
vp run playground:collect -- --phase raw --environment base
```

adapted 重建自己的环境。它选择 poteto-mode preset，不再挂载 raw 提示。额外环境能力必须列在 EnvironmentMatrix 中。环境开关属于环境矩阵，不是场景复制。

```sh
vp run playground:prepare -- --phase adapted --environment base --reset
vp run playground:run -- --worker 0 --environment base --phase adapted --scenario poteto-help-smoke
vp run playground:collect -- --phase adapted --environment base
```

run-case 在同一会话中顺序发送 Scenario 的所有自然语言 turns。每轮要等到会话真正空闲才采集最终 assistant 消息和截图，不能把某个中间 turn 的输出当成最终答复。截图前会自动折叠左侧栏，隐藏会话列表和账户名，扩大右侧会话区。worker 的模型显示名统一为匿名模型，内部 id 保留用于路由匹配。浏览器或会话日志不可读时记录基础设施未决，不自动重试。`run` 是单场景命令，不写 batch progress；多场景进度由 `run-batch` 写入 `playground/.workers/<phase>/<environment>/progress.json`，用 `playground:status -- --phase <phase> --environment <environment>` 查看。

## 外部停止

任务运行超过 10 分钟时，人工应直接读取该 worker 最新的 `session.v4.jsonl.zstd`，判断是否仍在产生有效的 assistant/tool 事件。确认空转、漂移或无效推进后，执行：

```sh
vp run playground:stop-task -- --phase raw --environment base --worker <N>
```

`stop-task` 只写停止请求；`run-case` 在下一个轮询点保存当前截图和会话证据，写一条 `blocked` record，然后 `run-batch` 继续派发后续任务。不要用 `playground:status` 的进度摘要代替 session 文件判断。

## 证据和快照

RunRecord 的身份是 scenarioId、phase、environmentId。记录包含实际 DSH 版本、安装版本、实际模型路由、上游 revision、配置 hash、会话事实、产物和裁决。密钥只用于进程环境，不能进入记录。

`run-case` 在 worker 的 evidence 目录写脱敏后的 `record.json`，并在同目录写本地 `record.source.json`，只用于 `collect` 定位原始截图和 session；`record.source.json` 不进提交。

`collect` 读取 worker 的脱敏 RunRecord，并从 `record.source.json` 复制原始证据到 `reviews/<phase>-<environment>/scenarios/<group>/<scenario>/<phase>-<environment>/`。每个目录保存 `record.json`、`screenshot.png`；`session.jsonl.zstd` 只保留本地，不提交。

`manifest.json` 记录当前快照的来源和覆盖场景；`index.md` 是分析会话填写的问答文件。未出现在当前快照中的场景目录会被删除，分析文件里的对应问答也要清理。

`--only-failed` 在 raw 只选择 gap，在 adapted 只选择 not-verified。blocked、unobserved 和 inconclusive 需要显式选择或人工处理，不自动重试到变绿。
