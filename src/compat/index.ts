/** Legacy role-file compatibility. Delete this directory on the next major bump. */

export {
  upgradeRoleFile,
  type RoleFileDocumentLike,
  type RoleFileUpgrade,
  type UpgradeRoleFileOptions,
} from "./upgrade-role-file.ts";
export { parseLegacyRoute, parseLegacyRouteValue } from "./legacy-route.ts";
