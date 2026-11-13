# raw/render 证据分析

> 本文件由 raw 分析会话依据 `reviews/raw-render/` 快照、`reviews/raw-base/` 同题结果、`playground/raw/dsh.md`、场景文件与本地 raw session 写成。只审查 raw 阶段与登记的能力对照环境，不读取 port 实现。

## 1. 本轮范围

- 模式：首轮 `full`（批次 `raw-render-20261113193636`，覆盖 5 个 render 探针），随后两次 `incremental`（`--reuse` 重采 `render-svg-chart`、`render-video`、`render-screenshot`）修复被场景自身 `pkill` 破坏的截图。
- 环境：`render`，`kind: "capability"`，加载 `environments.ts` 登记的渲染插件（本次装上 `@changfenhuang/dsh-genui` 0.16.0）；DSH `0.2.2-rc.1`。
- 覆盖场景（5）：`capability-render-screenshot-render`、`capability-render-generated-image-render`、`capability-render-mermaid-diagram-render`、`capability-render-svg-chart-render`、`capability-render-video-render`。
- 对照：`reviews/raw-base/` 的 5 个同题 base 结果（`capability-render-*`）。
- 未覆盖：其余能力场景不经 render 环境运行；`render` 只做对照，不替代 `raw/base`。
- 当前快照 5/5 截图有效（`render-screenshot` 首轮空白已单独重采修复）。

## 2. base 与 render 同题对照

| 能力 | base 结果 | render 结果 | 差异根因 |
| --- | --- | --- | --- |
| render-screenshot | 通过：外部 Chrome + CDP 截整页，回复内联出真实页面图 | 通过：同路径（Chrome headless + CDP），回复内联出真实页面图 | 无差异，都靠外部 Chrome，渲染插件未介入 |
| render-generated-image | 通过：SVG + resvg 生成 PNG 后内联显示 | 通过：Pillow 逐帧生成 PNG 后内联显示 | 无差异，靠外部生图工具 |
| render-mermaid-diagram | 通过：mermaid-cli + chrome-headless-shell 渲成 PNG，约 17 次工具调用 | 通过：genui 的 dsh-ui mermaid 组件，原生渲染，约 3 次工具调用、11 秒 | 渲染插件提供 Mermaid 原生组件，更快更省 |
| render-svg-chart | 通过：mermaid-cli 输出 `artifacts/flow.svg` 与 PNG | 通过：mermaid-cli 输出 `artifacts/flow.svg` 与 PNG | 无差异，靠外部 mermaid-cli |
| render-video | 缺口：产出 mp4，但回复显示「图片无法预览」，无内联播放 | 通过：genui 的 dsh-ui video 组件，回复内出现可播放控件（0:00/0:12） | 渲染插件提供内联 video 组件与 `/api/file` 媒体路由 |

结论：render 环境相对 base 的差异集中在 Mermaid 与视频两项，两项都由 `render` 环境的渲染插件带来；截图、生成图、SVG 三项两个环境都必须借助外部工具（Chrome / mermaid-cli / Pillow），插件没有改变路径。

## 3. 问题问答

### Q1 对比后确认 base 侧为符合预期的降级，内联播放属可选渲染插件增强，不写适配说明

- 类型：plugin
- 影响场景：`capability-render-video-render`（对照 `capability-render-video`）
- 证据：
  - render：[record](scenarios/capability-render-video-render/raw-render/record.json)、[截图](scenarios/capability-render-video-render/raw-render/screenshot.png)
  - base：[record](../raw-base/scenarios/capability-render-video/raw-base/record.json)、[截图](../raw-base/scenarios/capability-render-video/raw-base/screenshot.png)
  - session 只在本地 worker，按各自 `record.session.sessionId` 读取
- 现象：base 里产出 `changelog-summary.mp4` 但回复只有文件卡片、无播放控件；render 里用 genui 的 `{"type":"video","src":"/api/file?path=..."}` 组件，回复出现带进度和音量的播放器。
- 根因：base DSH Web 没有内联视频播放器；渲染插件提供 `video` 组件并借 `/api/file` 媒体路由播放工作区文件。视频文件本身由外部 ffmpeg（`imageio-ffmpeg`）生成，两个环境都一样。
- 判断：对比 base 与 render 后确认，base 的表现本就符合预期。图片能内联显示，视频和图表能以文件交付，pstack 技能要的是可检查的产物，文件即可满足。内联播放和 Mermaid 原生渲染属于可选渲染插件的能力，base 有没有对应的适配说明，对技能实际结果几乎没影响，因为写不写都不会让 base 凭空获得播放器和图表渲染器。反过来，写进 dsh.md 会增加风险。一是把第三方插件的可选能力塞进只描述 DSH 能力的文件，超出边界；二是写死后插件版本或能力变化时说明容易漂移，反而误导后续技能。所以结论是不写，按符合预期的原生降级记录。
- 与当前阶段 dsh.md 的关系：不改 `dsh.md`（可选插件能力，写适配说明收益小、风险高）。
- 建议动作：记为可选渲染插件能力，base 不判缺口。
- 你的决定：已确认不改（2026-11-13）

