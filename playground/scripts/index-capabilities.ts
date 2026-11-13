import { pathToFileURL } from "node:url";

import { checkOrWriteInventory, inventoryPath } from "./lib/capability-inventory.ts";

function main(): void {
  const check = process.argv.includes("--check");
  const inventory = checkOrWriteInventory(!check);
  const covered = inventory.capabilities.filter((entry) => entry.status === "covered").length;
  console.log(
    `[capabilities] ${check ? "checked" : "wrote"} ${inventory.capabilities.length} entries, covered=${covered}`,
  );
  console.log(`[capabilities] inventory=${inventoryPath()}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(
      `[capabilities] ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
