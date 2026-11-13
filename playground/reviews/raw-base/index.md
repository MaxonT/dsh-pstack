# raw/base 当前快照

本快照按当前实现整理，覆盖 79 个场景。每个场景目录保存 `record.json` 和完整页面 `screenshot.png`；原始 session 仅保留在本地 worker（`playground/.workers/raw/base/w*/home/sessions/...`），不进入 `reviews`。

## 1. 本轮范围

- mode：整份快照为 full（79 场景全覆盖）；`manifest.lastMode` 为 `incremental`，`lastScope` 为最近一次重采的 19 个场景，其余场景沿用当前快照。
- 覆盖场景：79（20 个 playbook + 59 个 skill）。
- 上游 revision：`ae5650febf4320793844c12c4adaa937f417f8da`；DSH `0.2.2-rc.1`；configHash `d278ed6c…`；port revision：不适用（raw 阶段 `adaptedVersion: null`）。
- 成功加载并产出合格的：20 个 playbook 场景与 14 个 `/name` 手势技能场景（`automate-me`、`bro`、`correct`、`in-your-own-words`、`ketchup`×3、`no-comments`、`poteto-help`、`poteto-mode-feature-rigor`、`recall`、`reflect`、`setup-pstack`、`sharpen`）。这 34 个场景经用户 `/name` 手势注入技能，语义产出均为合格，未见适配缺陷。
- 需要关注的是其余 45 个技能场景全部**未加载技能**（见 Q1），以及若干非适配类的运行/采集/环境问题（Q2–Q8）。

## 2. 问题问答

### Q1 45 个技能场景全部未加载技能，技能本身未被验证

