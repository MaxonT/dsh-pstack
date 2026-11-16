/** Browser entry for dsh-pstack: the plugin-detail configuration action. */

import type { Context } from "@deepseek-ai/cordis";
import type { ClientRemote, RemoteResult } from "@deepseek-ai/dsh-api-remotes/client";
import type {} from "@deepseek-ai/dsh-client-locale/client";
import type {} from "@deepseek-ai/dsh-client-ui-renderer/client";
import type {} from "@deepseek-ai/dsh-client-ui-settings/client";
import type {} from "@deepseek-ai/dsh-client-ui-slots";
import type {} from "@deepseek-ai/dsh-client-ui-plugin-manager/client";

import { pstackClientRemote, type PstackRolesNamespace } from "../roles/role-remote.ts";
import { type PstackPotetoModeNamespace } from "../poteto-toggle-remote.ts";
import { createPstackConfigAction } from "./pages/PstackConfigDialog.tsx";
import { PotetoModeToggle } from "./components/PotetoModeToggle.tsx";
import { PotetoModeBadge } from "./components/PotetoModeBadge.tsx";
import { NS, catalogs } from "./locales/index.ts";
import type { PluginManagerApi } from "./pages/RecommendedPluginsPage.tsx";
import type { RoleSettingsApi } from "./pages/RoleSettingsPage.tsx";
import type { PotetoSettingsApi } from "./pages/GeneralSettingsPage.tsx";

/** Browser services this plugin needs. `remote.pluginManager` stays optional, so roles load without it. */
export const inject = ["remote", "slots", "locale"];

/**
 * Build a stable API whose methods resolve the manager at call time.
 *
 * The plugin-manager Remote namespace can arrive before or after this plugin's
 * `apply`, so it must not be captured once here. A missing manager fails only the
 * recommendation tab when it is used, and a later arrival recovers on refresh.
 */
export function createPluginManagerApi(
  getPluginManager: () => ClientRemote["pluginManager"] | undefined,
): PluginManagerApi {
  const manager = (): ClientRemote["pluginManager"] => {
    const value = getPluginManager();
    if (value === undefined) throw new Error("plugin manager is not available yet");
    return value;
  };
  return {
    listBundles: async () => unwrap(await manager().listBundles()),
    setBundleEnabled: async (name, enabled) =>
      unwrap(await manager().setBundleEnabled(name, enabled)),
  };
}

export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(pstackClientRemote);
  ctx.effect(() => ctx.locale.register(NS.common, catalogs.common), "pstack-config.locale.common");
  ctx.effect(() => ctx.locale.register(NS.config, catalogs.config), "pstack-config.locale.config");
  ctx.effect(
    () => ctx.locale.register(NS.plugins, catalogs.plugins),
    "pstack-config.locale.plugins",
  );
  ctx.effect(() => ctx.locale.register(NS.roles, catalogs.roles), "pstack-config.locale.roles");
  ctx.effect(() => ctx.locale.register(NS.poteto, catalogs.poteto), "pstack-config.locale.poteto");

  // Observe the plugin-manager namespace without gating the role action on it.
  // If it arrives later, the next listBundles call sees it; if it never arrives,
  // only the recommendation tab reports the problem.
  let pluginManager: ClientRemote["pluginManager"] | undefined;
  ctx.inject(["remote.pluginManager"], (scope: Context) => {
    pluginManager = scope.remote.pluginManager;
  });
  const pluginApi = createPluginManagerApi(() => pluginManager);

  let potetoApi: PstackPotetoModeNamespace["pstackPotetoMode"] | undefined;
  const potetoSettingsApi: PotetoSettingsApi = {
    readDefault: async () => {
      if (potetoApi === undefined) return false;
      const result = await potetoApi.getDefault();
      return result.ok ? result.value.enabled : false;
    },
    writeDefault: async (enabled) => {
      if (potetoApi === undefined) return "poteto mode is not available yet";
      const result = await potetoApi.setDefault(enabled);
      return result.ok ? null : result.error.message;
    },
  };

  // `$mount` above installs the namespace, so its dependency is declared only now.
  // Injecting before the await would resolve against a namespace that does not exist yet.
  ctx.inject(["remote.pstackRoles"], (scope: Context) => {
    const pstack = (scope.remote as ClientRemote & PstackRolesNamespace).pstackRoles;
    if (pstack === undefined) return;

    const roleApi: RoleSettingsApi = {
      status: async () => unwrap(await pstack.status()),
      catalogue: async (signal) => unwrap(await pstack.catalogue(signal)),
      save: async (request, signal) => unwrap(await pstack.save(request, signal)),
      budget: async (request, signal) => unwrap(await pstack.budget(request, signal)),
    };
    const translations = {
      common: ctx.locale.bind(NS.common),
      config: ctx.locale.bind(NS.config),
      plugins: ctx.locale.bind(NS.plugins),
      roles: ctx.locale.bind(NS.roles),
      poteto: ctx.locale.bind(NS.poteto),
    };
    scope.slots.inject("plugins.detail.actions", () =>
      scope.slots.register(
        {
          name: "plugins.detail.actions",
          id: "pstack",
          order: 20,
          label: translations.config("configureAction"),
        },
        createPstackConfigAction(roleApi, pluginApi, potetoSettingsApi, translations),
      ),
    );
  });

  ctx.inject(["remote.pstackPotetoMode"], (scope: Context) => {
    potetoApi = (scope.remote as ClientRemote & PstackPotetoModeNamespace).pstackPotetoMode;
    return () => {
      potetoApi = undefined;
    };
  });
  const injectProps = (sessionId: string) => ({
    sessionId,
    readMode: async () => {
      if (potetoApi === undefined) return false;
      const result = await potetoApi.status(sessionId);
      return result.ok ? result.value.enabled : false;
    },
    selectMode: async (enabled: boolean) => {
      if (potetoApi === undefined) return "poteto mode is not available yet";
      const result = await potetoApi.setEnabled(sessionId, enabled);
      return result.ok ? null : result.error.message;
    },
  });
  for (const slot of ["conversation.input.model.options"]) {
    ctx.slots.inject(slot as never, () =>
      ctx.slots.register(
        {
          name: slot as never,
          id: "pstack-poteto-mode",
          locale: NS.poteto,
          inject: (sessionId: string) => injectProps(sessionId),
        } as never,
        PotetoModeToggle as never,
      ),
    );
  }
  ctx.slots.inject("conversation.session.header.actions" as never, () =>
    ctx.slots.register(
      {
        name: "conversation.session.header.actions" as never,
        id: "pstack-poteto-badge",
        order: -5,
        locale: NS.poteto,
        inject: (sessionId: string) => injectProps(sessionId),
      } as never,
      PotetoModeBadge as never,
    ),
  );

  return async () => {
    await disposeRemote();
  };
}

function unwrap<T>(result: RemoteResult<T>): T {
  if (!result.ok) throw result.error;
  return result.value;
}
