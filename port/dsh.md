# pstack in DeepSeek Harness

pstack skills use Cursor names. In DeepSeek Harness, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/` in the installed `dsh-pstack` package.

Use only tools visible in the current session. If a mapped tool or optional capability is unavailable, follow the fallback in that row. Do not assume optional plugins are enabled because a name appears here.

## Tools

| Cursor | DeepSeek Harness |
| --- | --- |
| `Task` | `pstack_subagent` starts one child per selected role route and returns every child id with its resolved route. Only `prompt` is required; `description`, `agent`, `role`, `roleRoute`, `reasoningEffort`, `cwd`, and `maxDepth` are optional. For a multi-route list role, pass a `roleRoute` id from `pstack_roles`; omission fails instead of selecting the first route. It validates routes and effort before starting; a later failure returns a partial result. |
| `AskQuestion` | `ask_user_question` takes a batch of questions with options and free input. Only a live root agent can receive an answer; a delegated child keeps its questions in its result. Ask in plain text when the tool is absent. |
| Open a todolist | `todo_write` replaces the whole list and has no `skipped` status. Keep a skipped step visible as `skip: <reason> - <step>` in `content` and mark it `completed`. |
| Run another pstack skill (`/name` or "the **name** skill") | `pstack_skill` loads a pstack skill by exact kebab-case `name`, including skills hidden from the native `skill` tool. Pass a relative `resource` for a reference or playbook beside `SKILL.md`; a user `/name` gesture loads the skill directly. |
| `Grep`, `Glob` | `grep` and `glob` are native tools; call them directly. Use `bash` with `rg` only when the session has neither. |

## Subagent fields

| Cursor | DeepSeek Harness |
| --- | --- |
| `subagent_type: generalPurpose` | `agent: "general"` joins the parent preset and inherits its tools. Only `prompt` is required; omit unused `description`, `role`, `roleRoute`, `reasoningEffort`, or `cwd`. |
| `poteto-agent`, `comment-sicko` | `agent: "poteto-agent"` or `agent: "comment-sicko"`. They are agent presets, not `subagent_type` values. |
| `readonly: true` | `agent: "readonly"`: the child receives a read-only sandbox. Use `general` when the child needs to write. |
| `readonly: false` | `agent: "general"`. |
| `environment: "cloud"` | No cloud agents. Use `create_worktree` when available and pass its checkout as `cwd`; otherwise skip with the line. |
| `environment: "local"` | `cwd: null`; the child inherits the session directory. |
| `cloud_base_branch: <b>` | Pass `<b>` as `create_worktree.from`; otherwise tell the child to check out `<b>`. |
| `run_in_background: true` | Omit. `pstack_subagent` is managed and reports by completion notice. |
| `resume` | `send_message` to the existing child id continues it; start a new `pstack_subagent` only when it stopped permanently. |
| `file_attachments` | List the real paths in `prompt`; the child reads them with `read`. |

## Models

| Cursor | DeepSeek Harness |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]` | Do not pass a Cursor slug. Pass `role: "<role key>"`; `pstack_subagent` reads `$DSH_HOME/pstack-models.json` and supplies the configured route. Drop `-fast`; DSH has no speed parameter. |
| A `grok-*` or other non-Claude slug | Pass `role: null` or `roleRoute: null` so the child inherits the parent route, and say so. |
| `auto` or `inherit-parent` | Pass `role: null`, or configure the role route as `inherit-parent` or `auto`. |
| The pstack role file | `$DSH_HOME/pstack-models.json`, where `$DSH_HOME` defaults to `~/.dsh`. Base DSH does not load it; `pstack_subagent` reads it on every delegation. A missing file makes every role inherit the parent route. |
| A role value such as `<model> <effort>` | Write `provider/model [effort]`; one role holds an array of these route strings. Multi-route list roles require a `roleRoute` id from `pstack_roles`; automatic panels start one child per route. |

## setup-pstack