- 类型：待你判断
- 影响场景（45 个，全部为 skill 组）：
  - `architect-discount-strategy-design` [record](scenarios/skills/architect-discount-strategy-design/raw-base/record.json) · [截图](scenarios/skills/architect-discount-strategy-design/raw-base/screenshot.png)
  - `arena-duration-parser-bakeoff` [record](scenarios/skills/arena-duration-parser-bakeoff/raw-base/record.json) · [截图](scenarios/skills/arena-duration-parser-bakeoff/raw-base/screenshot.png)
  - `benchmark-checklist-export-claim` [record](scenarios/skills/benchmark-checklist-export-claim/raw-base/record.json) · [截图](scenarios/skills/benchmark-checklist-export-claim/raw-base/screenshot.png)
  - `blast-radius-cache-sweep` [record](scenarios/skills/blast-radius-cache-sweep/raw-base/record.json) · [截图](scenarios/skills/blast-radius-cache-sweep/raw-base/screenshot.png)
  - `create-formal-verification-skill-lease-mutex` [record](scenarios/skills/create-formal-verification-skill-lease-mutex/raw-base/record.json) · [截图](scenarios/skills/create-formal-verification-skill-lease-mutex/raw-base/screenshot.png)
  - `create-verification-skill-notes-web` [record](scenarios/skills/create-verification-skill-notes-web/raw-base/record.json) · [截图](scenarios/skills/create-verification-skill-notes-web/raw-base/screenshot.png)
  - `figure-it-out-var-migration-playbook` [record](scenarios/skills/figure-it-out-var-migration-playbook/raw-base/record.json) · [截图](scenarios/skills/figure-it-out-var-migration-playbook/raw-base/screenshot.png)
  - `how-request-flow` [record](scenarios/skills/how-request-flow/raw-base/record.json) · [截图](scenarios/skills/how-request-flow/raw-base/screenshot.png)
  - `interrogate-cart-discount-break` [record](scenarios/skills/interrogate-cart-discount-break/raw-base/record.json) · [截图](scenarios/skills/interrogate-cart-discount-break/raw-base/screenshot.png)
  - `maintain-formal-verification-skill-seat-oversell` [record](scenarios/skills/maintain-formal-verification-skill-seat-oversell/raw-base/record.json) · [截图](scenarios/skills/maintain-formal-verification-skill-seat-oversell/raw-base/screenshot.png)
  - `maintain-verification-skill-drifted-notes` [record](scenarios/skills/maintain-verification-skill-drifted-notes/raw-base/record.json) · [截图](scenarios/skills/maintain-verification-skill-drifted-notes/raw-base/screenshot.png)
  - `principle-attack-the-premise-apply` [record](scenarios/skills/principle-attack-the-premise-apply/raw-base/record.json) · [截图](scenarios/skills/principle-attack-the-premise-apply/raw-base/screenshot.png)
  - `principle-boundary-discipline-apply` [record](scenarios/skills/principle-boundary-discipline-apply/raw-base/record.json) · [截图](scenarios/skills/principle-boundary-discipline-apply/raw-base/screenshot.png)
  - `principle-build-the-lever-apply` [record](scenarios/skills/principle-build-the-lever-apply/raw-base/record.json) · [截图](scenarios/skills/principle-build-the-lever-apply/raw-base/screenshot.png)
  - `principle-encode-lessons-in-structure-apply` [record](scenarios/skills/principle-encode-lessons-in-structure-apply/raw-base/record.json) · [截图](scenarios/skills/principle-encode-lessons-in-structure-apply/raw-base/screenshot.png)
  - `principle-exhaust-the-design-space-apply` [record](scenarios/skills/principle-exhaust-the-design-space-apply/raw-base/record.json) · [截图](scenarios/skills/principle-exhaust-the-design-space-apply/raw-base/screenshot.png)
  - `principle-experience-first-apply` [record](scenarios/skills/principle-experience-first-apply/raw-base/record.json) · [截图](scenarios/skills/principle-experience-first-apply/raw-base/screenshot.png)
  - `principle-explain-the-number-apply` [record](scenarios/skills/principle-explain-the-number-apply/raw-base/record.json) · [截图](scenarios/skills/principle-explain-the-number-apply/raw-base/screenshot.png)
  - `principle-fix-root-causes-apply` [record](scenarios/skills/principle-fix-root-causes-apply/raw-base/record.json) · [截图](scenarios/skills/principle-fix-root-causes-apply/raw-base/screenshot.png)
  - `principle-foundational-thinking-apply` [record](scenarios/skills/principle-foundational-thinking-apply/raw-base/record.json) · [截图](scenarios/skills/principle-foundational-thinking-apply/raw-base/screenshot.png)
  - `principle-guard-the-context-window-apply` [record](scenarios/skills/principle-guard-the-context-window-apply/raw-base/record.json) · [截图](scenarios/skills/principle-guard-the-context-window-apply/raw-base/screenshot.png)
  - `principle-laziness-protocol-apply` [record](scenarios/skills/principle-laziness-protocol-apply/raw-base/record.json) · [截图](scenarios/skills/principle-laziness-protocol-apply/raw-base/screenshot.png)
  - `principle-make-operations-idempotent-apply` [record](scenarios/skills/principle-make-operations-idempotent-apply/raw-base/record.json) · [截图](scenarios/skills/principle-make-operations-idempotent-apply/raw-base/screenshot.png)
  - `principle-migrate-callers-then-delete-legacy-apis-apply` [record](scenarios/skills/principle-migrate-callers-then-delete-legacy-apis-apply/raw-base/record.json) · [截图](scenarios/skills/principle-migrate-callers-then-delete-legacy-apis-apply/raw-base/screenshot.png)
  - `principle-minimize-reader-load-apply` [record](scenarios/skills/principle-minimize-reader-load-apply/raw-base/record.json) · [截图](scenarios/skills/principle-minimize-reader-load-apply/raw-base/screenshot.png)
  - `principle-model-the-domain-apply` [record](scenarios/skills/principle-model-the-domain-apply/raw-base/record.json) · [截图](scenarios/skills/principle-model-the-domain-apply/raw-base/screenshot.png)
  - `principle-never-block-on-the-human-apply` [record](scenarios/skills/principle-never-block-on-the-human-apply/raw-base/record.json) · [截图](scenarios/skills/principle-never-block-on-the-human-apply/raw-base/screenshot.png)
  - `principle-outcome-oriented-execution-apply` [record](scenarios/skills/principle-outcome-oriented-execution-apply/raw-base/record.json) · [截图](scenarios/skills/principle-outcome-oriented-execution-apply/raw-base/screenshot.png)
  - `principle-prove-it-works-apply` [record](scenarios/skills/principle-prove-it-works-apply/raw-base/record.json) · [截图](scenarios/skills/principle-prove-it-works-apply/raw-base/screenshot.png)
  - `principle-redesign-from-first-principles-apply` [record](scenarios/skills/principle-redesign-from-first-principles-apply/raw-base/record.json) · [截图](scenarios/skills/principle-redesign-from-first-principles-apply/raw-base/screenshot.png)
  - `principle-separate-before-serializing-shared-state-apply` [record](scenarios/skills/principle-separate-before-serializing-shared-state-apply/raw-base/record.json) · [截图](scenarios/skills/principle-separate-before-serializing-shared-state-apply/raw-base/screenshot.png)
  - `principle-sequence-verifiable-units-apply` [record](scenarios/skills/principle-sequence-verifiable-units-apply/raw-base/record.json) · [截图](scenarios/skills/principle-sequence-verifiable-units-apply/raw-base/screenshot.png)
  - `principle-subtract-before-you-add-apply` [record](scenarios/skills/principle-subtract-before-you-add-apply/raw-base/record.json) · [截图](scenarios/skills/principle-subtract-before-you-add-apply/raw-base/screenshot.png)
  - `principle-test-behavior-not-implementation-apply` [record](scenarios/skills/principle-test-behavior-not-implementation-apply/raw-base/record.json) · [截图](scenarios/skills/principle-test-behavior-not-implementation-apply/raw-base/screenshot.png)
  - `principle-type-system-discipline-apply` [record](scenarios/skills/principle-type-system-discipline-apply/raw-base/record.json) · [截图](scenarios/skills/principle-type-system-discipline-apply/raw-base/screenshot.png)
  - `statechart-order-ship-rule` [record](scenarios/skills/statechart-order-ship-rule/raw-base/record.json) · [截图](scenarios/skills/statechart-order-ship-rule/raw-base/screenshot.png)
  - `statechart-order-ship-rule-image` [record](scenarios/skills/statechart-order-ship-rule-image/raw-base/record.json) · [截图](scenarios/skills/statechart-order-ship-rule-image/raw-base/screenshot.png)
  - `statechart-order-ship-rule-mermaid` [record](scenarios/skills/statechart-order-ship-rule-mermaid/raw-base/record.json) · [截图](scenarios/skills/statechart-order-ship-rule-mermaid/raw-base/screenshot.png)
  - `swarm-boundary-scan` [record](scenarios/skills/swarm-boundary-scan/raw-base/record.json) · [截图](scenarios/skills/swarm-boundary-scan/raw-base/screenshot.png)
  - `tdd-sum-negative-regression` [record](scenarios/skills/tdd-sum-negative-regression/raw-base/record.json) · [截图](scenarios/skills/tdd-sum-negative-regression/raw-base/screenshot.png)
  - `teach-token-bucket` [record](scenarios/skills/teach-token-bucket/raw-base/record.json) · [截图](scenarios/skills/teach-token-bucket/raw-base/screenshot.png)
  - `technical-writing-budget-doc` [record](scenarios/skills/technical-writing-budget-doc/raw-base/record.json) · [截图](scenarios/skills/technical-writing-budget-doc/raw-base/screenshot.png)
  - `typescript-best-practices-user-state` [record](scenarios/skills/typescript-best-practices-user-state/raw-base/record.json) · [截图](scenarios/skills/typescript-best-practices-user-state/raw-base/screenshot.png)
  - `unslop-readme-prose` [record](scenarios/skills/unslop-readme-prose/raw-base/record.json) · [截图](scenarios/skills/unslop-readme-prose/raw-base/screenshot.png)
  - `why-retry-rationale` [record](scenarios/skills/why-retry-rationale/raw-base/record.json) · [截图](scenarios/skills/why-retry-rationale/raw-base/screenshot.png)
