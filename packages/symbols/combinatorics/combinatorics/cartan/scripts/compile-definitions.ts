// Compile every Cartan type statistic's Epsil definition to JavaScript ahead of time, into
// src/statistics.compiled.generated.js, checked against the interpreter on the types of ranks 1 to 8
// and a few larger ones (where a product passes 2^53 and the compiled code must decline).
//
//   vp node packages/symbols/combinatorics/combinatorics/cartan/scripts/compile-definitions.ts

import { fileURLToPath } from "node:url";
import { compileArea } from "../../scripts/compile-area.ts";
import { CARTAN_STATISTICS } from "../src/statistics.ts";
import { cartanTypesUpTo } from "../src/sample-types.ts";

if (process.argv[1] === fileURLToPath(import.meta.url))
  await compileArea(
    import.meta.url,
    "compile-cartan",
    CARTAN_STATISTICS,
    "tuple<string, integer>",
    "../src/statistics.compiled.generated.js",
    () =>
      cartanTypesUpTo(8, [
        ["A", 12],
        ["B", 14],
        ["D", 16],
        ["A", 20],
      ]),
  );
