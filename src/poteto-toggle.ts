/** Session-scoped poteto-workflow switch. */

import { Service } from "@deepseek-ai/cordis";
import type { Context } from "@deepseek-ai/cordis";
import type { Agent } from "@deepseek-ai/dsh-agent";
import type {} from "@deepseek-ai/dsh-agent-team";
import type { AgentPresetRegistry } from "@deepseek-ai/dsh-agent-preset-registry";
import type { ConfigEditor } from "@deepseek-ai/dsh-config-editor";
import type { SessionId } from "@deepseek-ai/dsh-session";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import type {} from "@deepseek-ai/dsh-agent-instructions";
import type { ProjectionHandle } from "@deepseek-ai/dsh-session-projection";
import { renderSkillContent } from "@deepseek-ai/dsh-skill";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import type {} from "@deepseek-ai/dsh-tools";
import type {} from "@deepseek-ai/dsh-system-prompt";
import type {} from "@deepseek-ai/dsh-typert-registry";

import { potetoSupportsPreset, resolvePotetoEnabled } from "./poteto/preset-gate.ts";
import { potetoProjectionDefinition, type PotetoProjectionState } from "./poteto/projection.ts";
import { POTETO_SERVICE } from "./poteto/remote.ts";
import { readSettings, writeSettings } from "./poteto/settings.ts";

export const name = "pstack-poteto-toggle";

const SECTION_NAME = "pstack:poteto-workflow";
const SECTION_ORDER = 10;
const AGENT_TEAM_ENTRY = "@deepseek-ai/dsh-agent-team";
const REMINDER =
  "Poteto workflow is active. Follow the poteto-mode skill in the system prompt strictly. Do not skip any required step or rule it names.";

function writeDefaultEnabled(enabled: boolean): void {
  writeSettings({ version: 1, potetoDefault: enabled });
}

/** Toggle poteto workflow for one Session. */
export class PotetoModeService extends TypertRemoteService {
  static inject = ["agents", "skills", "sessions", "sessionProjections", "systemPrompt", "typert"];

  private readonly lastUserMessage = new WeakMap<Agent, string>();
  private readonly lifts = new WeakMap<Agent, () => void>();
  private defaultEnabled = false;
  private sectionText = "";
  private projection!: ProjectionHandle<PotetoProjectionState>;

  constructor(ctx: Context) {
    super(ctx, POTETO_SERVICE);
  }

  protected async [Service.init](): Promise<void> {
    const settings = readSettings();
    this.defaultEnabled = settings.potetoDefault;
    this.projection = await this.ctx.sessionProjections.register(potetoProjectionDefinition);
    const skill = await this.ctx.skills.get("poteto-mode", {});
    if (skill === undefined) throw new Error("poteto-mode skill is not available");
    this.sectionText = [
      "Poteto workflow is enabled for this session. Strictly follow the poteto-mode skill below for every user request. Do not skip any required step or rule it names.",
      "",
      renderSkillContent(skill),
    ].join("\n");

    this.ctx.effect(
      () =>
        this.ctx.systemPrompt.section({
          name: SECTION_NAME,
          order: SECTION_ORDER,
          interpolate: false,
          text: ({ agent }) =>
            agent !== undefined && this.isEnabledFor(agent) ? this.sectionText : "",
        }),
      "pstack.poteto-toggle.section()",
    );

    this.ctx.effect(
      () =>
        this.ctx.on("agent/created", ({ agent }) => {
          if (agent.session.header.origin === "subagent") return;
          if (this.isEnabledFor(agent)) this.ensureNativeToolsRestricted(agent);
        }),
      "pstack.poteto-toggle.agent-created",
    );

    this.ctx.effect(
      () =>
        this.ctx.on(
          "agent/pre-step",
          async ({ agent, messages }, next) => {
            const decision = await next();
            if (decision.kind === "reject") return decision;
            if (!this.isEnabledFor(agent)) return decision;
            this.ensureNativeToolsRestricted(agent);
            const users = messages.filter((message) => message.source.kind === "user");
            const latest = users[users.length - 1];
            if (latest === undefined) return decision;
            if (this.lastUserMessage.get(agent) === latest.id) return decision;
            this.lastUserMessage.set(agent, latest.id);
            const injection = createUserMessage({
              content: [{ type: "text", text: REMINDER }],
              source: { kind: "agent-instructions", form: "instructions", changes: [] },
            });
            return { ...decision, messages: [...decision.messages, injection] };
          },
          { prepend: true },
        ),
      "pstack.poteto-toggle.pre-step",
    );
  }