- 附加证据：`playbook-pause-safely` 内调用 `skill {name:"unslop"}` 报 `skill "unslop" is not available for model invocation` [record](scenarios/playbooks/playbook-pause-safely/raw-base/record.json)。
- 现象：45 个技能场景的 `skillLoads` 全为空；其中 6 个带 `skill-loaded` 断言（`architect`、`arena`、`how`、`interrogate`、`swarm`、`why`）机械失败。其余 39 个未把加载写成断言，只记 warning。逐条读 `assistantText`：多数产出仍达到 rubric（如 `how` 的三层结构+踩坑、`architect` 的调用方优先设计、`blast-radius` 实跑验证、`create-verification-skill` 真实起服务驱动），但这些都是基座模型自身完成，不能归因于技能。
- 根因：raw 技能树 58 个技能中 57 个带 `disable-model-invocation: true`，不在模型可见的技能目录里；纯自然语言提示没有 `/name` 手势，worker 的 standard 预设也没有 pstack 路由注入。因此模型既看不到技能、也无从选择，只能按通用能力直接作答。`skill` 工具对隐藏技能会直接报“not available for model invocation”（pause-safely 实测）。
- 与当前阶段 dsh.md 的关系：`raw/dsh.md` 第 12 行只写了 `skill`（目录技能）和 `read <pstack>/skills/<name>/SKILL.md` 兜底，未提现行 DSH 的 `pstack_skill`；但 dsh.md 是“已加载技能”读的映射表，无法驱动顶层把自然语言请求路由到隐藏技能，所以这不是单纯改文案能补上的。
- 建议动作：需在“加载策略”上拍板，见第 4 节。
- 你的决定：

