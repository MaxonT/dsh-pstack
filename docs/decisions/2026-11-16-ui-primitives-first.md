# 决策：客户端 UI 优先使用 DSH primitives

Status: proposed
Date: 2026-11-16
Scope: src/client/**, docs/decisions/**
Implemented-by: -
Review: 2026-11-16

## 背景

`dsh-pstack` 的客户端页面同时维护了 `Button`、`IconButton`、`Switch`、`Status`、`Spinner`、`SegmentedTabs` 等本地控件，以及一套本地图标。DSH 已经通过 `@deepseek-ai/dsh-client-ui-primitives` 提供标准控件、图标、Tooltip、Toast 和设置表单组件，并明确要求需要标准控件时优先复用这个包，因为插件之间不能直接导入组件。

继续保留本地实现会导致视觉、键盘行为、可访问性和 DSH 主题 token 逐步漂移，也会让同一个开关或按钮在不同页面呈现不同交互。需要一条统一规则决定什么时候使用 primitives，什么时候允许本地组件存在。

## 决策

客户端 UI 默认使用 `@deepseek-ai/dsh-client-ui-primitives`：

- 官方 primitives 已提供等价组件时，直接使用官方组件，不在 `src/client` 复制实现。
- 官方组件缺少必要行为时，只允许做一层薄适配或组合，不重新实现已有控件。
- 本地组件只保留官方 primitives 没有等价物的能力，例如业务专属的组合布局或项目特有的展示块。
- 图标优先使用 primitives 的图标导出；只有 primitives 没有对应图标时才保留本地图标。
- 视觉和交互以 primitives 为准，不通过本地 CSS 重造一套控件体系。

## 替代方案

**继续使用本地 `ui.tsx` 控件并沿用 pstack 样式。** 否决。实现会重复 primitives 已有的按钮、开关、分段选择和状态展示，后续 DSH 更新时无法同步，且键盘、焦点、禁用态和主题行为容易分叉。

**把 primitives 的源码复制到本地再改。** 否决。复制会把上游行为和修复固定死在仓库里，增加维护面，也违背官方“插件不能导入另一个插件组件”的共享方式。

**只使用 primitives 的 CSS token，不直接使用组件。** 否决。token 只能统一颜色和尺寸，不能统一组件行为、无障碍语义和键盘交互。

## 后果

- `src/client/components/ui.tsx` 中 primitives 已覆盖的控件应迁移为官方组件；本地文件只保留缺失能力或薄适配。
- 本地图标集逐步收缩到 primitives 没有的图标。
- UI 验证以实际视觉审查为主，不新增像素级或组件渲染测试；已有的非视觉 wiring 测试继续保留。
- 后续 DSH primitives 版本升级时，控件行为随宿主升级，不在仓库内另行维护一份。
