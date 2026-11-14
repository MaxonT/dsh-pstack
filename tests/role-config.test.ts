import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { selectRoutes } from "../src/roles/role-config.ts";
import { parseRoute, routeId } from "../src/roles/route.ts";
import { findRole } from "../src/roles/role-manifest.ts";
import { parseRoleConfiguration, readRoleConfiguration } from "../src/roles/role-store.ts";

const directories: string[] = [];

function homeWithRoles(document: Record<string, unknown> | undefined): string {
  const directory = mkdtempSync(join(tmpdir(), "pstack-roles-"));
  directories.push(directory);
  if (document !== undefined) {
    writeFileSync(join(directory, "pstack-models.json"), `${JSON.stringify(document, null, 2)}\n`);
  }
  return directory;
}

function jsonPath(directory: string): string {
  return join(directory, "pstack-models.json");
}

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe("role manifest, parser, and route selection", () => {
  it("keeps commas that belong to a role key", () => {
    expect(findRole("feature, refactoring")?.key).toBe("feature, refactoring");
    expect(findRole("  FEATURE ,  REFACTORING ")?.key).toBe("feature, refactoring");
  });

  it("parses an exact route with an effort token", () => {
    expect(parseRoute("provider/model [high]").route).toEqual({
      kind: "route",
      provider: "provider",
      model: "model",
      effort: "high",
    });
    expect(parseRoute("inherit-parent").route).toEqual({
      kind: "inherit",
      alias: "inherit-parent",
    });
    expect(parseRoute("AUTO").route).toEqual({ kind: "inherit", alias: "auto" });
  });

  it("rejects whitespace in provider, model, or effort", () => {
    expect(parseRoute("provider name/model").route).toBeUndefined();
    expect(parseRoute("provider/model name").route).toBeUndefined();
    expect(parseRoute("provider/model [high tier]").route).toBeUndefined();
  });

  it("parses a JSON document into budget and role routes", () => {
    const parsed = parseRoleConfiguration(
      JSON.stringify({
        version: 1,
        budget: "large (xhigh)",
        roles: {
          "bug-fix": ["provider/model [high]"],
          "arena runners": ["provider/a [high]", "provider/b [low]"],
        },
      }),
      "/home/user/.dsh/pstack-models.json",
    );
    expect(parsed.status).toBe("loaded");
    if (parsed.status !== "loaded") return;
    expect(parsed.budget).toBe("large (xhigh)");
    expect(parsed.roles.get("bug-fix")?.routes[0]).toMatchObject({
      model: "model",
      effort: "high",
    });
    expect(parsed.roles.get("arena runners")?.routes).toHaveLength(2);
    expect(parsed.issues).toEqual([]);
  });

  it("reports unknown roles and malformed routes without inventing line numbers", () => {
    const parsed = parseRoleConfiguration(
      JSON.stringify({
        version: 1,
        roles: { "bug-fix": ["nope"], "retired role": ["auto"] },
      }),
      "/x",
    );
    expect(parsed.status).toBe("loaded");
    if (parsed.status !== "loaded") return;
    const messages = parsed.issues.map((issue) => issue.message);
    expect(messages).toContain(
      'bug-fix: "nope" is not a route; use `inherit-parent`, `auto`, or `<provider>/<model> [effort]`',
    );
    expect(messages).toContain('unknown pstack role "retired role"');
  });

  it("rejects an unsupported document version", () => {
    expect(() => parseRoleConfiguration(JSON.stringify({ version: 2, roles: {} }), "/x")).toThrow(
      /version/,
    );
    expect(() => parseRoleConfiguration("not json", "/x")).toThrow();
  });

  it("distinguishes a missing file from an unreadable path", () => {
    expect(readRoleConfiguration(jsonPath(homeWithRoles(undefined))).status).toBe("missing");
    expect(readRoleConfiguration(homeWithRoles(undefined)).status).toBe("unreadable");
  });

  it("expands automatic panels and selects a list entry by its exact route", () => {
    const parsed = parseRoleConfiguration(
      JSON.stringify({
        version: 1,
        roles: {
          "arena runners": ["p/a [high]", "p/b [low]"],
          "swarm workers": ["p/a [high]", "p/b [low]"],
        },
      }),
      "/x",
    );
    expect(parsed.status).toBe("loaded");
    if (parsed.status !== "loaded") return;
    const panel = selectRoutes(
      findRole("arena runners")!,
      parsed.roles.get("arena runners"),
      undefined,
    );
    expect(panel.mode).toBe("panel");
    expect(panel.routes).toHaveLength(2);
    const entry = parsed.roles.get("swarm workers");
    const selected = selectRoutes(findRole("swarm workers")!, entry, "p/b [low]");
    expect(selected.mode).toBe("selected");
    expect(selected.routes[0]).toMatchObject({ model: "b" });
    expect(selected.roleRoute).toBe("p/b [low]");
    const selectedById = selectRoutes(
      findRole("swarm workers")!,
      entry,
      routeId(entry!.routes[1]!),
    );
    expect(selectedById.routes[0]).toMatchObject({ model: "b" });
    expect(() => selectRoutes(findRole("swarm workers")!, entry, undefined)).toThrow(
      /has 2 routes; pass roleRoute/,
    );
  });

  it("rejects roleRoute on a single role or an automatic panel, and lists available routes", () => {
    const parsed = parseRoleConfiguration(
      JSON.stringify({
        version: 1,
        roles: {
          "bug-fix": ["p/a"],
          "arena runners": ["p/a", "p/b"],
          "swarm workers": ["p/a", "p/b"],
        },
      }),
      "/x",
    );
    expect(parsed.status).toBe("loaded");
    if (parsed.status !== "loaded") return;
    expect(() => selectRoutes(findRole("bug-fix")!, parsed.roles.get("bug-fix"), "p/a")).toThrow(
      /single route/,
    );
    expect(() =>
      selectRoutes(findRole("arena runners")!, parsed.roles.get("arena runners"), "p/a"),
    ).toThrow(/automatic panel/);
    expect(() =>
      selectRoutes(findRole("swarm workers")!, parsed.roles.get("swarm workers"), "ghost/model"),
    ).toThrow(/available routes/);
  });
});