### Q2 `swarm-boundary-scan` 证据被提前截断，形成假阴性

- 类型：待你判断
- 影响场景：`swarm-boundary-scan` [record](scenarios/skills/swarm-boundary-scan/raw-base/record.json) · [截图](scenarios/skills/swarm-boundary-scan/raw-base/screenshot.png)
- 现象：`record.session.assistantText` 只有 186 字（第 1 轮的三句过渡语：“I'll look… / Four tiny files… / Four reviewers are running in parallel; I'll assemble the table once they report back.”），截图（1280×833，明显短于其他场景）也停在同一句。但本地 session `session-ac9039e0-7e7c-4558-b046-6d2cc8c5711c` 实有 5 个 turn：turn 1 派发 4 个子代理后结束，turn 2–4 逐个收报告，**turn 5 已输出含 `safeDivide`/`parseConfig`/`clamp`/`slugify` 的完整汇总表**并实跑校验。`mechanicalFailures` 报的四条 `assistant reply lacks …` 与 `skill was not loaded`，都是按被截断的第 1 轮文本判出来的假阴性。
- 根因：采集把“用户首轮 `turn/end`”当作完成信号并快照；本场景首轮结束时 4 个子代理仍在跑，结果经子代理完成通知在后续 turn 才回写，采集在 turn 1 后就定格。这是 playground 采集时机问题，不是技能问题。
- 与当前阶段 dsh.md 的关系：不影响 `raw/dsh.md` 判定。
- 建议动作：采集在快照前应等到会话静默（无在途子代理、无后台 job）或跟随子代理续跑的 turn；随后重采 `swarm-boundary-scan`。
- 你的决定：

### Q3 可选插件查询 `plugin_manager` 被策略拒绝，7 个场景降级自建