  /** Whether poteto workflow is on for one exact Agent scope. */
  isEnabledFor(agent: Agent): boolean {
    return resolvePotetoEnabled({
      agentPreset: this.presetOf(agent),
      selected: this.projection.stateOf(agent.session).enabled,
      byDefault: this.defaultEnabled,
    });
  }

  /** The preset this Session runs under, reading the durable log record before the creation header. */
  private presetOf(agent: Agent): string | undefined {
    const registry = this.ctx.get("agentPresets") as AgentPresetRegistry | undefined;
    return registry?.presetForSession(agent.session) ?? agent.session.header.agentPreset;
  }

  /** Read the saved switch for one Session id. */
  status(sessionId: string): { enabled: boolean } {
    const agent = this.ctx.agents.get(sessionId as SessionId);
    return { enabled: agent === undefined ? this.defaultEnabled : this.isEnabledFor(agent) };
  }

  /** Read the global default used by new sessions. */
  getDefault(): { enabled: boolean } {
    return { enabled: this.defaultEnabled };
  }

  /** Save the global default used by new sessions. */
  setDefault(enabled: boolean, signal?: AbortSignal): { enabled: boolean } {
    signal?.throwIfAborted();
    writeDefaultEnabled(enabled);
    this.defaultEnabled = enabled;
    return { enabled };
  }

  /** Read the Agent Teams default used by new sessions. */
  getAgentTeamDefault(): { enabled: boolean } {
    const config = this.agentTeamConfig();
    return { enabled: config?.current["defaultEnabled"] === true };
  }

  /** Save the Agent Teams default used by new sessions. */
  async setAgentTeamDefault(enabled: boolean, signal?: AbortSignal): Promise<{ enabled: boolean }> {
    signal?.throwIfAborted();
    const config = this.agentTeamConfig();
    if (config === undefined) throw new Error("Agent Teams configuration is not available");
    await config.editor.edit(config.entry, (current) => ({ ...current, defaultEnabled: enabled }));
    return { enabled };
  }

  private agentTeamConfig():
    | {
        readonly editor: ConfigEditor;
        readonly entry: ReturnType<ConfigEditor["entries"]>[number];
        readonly current: Record<string, unknown>;
      }
    | undefined {
    const editor = this.ctx.get("configEditor") as ConfigEditor | undefined;
    if (editor === undefined) return undefined;
    const config = editor
      .configuration()
      .find(({ entry }) => entry.options.name === AGENT_TEAM_ENTRY);
    if (config === undefined) return undefined;
    return {
      editor,
      entry: config.entry,
      current: { ...config.inherited, ...config.override },
    };
  }

  /** Save the switch for one Session id. */
  async setEnabled(
    sessionId: string,
    enabled: boolean,
    signal?: AbortSignal,
  ): Promise<{ enabled: boolean }> {
    signal?.throwIfAborted();
    const agent = this.ctx.agents.get(sessionId as SessionId);
    if (agent === undefined) throw new Error(`session ${sessionId} is not live`);
    const preset = this.presetOf(agent);
    if (enabled && preset !== undefined && !potetoSupportsPreset(preset)) {
      throw new Error(`the poteto workflow is not available for the "${preset}" agent preset`);
    }
    if (this.isEnabledFor(agent) !== enabled) {
      agent.session.append("poteto/mode", { enabled });
      if (!(await this.ctx.sessions.flush(agent.session))) {
        throw new Error(`poteto mode for session ${sessionId} was not persisted`);
      }
    }
    if (enabled) this.ensureNativeToolsRestricted(agent);
    else this.clearNativeToolsRestriction(agent);
    return { enabled };
  }

  private ensureNativeToolsRestricted(agent: Agent): void {
    if (this.lifts.has(agent)) return;
    const names = ["subagent", "subagent_fork"].filter(
      (name) => agent.ctx.tools.get(name, agent) !== undefined,
    );
    if (names.length === 0) return;
    this.lifts.set(agent, agent.ctx.tools.restrict({ deny: names }));
  }

  private clearNativeToolsRestriction(agent: Agent): void {
    this.lifts.get(agent)?.();
    this.lifts.delete(agent);
  }
}

export default PotetoModeService;
