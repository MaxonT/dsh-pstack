/**
 * `pstack_roles`: a read-only capability query over the role manifest.
 *
 * `pstack_subagent` requires `role` and accepts `roleRoute` only for a
 * list-valued role that is not an automatic panel. This tool reports the
 * manifest plus the configured route ids before a caller starts a child.
 */

import type { Context } from "@deepseek-ai/cordis";
import type { JsonSchemaNode, ToolDefinition } from "@deepseek-ai/dsh-tools";

import { ROLE_MANIFEST, type RoleSpec } from "./roles/role-manifest.ts";
import { modelsFilePath, readRoleConfiguration, resolveDshHome } from "./roles/role-store.ts";
import { renderRouteValue, routeId } from "./roles/route.ts";

export const name = "pstack-role-catalog";

export const inject = ["tools"];

export const TOOL_NAME = "pstack_roles";

export interface RouteChoice {
  readonly id: string;
  readonly label: string;
}

export interface RoleCapability {
  readonly role: string;
  readonly shape: "single" | "list";
  readonly autoPanel: boolean;
  readonly roleRoute: "not-applicable" | "optional";
  readonly usage: string;
  readonly routes: readonly RouteChoice[];
}

/** Derive one role's capability record. */
export function roleCapability(spec: RoleSpec, routes: readonly RouteChoice[] = []): RoleCapability {
  if (spec.autoPanel) {
    return {
      role: spec.key,
      shape: spec.shape,
      autoPanel: true,
      roleRoute: "not-applicable",
      usage: "starts one child per configured entry",
      routes,
    };
  }
  if (spec.shape === "list") {
    return {
      role: spec.key,
      shape: spec.shape,
      autoPanel: false,
      roleRoute: "optional",
      usage: "starts one child on the selected route",
      routes,
    };
  }
  return {
    role: spec.key,
    shape: spec.shape,
    autoPanel: false,
    roleRoute: "not-applicable",
    usage: "starts one child on the role's single route",
    routes,
  };
}

/** Every role's capability record in manifest order. */
export function roleCapabilities(
  entries?: ReadonlyMap<string, { readonly routes: readonly import("./roles/route.ts").Route[] }>,
): readonly RoleCapability[] {
  return ROLE_MANIFEST.map((spec) => {
    const entry = entries?.get(spec.key);
    const routes =
      entry?.routes.map((route) => ({ id: routeId(route), label: renderRouteValue([route]) })) ??
      [];
    return roleCapability(spec, routes);
  });
}

/** Render the capabilities for the model. */
export function renderRoleCapabilities(roles: readonly RoleCapability[]): string {
  return [
    "pstack roles. Pass the exact `role` key. `roleRoute` is null unless the role is a list that is not an automatic panel; when present, pass a route id from the role's `routes` list.",
    "",
    ...roles.map((role) => {
      const routes = role.routes.length
        ? `; routes=${role.routes.map((route) => `${route.id}=${route.label}`).join(", ")}`
        : "";
      return `- ${role.role} — shape=${role.shape}${role.autoPanel ? ", autoPanel=true" : ""}; roleRoute=${role.roleRoute}; ${role.usage}${routes}`;
    }),
  ].join("\n");
}

const OUTPUT_SCHEMA: JsonSchemaNode = {
  type: "object",
  additionalProperties: false,
  properties: {
    roles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          role: { type: "string" },
          shape: { type: "string", enum: ["single", "list"] },
          autoPanel: { type: "boolean" },
          roleRoute: { type: "string", enum: ["not-applicable", "optional"] },
          usage: { type: "string" },
          routes: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                label: { type: "string" },
              },
              required: ["id", "label"],
            },
          },
        },
        required: ["role", "shape", "autoPanel", "roleRoute", "usage", "routes"],
      },
    },
  },
  required: ["roles"],
};

const TOOL_DESCRIPTION = [
  "List every pstack role with its `shape`, `autoPanel`, and configured route ids.",
  "",
  "Read-only. Use a route id from the role's `routes` list when calling `pstack_subagent` with `roleRoute`; use `pstack_models` for the routes this deployment actually serves.",
  "",
  "`roleRoute` applies only to a list role that is not an automatic panel: `arena cross-judge pool` and `swarm workers`. Omit it for every single role and for an automatic panel.",
].join("\n");

/** Build the tool definition. */
export function createPstackRolesTool(): ToolDefinition {
  return {
    name: TOOL_NAME,
    description: TOOL_DESCRIPTION,
    parameters: { type: "object", additionalProperties: false, properties: {} },
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => [
        {
          type: "text",
          text: renderRoleCapabilities(
            (value as unknown as { roles: readonly RoleCapability[] }).roles,
          ),
        },
      ],
    },
    isConcurrencySafe: () => true,
    async execute() {
      const roleFile = readRoleConfiguration(modelsFilePath(resolveDshHome()));
      const entries = roleFile.status === "loaded" ? roleFile.roles : undefined;
      return { roles: roleCapabilities(entries) };
    },
  };
}

export function apply(ctx: Context): void {
  ctx.tools.register(createPstackRolesTool());
}
