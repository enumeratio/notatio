// Compile every standard-tableau statistic's Epsil definition to JavaScript ahead of time, into
// src/statistics.compiled.generated.js (step 6b: one generator per area).
//
//   vp node packages/symbols/combinatorics/combinatorics/tableaux/scripts/compile-definitions.ts

import { fileURLToPath } from "node:url";
import { compileArea } from "../../scripts/compile-area.ts";
import { TABLEAU_STATISTICS } from "../src/statistics.ts";

// A tableau is a list of ROWS, not integers.
if (process.argv[1] === fileURLToPath(import.meta.url))
  await compileArea(
    import.meta.url,
    "compile-tableaux",
    TABLEAU_STATISTICS,
    "list<list<integer>>",
    "../src/statistics.compiled.generated.js",
  );
