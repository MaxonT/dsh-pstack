# 决策：playground worker 使用 Docker 容器隔离

Status: accepted
Date: 2026-11-23
Scope: playground/**, docs/decisions/**
Implemented-by: PR #43
Review: 2026-11-23

## 背景

旧 worker 运行在宿主进程，依靠写入 `$DSH_HOME/AGENTS.md`、场景目录权限和 `git init` 约束读取与副作用。这些机制依赖提示词和宿主权限，模型绕过或异常退出后会留下权限、凭证和残留目录。容器化改为固定挂载和只读根文件系统，才能把读取边界落到运行时。

## 决策

- 每个 worker 是一个独立 Docker 容器，只挂载固定的 `/dsh/workspace`、`/dsh/home`、`/dsh/tmp`、`/dsh/runtime` 和只读的 `/dsh/native`。
- 仓库根、`playground/scenarios`、宿主 home、Docker socket 和宿主 browser profile 都不进入容器。
- `prepare` 不再生成 `$DSH_HOME/AGENTS.md`，也不再在 workspace 执行 `git init`；`writeHomePatch` 删除可能残留的旧 `AGENTS.md`。
- 读取边界由容器挂载、只读根文件系统、`cap-drop ALL`、`no-new-privileges` 和 workspace-write sandbox 共同保证。
- 该决策取代 [2026-11-13-worker-read-boundary-agents.md](./2026-11-13-worker-read-boundary-agents.md) 中基于 `$DSH_HOME/AGENTS.md`、`WorkerInstructionSection` 和 `git init` 的实现。

## 替代方案

**继续使用宿主 worker 和 `$DSH_HOME/AGENTS.md`。** 被否决。指令级边界无法阻止模型绕过，目录权限异常退出后会留下 `000` 权限，宿主进程还会接触仓库和宿主凭证。

**继续在 workspace 执行 `git init`。** 被否决。容器镜像不安装 git，容器内 workspace 不需要本地 git 仓库；真实远端副作用由容器隔离和空凭证文件控制。

## 后果

- worker 的读取边界由挂载和沙箱配置决定，不依赖提示词。
- `prepare` 不再维护 worker AGENTS.md；旧 worker 复用时会清理旧文件。
- 场景目录和宿主配置不进入容器，`collect` 只读取挂载 evidence 目录。