- 类型：ignore-environment
- 影响场景：
  - `playbook-autopilot-stack` [record](scenarios/playbooks/playbook-autopilot-stack/raw-base/record.json) · [截图](scenarios/playbooks/playbook-autopilot-stack/raw-base/screenshot.png)
  - `playbook-babysit` [record](scenarios/playbooks/playbook-babysit/raw-base/record.json) · [截图](scenarios/playbooks/playbook-babysit/raw-base/screenshot.png)
  - `playbook-multi-phase-plan` [record](scenarios/playbooks/playbook-multi-phase-plan/raw-base/record.json) · [截图](scenarios/playbooks/playbook-multi-phase-plan/raw-base/screenshot.png)
  - `playbook-opening-a-pr` [record](scenarios/playbooks/playbook-opening-a-pr/raw-base/record.json) · [截图](scenarios/playbooks/playbook-opening-a-pr/raw-base/screenshot.png)
  - `playbook-perf-issue` [record](scenarios/playbooks/playbook-perf-issue/raw-base/record.json) · [截图](scenarios/playbooks/playbook-perf-issue/raw-base/screenshot.png)
  - `playbook-prototype` [record](scenarios/playbooks/playbook-prototype/raw-base/record.json) · [截图](scenarios/playbooks/playbook-prototype/raw-base/screenshot.png)
  - `statechart-order-ship-rule-image` [record](scenarios/skills/statechart-order-ship-rule-image/raw-base/record.json) · [截图](scenarios/skills/statechart-order-ship-rule-image/raw-base/screenshot.png)
- 现象：`plugin_manager`（`list_plugins`/`list_bundles`）统一报 `the user rejected escalating this plugin management operation to "danger-full-access"; it stays denied`。技能据此降级：`statechart` 手写 SVG + `@resvg/resvg-js` 自渲染 PNG；`prototype` 用 playwright 自截图；均告完成。
- 根因：unattended 预设 + `workspace-write` + approval `never` 下，`plugin_manager` 需要 `danger-full-access`，被自动拒绝。属环境权限限制，不是技能缺陷。
- 与当前阶段 dsh.md 的关系：`raw/dsh.md` 无“可选能力/插件”章节，技能无从得知哪些能力需要插件；但拒绝本身由环境策略决定。
- 建议动作：归 `ignore-environment`；若要验证依赖插件/浏览器的分支，改在允许 `danger-full-access` 的环境矩阵跑。
- 你的决定：

### Q4 worker 具备 `gh` 凭证并产生真实远端副作用

- 类型：待你判断
- 影响场景：
  - `playbook-autopilot-full` [record](scenarios/playbooks/playbook-autopilot-full/raw-base/record.json) · [截图](scenarios/playbooks/playbook-autopilot-full/raw-base/screenshot.png)
  - `playbook-autopilot-stack` [record](scenarios/playbooks/playbook-autopilot-stack/raw-base/record.json) · [截图](scenarios/playbooks/playbook-autopilot-stack/raw-base/screenshot.png)
  - `playbook-feature` [record](scenarios/playbooks/playbook-feature/raw-base/record.json) · [截图](scenarios/playbooks/playbook-feature/raw-base/screenshot.png)
- 现象：`playbook-autopilot-full` 真实创建私有仓库 `github.com/l246804/shop` 并把 3 个 PR 合并进 `main`（截图内可见 PR #1/#2/#3 与合并提交）；`playbook-feature` 建了 `github.com/l246804/notes-app` 并开 PR #1；`playbook-autopilot-stack` 探测到 GitHub 已认证并建 `report-app`。
- 根因：worker 环境实际存在 `gh` 认证，与 `playground/AGENTS.md`「worker 不携带 Git/GitHub 凭证，避免真实远端副作用」相悖。
- 与当前阶段 dsh.md 的关系：`raw/dsh.md` 的 Cursor-only 行让技能用 `gh`，本身没错；副作用来自环境带了真实凭据。
- 建议动作：需你判断（见第 4 节）。若不应有远端副作用，须在 worker 环境阻断 `gh`/网络并清理已建仓库；若确需验证 PR 类技能，改用专用测试账号并在记录中标注。
- 你的决定：

### Q5 `assistant-contains` 断言与产物/回复不匹配（`arena`、`why`）