describe("legacy role file migration", () => {
  it("migrates an mdc file to json and removes the mdc when json is missing", () => {
    const directory = homeWithRoles(undefined);
    const legacy = join(directory, "pstack-models.mdc");
    writeFileSync(legacy, "# budget: large (xhigh)\nbug-fix: cpa/model-a [high]\n");
    const config = readRoleConfiguration(jsonPath(directory));
    expect(config.status).toBe("loaded");
    if (config.status !== "loaded") return;
    expect(config.budget).toBe("large (xhigh)");
    expect(config.roles.get("bug-fix")?.routes[0]).toMatchObject({ model: "model-a" });
    expect(existsSync(legacy)).toBe(false);
    expect(existsSync(jsonPath(directory))).toBe(true);
    expect(JSON.parse(readFileSync(jsonPath(directory), "utf8"))).toMatchObject({
      version: 1,
      budget: "large (xhigh)",
      roles: { "bug-fix": ["cpa/model-a [high]"] },
    });
  });

  it("prefers json and keeps the mdc when both exist", () => {
    const directory = homeWithRoles({ version: 1, roles: { "bug-fix": ["json/model [low]"] } });
    const legacy = join(directory, "pstack-models.mdc");
    writeFileSync(legacy, "bug-fix: mdc/model [high]\n");
    const config = readRoleConfiguration(jsonPath(directory));
    expect(config.status).toBe("loaded");
    if (config.status !== "loaded") return;
    expect(config.roles.get("bug-fix")?.routes[0]).toMatchObject({ model: "model" });
    expect(config.roles.get("bug-fix")?.routes[0]).toMatchObject({ provider: "json" });
    expect(existsSync(legacy)).toBe(true);
  });

  it("is missing when neither file exists", () => {
    expect(readRoleConfiguration(jsonPath(homeWithRoles(undefined))).status).toBe("missing");
  });
});
