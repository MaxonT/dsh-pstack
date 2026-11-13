# 决策：全项目类型优先，减少防御代码与类型转换

Status: proposed
Date: 2026-11-13
Scope: src/**, playground/**, tests/**, scripts/**, tsconfig.json, playground/tsconfig.json, docs/decisions/**
Implemented-by: -
Review: 2026-11-13

## 背景

项目里曾用手写 `import-meta.d.ts` 补充 Vite 类型，并在内部模块中使用运行时 shape guard、`Partial`、`Omit`、类型断言和非空断言来表达本可由类型系统表达的结构。这些写法会让类型定义和实际约束分离，增加维护成本，也容易掩盖真正的边界。

## 决策

- 所有项目 TS 源码优先相信类型定义；先定义清晰接口和导出类型，再写实现。
- 可静态导入的内部模块必须显式声明导出类型；调用方直接使用该类型，不用 `unknown` 加运行时 guard 绕过类型系统。
- 避免 `Pick`、`Omit`、`Partial`、`Required` 和类型强转来拼接结构；优先定义独立的 `interface` 或用组合表达。
- 避免非空断言和不必要的 `?.`/`??` 防御链；只有类型系统无法静态保证的外部边界才做运行时校验。
- 外部 JSON、进程参数、网络输入和运行时文件仍必须在边界处校验，不能把“类型优先”误解为“无条件信任外部数据”。
- Vite 的 `import.meta.glob` 类型通过 `vite-plus/client` 在 tsconfig 中提供；不维护手写 `import-meta.d.ts`。
- 以上规则适用于 `src`、`playground`、`tests`、`scripts` 和根配置，不是某个子目录的局部约定。

## 替代方案

**继续维护手写 `import-meta.d.ts`。** 这会与 Vite+ 的类型漂移，并需要手动维护全局声明；该方案被否决。

**继续用 `Partial`、`Pick`、`Omit` 和类型断言拼接内部结构。** 这会让类型定义散落在调用点，增加修改时的隐性耦合；该方案被否决。

**只在 playground 执行类型优先规则。** 这会让主源码和测试代码继续积累防御代码，无法统一维护；该方案被否决。

## 后果

- 类型定义成为结构的第一来源，内部实现减少重复校验和转换。
- 外部边界仍然保留必要的运行时验证，边界内外职责更清楚。
- 新增代码需要先定义接口和导出类型，短期多写一点类型声明，长期减少隐式耦合。