- 类型：待你判断
- 影响场景：
  - `arena-duration-parser-bakeoff` [record](scenarios/skills/arena-duration-parser-bakeoff/raw-base/record.json) · [截图](scenarios/skills/arena-duration-parser-bakeoff/raw-base/screenshot.png)
  - `why-retry-rationale` [record](scenarios/skills/why-retry-rationale/raw-base/record.json) · [截图](scenarios/skills/why-retry-rationale/raw-base/screenshot.png)
- 现象：两场景的产物文件已含目标符号（`arena` 写回 `src/duration.ts` 的 `parseDuration`，`why` 引用的 `fetchWithRetry`），但断言检查的是回复文本，回复未逐字复述符号，机械判 `assistant reply lacks "…"`；语义产出（5 版对比选型、ADR+实测证据）均达标。
- 根因：断言用 `assistant-contains` 检查了只存在于文件里的实现符号，与产物事实脱节。
- 与当前阶段 dsh.md 的关系：不影响 `raw/dsh.md`；属场景断言设计。
- 建议动作：把这两条改成 `artifact-contains` 或删除，交 rubric 语义判定。
- 你的决定：

### Q6 工具契约摩擦（普遍存在，均已自恢复）

- 类型：ignore-environment
- 影响场景（部分）：`playbook-perf-issue`、`playbook-orchestrate`、`playbook-eval`、`playbook-feature`、`playbook-autopilot-stack`、`playbook-opening-a-pr`、`principle-explain-the-number-apply`、`principle-model-the-domain-apply`、`principle-boundary-discipline-apply`、`principle-fix-root-causes-apply`、`principle-separate-before-serializing-shared-state-apply`、`create-formal-verification-skill-lease-mutex`、`create-verification-skill-notes-web`、`maintain-formal-verification-skill-seat-oversell`、`playbook-refactoring`、`playbook-prototype` 等（记录于各 `record.session.analysis.warnings` / `tools.failures`）。
- 现象：`bash` 缺 `description` 必填字段被拒后补上；`job_output` 用了不存在的 job id（`unknown job …`）；`list_subagent_models` 传 `provider/magpie model/magpie` 报 route 不允许；`edit` 偶发未匹配后重试；`read` 引用了 raw 树里不存在的 `control-ui/SKILL.md`。全部在一次重试内恢复。
- 根因：worker 的工具 schema 与模型调用习惯不一致；不影响最终产出。
- 与当前阶段 dsh.md 的关系：不影响 `raw/dsh.md` 判定。
- 建议动作：归 `ignore-environment`；可选在预设层把 `bash` 的 `description` 设为可选或给调用示例，减少无效重试。
- 你的决定：

### Q7 `setup-pstack` 写入宿主 `$DSH_HOME` 被沙箱拒绝

- 类型：ignore-environment
- 影响场景：`setup-pstack-model-config` [record](scenarios/skills/setup-pstack-model-config/raw-base/record.json) · [截图](scenarios/skills/setup-pstack-model-config/raw-base/screenshot.png)
- 现象：技能尝试写 `<HOST_PATH>` 两次被拒，改为在 `out/pstack-models.md` 交付可粘贴的逐角色配置，未直接应用；探测结果与预算降档（large→该模型无 xhigh→high）本身正确。
- 根因：`workspace-write` 沙箱不允许写宿主 `$DSH_HOME`。
- 与当前阶段 dsh.md 的关系：`raw/dsh.md` 的 setup-pstack 段（写 `$DSH_HOME/pstack-models.json`）本身正确，受限是环境。
- 建议动作：归 `ignore-environment`；需要真正应用配置时在允许宿主写的环境跑。
- 你的决定：

### Q8 playbook fixture 普遍不含 git 仓库/远端，PR 与合入类步骤无法真实执行

