// Compile every binary-word statistic's Epsil definition to JavaScript ahead of time, into
// src/statistics.compiled.generated.js (step 6b: one generator per area).
//
//   vp node packages/symbols/combinatorics/combinatorics/words/scripts/compile-definitions.ts

import { fileURLToPath } from "node:url";
import { compileArea } from "../../scripts/compile-area.ts";
import { WORD_STATISTICS } from "../src/statistics.ts";

if (process.argv[1] === fileURLToPath(import.meta.url))
  await compileArea(
    import.meta.url,
    "compile-words",
    WORD_STATISTICS,
    "list<integer>",
    "../src/statistics.compiled.generated.js",
  );
