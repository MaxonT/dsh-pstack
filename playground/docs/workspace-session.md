# 工作区与会话流程

本文说明如何运行一个真实场景并保存证据。完整流程见 [playground/AGENTS.md](../AGENTS.md) 和 [verification-loop.md](./verification-loop.md)。

## 隔离运行环境

一个 worker 有一套独立运行环境。home、浏览器 profile、证据、pid 和日志在仓库内 `playground/.workers/<phase>/<environmentId>/w<k>`，便于审计；被测会话的工作区和 raw 技能挂载在仓库外隔离根 `<isolatedRoot>/<phase>/<environmentId>/w<k>`（默认 `os.tmpdir()/dsh-pstack-playground`，环境变量 `PLAYGROUND_WORKSPACE_ROOT` 可覆盖）。沙箱只限写不限读，所以 prepare 把 `playground/raw` 整体复制到隔离根的 `raw` 挂载目录，raw profile 与常驻提示只引用该副本，工作区与挂载路径都不得暴露仓库根。run-batch 在批次执行期间隐藏 `playground/scenarios`、`reviews`、`reports` 的读访问，run-case 从临时 bundle 读取场景；被测会话不能读取场景定义、rubric 或评审侧车。environmentId 属于 RunRecord 的身份，不能只靠时间戳区分。

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

run-case 在同一会话中顺序发送 Scenario 的所有自然语言 turns。每轮等待新的 turn/end 后，再等待会话事件稳定，才采集最终 assistant 消息和截图。没有自动停止和隐藏超时。浏览器或会话日志不可读时记录基础设施未决，不自动重试。`run` 是单场景命令，不写 batch progress；多场景进度由 `run-batch` 写入 `playground/.workers/<phase>/<environment>/progress.json`，用 `playground:status` 查看。

## 证据和报告

RunRecord 的身份是 scenarioId、phase、environmentId。记录包含实际 DSH 版本、安装版本、实际模型路由、上游 revision、配置 hash、会话事实、产物和裁决。密钥只用于进程环境，不能进入记录。

可观察断言检查完成状态、产物和过程事实。语义审核另存状态、理由与审核者。运行时审查另存 `runtimeReview`，与语义审核分开；无法归类的 finding 必须标为 `needs-review` 等用户审查。pending 在 raw 是 unobserved，在 adapted 是 inconclusive。

collect 读取全部 worker 的 RunRecord。报告列出已运行、未运行和排除的场景。adapted 必须与 raw 对照自然语言、实际模型、上游 revision 和配置 hash。归档避免重复复制已归档文件。

`--only-failed` 在 raw 只选择 gap，在 adapted 只选择 not-verified。blocked、unobserved 和 inconclusive 需要显式选择或人工处理，不自动重试到变绿。