### Q2 渲染插件让 Mermaid 原生渲染，减少外部工具链

- 类型：plugin
- 影响场景：`capability-render-mermaid-diagram-render`
- 证据：[record](scenarios/capability-render-mermaid-diagram-render/raw-render/record.json)、[截图](scenarios/capability-render-mermaid-diagram-render/raw-render/screenshot.png)
- 现象：render 环境里模型加载 `genui` 技能，产出 `{"type":"mermaid","code":...}` 组件，约 3 次工具调用、11 秒就渲染出流程图；base 则要装 mermaid-cli 和 chrome-headless-shell。
- 根因：渲染插件提供 `mermaid` 组件，客户端直接渲染。
- 与当前阶段 dsh.md 的关系：不改 `raw/dsh.md`（可选插件能力，同一判断见 Q1）。
- 建议动作：在 dsh.md 的非文本渲染节列出 Mermaid 属可选插件能力。
- 你的决定：待定

### Q3 截图、生成图、SVG 两个环境都依赖外部工具与网络安装

- 类型：ignore-environment
- 影响场景：`capability-render-screenshot-render`、`capability-render-generated-image-render`、`capability-render-svg-chart-render`
- 证据：[screenshot](scenarios/capability-render-screenshot-render/raw-render/screenshot.png)、[generated-image](scenarios/capability-render-generated-image-render/raw-render/screenshot.png)、[svg-chart](scenarios/capability-render-svg-chart-render/raw-render/screenshot.png)
- 现象：三项在 render 环境仍靠 Chrome/CDP、Pillow、mermaid-cli 完成，未使用渲染插件。安装依赖时模型把 venv、`pylibs`、`tools`、npm/puppeteer 缓存写进 worker 工作区与该 job 的 `/tmp`，对宿主全局目录（如 `/home/leihaohao/.npm/_cacache`）的写入被只读沙箱以 EROFS 拒绝；宿主 python3 无法 `import imageio_ffmpeg`，确认没有全局污染。
- 根因：这几项能力不是插件带来的，取决于机器是否装有 Chrome/Node/Python 和能否联网装包；依赖每次跑现装。
- 建议动作：记录为环境依赖，不计入插件能力差异；如需稳定复现，应在 worker 镜像预装这些工具。
- 你的决定：待定

### Q4 场景自身 pkill 杀掉 harness 截图浏览器，导致首轮 3 张截图空白

- 类型：ignore-environment
- 影响场景：`capability-render-screenshot-render`（并波及首轮 `render-svg-chart`、`render-video`）
- 证据：首轮 `render-screenshot` 的 session 日志出现多次 `pkill -f chrome-152`；首轮三张截图 sha256 完全相同（4582 字节纯白，`21f0e82ea0`）。重跑后 `render-screenshot` 截图 134372 字节、svg 123234 字节、video 223001 字节，均有效。
- 现象：模型为腾端口执行 `pkill -f chrome-152`，被杀的正是 harness `run-case` 用来截图的 agent-browser Chrome，自己和并发场景的截图都变空白。
- 根因：worker 与被测会话共享宿主进程空间，被测 bash 能杀死 harness 的浏览器进程，隔离不足。
- 建议动作：加固 worker 进程隔离（独立 PID 命名空间或独立浏览器用户目录/二进制），或在 `run-case` 截图前重启浏览器；短期可在场景/提示里禁止 `pkill chrome`，但根本修复在隔离层。
- 你的决定：待定

## 4. dsh.md 适配说明审查（仅非文本渲染相关）

| 章节/行 | 当前说明 | 相关证据 | 结论 | 建议 |
| --- | --- | --- | --- | --- |
| 非文本产物渲染/播放 | 当前无此节 | 5 个 render 对照记录 | 不适用（对比后确认符合预期，可选插件能力） | 不写入 |

其余 `Tools` / `Subagent fields` / `Models` / `setup-pstack` / `Paths` / `Cursor-only features` 章节不在本次 render 对照范围，沿用 `raw-base` 分析结论。

## 5. 待用户判断

1. 已确认，不把「内联 Mermaid / 视频播放」写入 dsh.md，按可选渲染插件能力处理（2026-11-13）。
2. 是否为稳定复现要求在 worker 镜像预装 Chrome/mermaid-cli/Pillow/ffmpeg（Q3）。
3. 是否修 worker 隔离（pkill 连累）后重采，还是接受本次「先空白后单独重跑」的结果（Q4）。

## 6. 后续动作

- `dsh-md`：无（对比后确认符合预期，写适配说明收益很小、风险更高，Q1、Q2）。
- `plugin`：把渲染插件记为可选能力类别，Mermaid 与视频内联播放属于它的贡献（Q2）。
- `ignore-environment`：记录外部工具/网络依赖（Q3）与 pkill 杀 harness 浏览器的隔离问题（Q4）。
- 其余 4 个能力在两个环境均观察到，无新增 dsh.md 修改。
