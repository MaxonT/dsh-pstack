# pstack in DSH

pstack skills use Cursor names. In DSH, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/`. Each DSH cell gives the replacement, the missing-field action, and the fallback that changes how a skill runs. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

## Tools

| Cursor | DSH |
| --- | --- |
| `Task` | `subagent` returns an id immediately and notifies on completion; `subagent_fork` inherits the conversation. Put the role in `prompt` and the directory in `cwd`; see Subagent fields for the missing Cursor fields. |
| `AskQuestion` | `ask_user_question` takes a batch of questions. Empty `selected` with no `custom` means the user skipped; a timeout is `pending`, not skipped. Ask in plain text when the tool is absent. |
| Open a todolist | `todo_write` replaces the whole list; statuses are `pending`, `in_progress`, and `completed`. A skipped step stays `pending` with content `skip: <reason>`; there is no `skipped` status. |
| Run another pstack skill (`/name` or "the **name** skill") | `skill` loads a catalog skill by name. For `disable-model-invocation: true`, `read` `<pstack>/skills/<name>/SKILL.md`. A user `/name` gesture injects the skill directly; do not call `skill` again. |
| `Grep`, `Glob` | `grep` and `glob` are native tools; call them directly. Use `bash` with `rg` only when the session has neither. |

## Subagent fields

| Cursor | DSH |
| --- | --- |
| `subagent_type: generalPurpose` | No such field; omit it. The role comes from `prompt`, or from `<pstack>/agents/<name>.md` when named. |
| `poteto-agent`, `comment-sicko` | No native equivalents. Read `<pstack>/agents/<name>.md` and pass it as `prompt`, or write the role yourself. |
| `readonly: true` | No sandbox field. Put "do not edit files" in `prompt`, rely on the session permission mode, and check `git status`. |
| `readonly: false` | Omit. Writable is the default under the session permission mode. |
| `environment: "cloud"` | No cloud agents. Use `create_worktree` when available and pass its checkout as `cwd`; otherwise skip with the line. |
| `environment: "local"` | Omit. Local is the default. |
| `cloud_base_branch: <b>` | No such field. Pass `<b>` as `create_worktree.from`; otherwise tell the child to check out `<b>`. |
| `run_in_background: true` | Omit. `subagent` always returns immediately and notifies on completion. |
| `resume` | `send_message` to the child's `agent_id` continues it; start a new `subagent` only when the execution stopped permanently. |
| `file_attachments` | No such field. List the paths in `prompt`; the child reads them. |

## Models

| Cursor | DSH |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | Route with `provider`, `model`, and `reasoning_effort`; drop `-fast`. Valid ids come from `list_subagent_models`. |
| A `grok-*`, `gpt-*`, or other non-Claude slug | Pick the closest advertised route. If none matches, omit `provider` and `model`, let the child fall back, and say so. |
| `auto` or `inherit-parent` | Omit `provider` and `model`; omitted values use child or parent defaults. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | DSH reads no `.mdc`; role lines live in `$DSH_HOME/AGENTS.md`. Read that file when it is not in context. |
| A role value `<model> <effort>`, such as `opus high` | Write `<provider>/<model> <effort>`; split it into `provider`, `model`, and `reasoning_effort`. |

## setup-pstack

DSH has no rules directory and never reads `.mdc` files. Each session loads the `AGENTS.md`-compatible chain; the user-global file is `$DSH_HOME/AGENTS.md`. Follow its steps with these changes:

- Detect. Use `list_subagent_models`; write each served route as `<provider>/<model> <effort>`.
- Defaults. Map a served slug to its route; an unserved slug becomes `inherit-parent`.
- Write. Update `$DSH_HOME/AGENTS.md`, not the project `AGENTS.md`, and replace only the previous role-lines block.

## Paths

| Cursor | DSH |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | Project skills live in `.dsh/skills/` or `.agents/skills/`. User skills live in `$DSH_HOME/skills/` or `$DSH_AGENTS_HOME/skills/`; the latter defaults to `~/.agents`. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | A profile is `$DSH_HOME/profiles/<name>/`, holding `package.json` and `cordis.patch.yml`; a plugin manifest is the `dsh` section of its `package.json`. |
| `.cursor/rules/*.mdc`, always-applied rules | The `AGENTS.md`-compatible chain; DSH never reads `.mdc`. Project `AGENTS.md`/`AGENTS.local.md` plus user-global `$DSH_HOME/AGENTS.md`. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when the file exists. Read the local copy, never fetch it; give the user the URL when needed. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `$DSH_HOME/sessions/<workspace-key>/<session>.jsonl`, one append-only log per session. Optional session-search adds model-facing search tools. |

## Cursor-only features

DSH has no Cursor Automations, Bugbot, Cursor cloud agents, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in DSH: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

| Cursor | DSH |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | Skip with the line. |
| Bugbot | Treat PR comments as ordinary review threads and use the step's `gh` command; skip starting or waiting for Bugbot when there is no check or comment. |
| Cursor cloud agents | Map `environment: "cloud"` to a local worktree; skip steps that need the cloud machine itself. |
| A built-in PR tool | Use the step's `gh` command through `bash`; that is not a skip, so write no line. |
