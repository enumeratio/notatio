// Compile every graph statistic's Epsil definition to JavaScript ahead of time, into
// src/statistics.compiled.generated.js (step 6b: one generator per area).
//
//   vp node packages/symbols/combinatorics/combinatorics/graphs/scripts/compile-definitions.ts

import { fileURLToPath } from "node:url";
import { compileArea } from "../../scripts/compile-area.ts";
import { GRAPH_STATISTICS } from "../src/statistics.ts";

// A labeled graph is a pair: the vertex count and the list of edges.
if (process.argv[1] === fileURLToPath(import.meta.url))
  await compileArea(
    import.meta.url,
    "compile-graphs",
    GRAPH_STATISTICS,
    "tuple<integer, list<list<integer>>>",
    "../src/statistics.compiled.generated.js",
  );
