// Where `referenceData` reads the records from: the repo's `packages/`, or, in a build from
// installed packages (SITE_FROM_PACKAGES=1), `node_modules/@enumeratio` beside the packages/ directory, which holds
// each package's `reference/` directly. `undefined` is the loader's own default.

import { resolve } from "node:path";
import { repoRoot } from "../app-root.ts";

export const recordsRoot: string | undefined =
  process.env.SITE_FROM_PACKAGES === "1" ? resolve(repoRoot, "node_modules/@enumeratio") : undefined;