- 类型：ignore-environment
- 影响场景（明确记录缺 git/远端的 12 个）：`playbook-authoring-a-skill`、`playbook-autonomous-run`、`playbook-autopilot-full`、`playbook-autopilot-stack`、`playbook-babysit`、`playbook-feature`、`playbook-multi-phase-plan`、`playbook-opening-a-pr`、`playbook-pause-safely`、`playbook-perf-issue`、`playbook-visual-parity`、`playbook-worktree-cleanup`。代表证据：`playbook-babysit` [record](scenarios/playbooks/playbook-babysit/raw-base/record.json) · [截图](scenarios/playbooks/playbook-babysit/raw-base/screenshot.png)。
- 现象：多数 playbook 的 workspace 没有 `git init`、没有远端、没有对应的 PR fixture。技能于是分两路：一路（`multi-phase-plan`、`perf-issue`、`pause-safely`、`opening-a-pr`）自行 `git init` 后降级为本地提交或本地 PR 文稿；一路（`babysit`）找不到 PR #128，明确说明降级为本地证据并请用户补仓库。`autopilot-full`/`feature` 则因环境带 `gh` 凭据反而建了真实远端（见 Q4）。
- 根因：`playground/AGENTS.md` 规定「每个 scenario workspace 由 runner 初始化本地 `git init`，不设置 origin」，但本批 playbook fixture 实际未落到 git 初始化；PR/合入类分支缺少可执行的本地 fixture。
- 与当前阶段 dsh.md 的关系：不影响 `raw/dsh.md` 判定；属 fixture/环境。
- 建议动作：归 `ignore-environment`；若要覆盖 PR/合入/清理分支，在 fixture 里初始化本地 git 并配一个本地 bare remote，而不是依赖真实 GitHub。
- 你的决定：

## 3. dsh.md 适配说明审查

raw 阶段只审查 `playground/raw/dsh.md`。

| 章节/行 | 当前说明 | 相关证据 | 结论 | 建议 |
| --- | --- | --- | --- | --- |
| 首段 映射原则 | 用表映射 Cursor 名，无对应行则丢弃并说明 | 全场景按表执行，未见误用 | 够用 | — |
| Tools · `Task`（L9） | `subagent` 立即返回 id、完成通知；`subagent_fork` 继承对话 | 34 个加载场景中 `subagent` 广泛成功（orchestrate、feature、autopilot、eval 等） | 够用 | 与现行 adapter 的 `pstack_subagent` 命名有漂移，port 阶段对齐 |
| Tools · `AskQuestion`（L10） | `ask_user_question` 批量提问；空 selected 跳过、timeout 记 pending | `principle-fix-root-causes`、`principle-redesign`、`principle-subtract`、`typescript`、`setup-pstack` 均正常使用 | 够用 | — |
| Tools · 待办清单（L11） | 跳过步骤保留 `pending` + `skip:`，无 skipped 状态 | `todo_write` 广泛成功 | 够用 | 现行 adapter 要求 `completed`+`skip:`，措辞可对齐（低优先） |
| Tools · 运行另一 pstack 技能（L12） | `skill` 按名加载目录技能；`disable-model-invocation` 用 `read <pstack>/skills/<name>/SKILL.md`；`/name` 手势直接注入 | `playbook-pause-safely` 调 `skill {name:"unslop"}` 报 `not available for model invocation`；45 技能场景 `skillLoads` 为空；`/name` 手势场景全部成功 | 缺失 | 补 `pstack_skill`（按精确 kebab 名，加载 `disable-model-invocation` 隐藏技能），`read SKILL.md` 降为兜底 |
| Tools · `Grep`/`Glob`（L13） | 原生 `grep`/`glob`，二者皆无才用 `bash rg` | 全场景 `grep`/`glob` 正常 | 够用 | — |
| Subagent fields · `readonly`（L21） | 无沙箱字段；prompt 写“不要编辑”，靠会话权限与 `git status` | `no-comments` 的 Comment Sicko 子代理只分类不改码，未越权 | 误导 | 现行 adapter 用 `readonly` 预设沙箱；raw 措辞偏弱，port 阶段对齐 |
| Models（L34–L38） | `provider`/`model`/`reasoning_effort` 路由；id 取自 `list_subagent_models`；角色文件 `$DSH_HOME/pstack-models.json` | `setup-pstack` 探测到单模型并落 `high`；`playbook-perf-issue` 传 `magpie/magpie` 报 route 不允许（用法问题） | 够用 | 可加“只用返回的 route 原样，勿自拼 provider=model” |
| setup-pstack（L42–L46） | 用 `list_subagent_models`；写 `$DSH_HOME/pstack-models.json` | `setup-pstack` 场景：宿主路径写入 2 次被沙箱拒，改为 `out/` 交付 | 够用 | 文档正确；写入受限属环境（Q7） |
| Paths（L52–L56） | 项目技能 `.dsh/skills/` 或 `.agents/skills/`；用户 `$DSH_HOME/skills/` 或 `$DSH_AGENTS_HOME/skills/` | `playbook-authoring` 写 `.agents/skills/release-check` 并被识别；`create-verification` 写 `verify/` | 够用 | — |
| Cursor-only features（L60–L67） | 无 Automations/Bugbot/云代理/内置 PR；PR 用 `gh`，非跳过 | `autopilot` 用 `gh` 建仓合并；`babysit` 找不到 PR 时降级本地证据 | 够用 | `gh` 可达与“无远端”假设冲突，属环境（Q4） |
| （缺）Optional plugins / Local replacements | 未提供 | `plugin_manager` 被拒 7 场景；`prototype` 读 `control-ui/SKILL.md` 不存在；`ketchup-video` 用 ffmpeg 自渲染、`statechart` 自渲染 PNG 均成功 | 缺失 | 补可选能力类别（浏览器/渲染/媒体/会话搜索）与本地替代映射，供技能判断降级 |

