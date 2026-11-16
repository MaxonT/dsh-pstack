/**
 * `pstack_skill`: trusted loading of pstack skills by name.
 *
 * `dsh-tool-skill` applies the model-invocation policy at the catalog boundary.
 * `ctx.skills.get()` is invocation-neutral, which is the seam this tool uses to
 * load a skill the model skill catalog does not list.
 */

import type { Context } from "@deepseek-ai/cordis";
import { isSkillName, renderSkillContent } from "@deepseek-ai/dsh-skill";
import type { SkillRegistry, SkillResourceBase } from "@deepseek-ai/dsh-skill";
import type { JsonSchemaNode, ToolDefinition, ToolRunContext } from "@deepseek-ai/dsh-tools";

export const name = "pstack-skill";

export const inject = ["skills", "tools"];

export const TOOL_NAME = "pstack_skill";

/** The bundled pstack skill provider whose hidden skills this loader may reveal. */
const PSTACK_SKILL_PROVIDER = "pstack";

export interface LoadSkillResult {
  readonly name: string;
  readonly provider: string;
  readonly resourceBase?: SkillResourceBase;
  readonly content: string;
}

/** Render one loaded skill in the shape DSH skill tools use. */
export function renderLoadedSkill(result: LoadSkillResult): string {
  return renderSkillContent(result as unknown as Parameters<typeof renderSkillContent>[0]);
}

const OUTPUT_SCHEMA: JsonSchemaNode = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    provider: { type: "string" },
    resourceBase: {
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          properties: {
            kind: { type: "string", const: "directory" },
            path: { type: "string" },
          },
          required: ["kind", "path"],
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            kind: { type: "string", const: "url" },
            url: { type: "string" },
          },
          required: ["kind", "url"],
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            kind: { type: "string", const: "opaque" },
            description: { type: "string" },
          },
          required: ["kind", "description"],
        },
      ],
    },
    content: { type: "string" },
  },
  required: ["name", "provider", "content"],
};

const TOOL_DESCRIPTION = [
  "Load the full instructions of a packaged pstack skill by exact name.",
  "",
  "Use this when a pstack skill tells you to route through another packaged pstack skill that the `skill` tool does not load.",
  "",
  "Read a playbook or reference as a file under the skill's base directory; do not reload the skill to read its resources.",
].join("\n");

/** Build the tool for one skills registry. */
export function createPstackSkillTool(skills: SkillRegistry): ToolDefinition {
  return {
    name: TOOL_NAME,
    description: TOOL_DESCRIPTION,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: {
          type: "string",
          description: "Exact kebab-case skill name, such as `how` or `principle-prove-it-works`.",
        },
      },
      required: ["name"],
    },
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => [
        { type: "text", text: renderLoadedSkill(value as unknown as LoadSkillResult) },
      ],
    },
    isConcurrencySafe: () => true,
    async execute(rawArgs, exec: ToolRunContext) {
      if (typeof rawArgs !== "object" || rawArgs === null || Array.isArray(rawArgs)) {
        throw new Error("pstack_skill takes an object argument");
      }
      const skillName = (rawArgs as Record<string, unknown>)["name"];
      if (typeof skillName !== "string" || !isSkillName(skillName)) {
        throw new Error(`invalid skill name "${String(skillName)}"`);
      }
      const lookup = {
        signal: exec.signal,
        ...(exec.agent === undefined ? {} : { scope: exec.agent }),
      };
      const definition = await skills.get(skillName, lookup);
      if (definition === undefined) {
        throw new Error(`skill "${skillName}" is unknown or no longer available`);
      }
      // The native skill tool loads every catalog skill, including third-party ones.
      // This tool reaches only the hidden bundled pstack skills.
      if (definition.provider !== PSTACK_SKILL_PROVIDER) {
        throw new Error(
          `pstack_skill only loads bundled pstack skills; use the skill tool for "${skillName}"`,
        );
      }
      const result: LoadSkillResult = {
        name: definition.name,
        provider: definition.provider,
        ...(definition.resourceBase === undefined ? {} : { resourceBase: definition.resourceBase }),
        content: definition.content,
      };
      return result;
    },
  };
}

export function apply(ctx: Context): void {
  ctx.tools.register(createPstackSkillTool(ctx.skills));
}