`setup-pstack` writes `$DSH_HOME/pstack-models.json`, the role file the adapter reads on every delegation. Use `pstack_models` to discover the live provider, model, and effort routes; do not infer them from Cursor slugs.

- Detect: write each real route as `provider/model [effort]`. If nothing is detectable, ask the user to paste the routes.
- Defaults: map each found route; use `inherit-parent` or `auto` for an unserved route. Apply the selected budget to the closest advertised effort and say what was chosen.
- Write: write `version: 1`, an optional `budget`, and a `roles` object of route arrays. Overwrite the whole file so a rerun is idempotent; a missing role inherits the parent route.

## Paths

| Cursor | DeepSeek Harness |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | Project skills live in `.dsh/skills/` or `.agents/skills/`; user skills live in `$DSH_HOME/skills/` or `~/.agents/skills/`. Packaged pstack skills load through `pstack_skill`. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | Resolve package resources beside their `SKILL.md`; a plugin manifest is the `dsh` section of its `package.json`. |
| `.cursor/rules/*.mdc`, always-applied rules | The `AGENTS.md`-compatible chain. Base DSH never reads `.mdc`; the pstack role file is read only by the adapter. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when the package ships it. Read the local copy and give the user the public URL when needed. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `$DSH_HOME/sessions/<workspace-key>/<session>.jsonl`. Optional session search adds model-facing search tools. |

## Cursor-only features

DeepSeek Harness has no Cursor Automations, Bugbot, Cursor cloud agents, or built-in PR tool. When a step needs one, write one line in your reply, `Skipped in DeepSeek Harness: <step>. <reason>.`, then continue. A skipped step is not a passed step.

| Cursor | DeepSeek Harness |
| --- | --- |
| Cursor Automations, routines, webhooks, and `SendToUser` secrets | Skip with the line. Use local scheduling or background work where it fits the step. |
| Bugbot | Treat PR comments as ordinary review threads and use the step's `gh` command; skip starting or waiting for Bugbot when there is no check or comment. |
| Cursor cloud agents | Map `environment: "cloud"` to a local worktree; skip steps that need the cloud machine itself. |
| A built-in PR tool | Use the step's `gh` command through `bash`; that is not a skip, so write no line. |
| Cursor Projects | Skip with the line; there is no persistent cloud Project coordinator. |

## Plugin tools

The package registers four model-facing tools beyond the native DSH tools above.

| Tool | Purpose |
| --- | --- |
| `pstack_subagent` | Start one child per selected role route and return every child id with its resolved route; completion arrives as a notice. |
| `pstack_skill` | Load any pstack skill by exact kebab-case name, including hidden skills; `resource` reads a reference or playbook. |
| `pstack_models` | List the full provider, model, and reasoning-effort routes this deployment serves, not only the parent session route. |
| `pstack_roles` | List pstack roles, each role's shape, and configured route ids for `roleRoute`. |

## Local replacements

| Cursor | DeepSeek Harness |
| --- | --- |
| `create-skill` | Use the vendored `writing-for-agents` skill to create or review a skill, then write and validate its `SKILL.md` directly. |
| `/deslop` | Use the vendored `deslop` skill for code slop; `unslop` is only for prose. |
| `/loop` | Use `create_goal` for automatic continuation, `schedule_create` for a timed heartbeat, or a background `bash` watcher for observable events. |
| `/automate` | Use `writing-for-agents` to turn verified work patterns into a personal skill; fall back to available session evidence when history search is unavailable. |
| Custom Mode | Select the shipped `poteto-mode` or `poteto-mode-creator` root preset at session creation. |
| `/visualize` | Return Mermaid text for diagrams; DSH has no built-in chart renderer, so do not claim an image. |
| `statechart` | Return Mermaid text for the chart; DSH has no built-in SVG renderer, so do not claim an image. |
| `ketchup-video` | Run a skill-owned renderer when it produces a verifiable artifact; otherwise return the text summary and say so. |
| `control-ui`, `control-cli`, `cursor-team-kit` | Use the vendored instruction skills; their browser or PTY requirements are stated in their own `SKILL.md`. |
