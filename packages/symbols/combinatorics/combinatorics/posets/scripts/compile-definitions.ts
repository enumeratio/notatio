// Compile every poset statistic's Epsil definition to JavaScript ahead of time, into
// src/statistics.compiled.generated.js (one generator per area).
//
//   vp node packages/symbols/combinatorics/combinatorics/posets/scripts/compile-definitions.ts

import { fileURLToPath } from "node:url";
import { compileArea } from "../../scripts/compile-area.ts";
import { POSET_STATISTICS } from "../src/statistics.ts";

// A poset is the list of each element's lower covers.
if (process.argv[1] === fileURLToPath(import.meta.url))
  await compileArea(
    import.meta.url,
    "compile-posets",
    POSET_STATISTICS,
    "list<list<integer>>",
    "../src/statistics.compiled.generated.js",
  );