## 4. 待用户判断的问题

1. **Q1 技能加载策略（最重要）**：45/59 技能场景在纯自然语言提示下完全没加载技能，等于这批场景没有真正验证到技能在 DSH 的运转。可选方向：(a) 技能场景统一加 `/name` 手势或显式点名技能；(b) 改在 `poteto-mode` 根预设下跑，由预设注入路由；(c) 仅修 `raw/dsh.md` 的加载行。三者影响后续所有技能回归，需拍板。
2. **Q2 `swarm` 采集截断**：是否修采集器（等会话静默/跟随子代理续跑 turn 后再快照）并重采该场景。当前记录与截图是假阴性。
3. **Q4 GitHub 真实副作用**：worker 是否应带 `gh` 凭证？已真实创建 `l246804/shop`、`l246804/notes-app` 等私有仓库并合并 PR，是否需清理或改用专用测试账号。
4. **Q5 断言调整**：`arena`/`why` 的 `assistant-contains` 是否改为 `artifact-contains` 或删除。

## 5. 后续动作

- **dsh-md（raw 阶段可落地）**：
  1. `playground/raw/dsh.md` 的“运行另一 pstack 技能”行补 `pstack_skill`（按精确 kebab 名，可加载 `disable-model-invocation` 隐藏技能），把 `read SKILL.md` 降为兜底，并说明 `/name` 手势直接注入。
  2. `playground/raw/dsh.md` 增补“可选能力/本地替代”章节（浏览器驱动、图片渲染、媒体编码、会话搜索、PR 通道），并注明 `plugin_manager` 需 `danger-full-access`。
- **plugin**：本阶段无结论落到插件开发。
- **upstream**：本阶段未见上游技能自身缺陷（上游文案/结构问题不属本仓回归范围，未纳入）。
- **ignore-environment**：`plugin_manager` 需 `danger-full-access` 被拒（Q3）、工具 schema 摩擦（Q6）、`setup-pstack` 宿主路径写入受限（Q7）、playbook fixture 缺 git/远端（Q8）。
- **待第 4 节拍板后再动**：Q1 技能加载策略、Q2 采集器修复与 `swarm` 重采、Q4 `gh` 凭据与远端副作用、Q5 断言改法。
