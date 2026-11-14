# src 目录说明

本文件只写 `src/` 的长期实现规范，不描述会频繁变化的模块清单、文件职责或实现步骤。模块图和入口以 [../docs/architecture.md](../docs/architecture.md) 为准。

## 实现依据

- 以当前运行时的 DSH 能力和官方类型/API 为准；不要凭 Cursor 或旧实现猜测接口。
- 可选插件和运行时能力不作为默认存在；需要时先确认当前环境实际提供什么，并保留缺失时的降级。
- 修改前读 `docs/architecture.md`；涉及适配文案时读 [../docs/dsh-adapter.md](../docs/dsh-adapter.md)。

## 边界

- Host、Client 和共享协议各守自己的边界；跨边界只走明确契约，不绕过运行时服务直接访问对方内部。
- 生成物不是实现源码，不手工修改生成结果。
- 业务逻辑在 `src/` 内实现。
- 新功能先确认它是否来自 playground 缺口；非缺口扩展按 [../port/docs/extensions.md](../port/docs/extensions.md) 登记。

## UI 风格

- 复用现有界面组件、样式、图标、提示和本地化方式，不另起一套视觉或文案体系。
- 新增交互保持现有布局、焦点、禁用态、错误提示和未保存草稿行为一致。
- UI 变更以实际可操作性和可访问性为准，不以堆叠装饰或临时样式代替现有组件。

## 验证与记录

- 按仓库标准命令运行检查、类型检查、测试和生成一致性检查。
- 只在 `src/` 内做纯逻辑和 DOM 行为测试；需要真实 Cordis、profile、浏览器或模型的验证放到 `playground/`。
- 反复出现的移植陷阱登记到 [../port/docs/regressions.md](../port/docs/regressions.md)，普通缺陷由测试和提交记录承载。
- 具体验证命令以 `package.json` 和 `vite.config.ts` 为准，不在此复制会变化的脚本列表。
