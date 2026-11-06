import { expect, test } from "vite-plus/test";
import { TABLEAU_STATISTICS } from "../src/statistics.ts";
import { COMPILED } from "../src/statistics.compiled.generated.js";

// The definitions the JavaScript compiler does not lower, which run in the interpreter. A new
// definition that lands here is slower than the rest, so it should be a deliberate addition;
// one that starts compiling should leave the list. A tableau is a list of rows: the definitions
// only map over the rows and flatten them, and index the integer lists that come out, since the
// compiler cannot index a list of lists.
const INTERPRETED: string[] = [];

// The compiled file is built, and empty until the package's build has run.
test.skipIf(Object.keys(COMPILED).length === 0)(
  "exactly these tableau definitions fall back to the interpreter",
  () => {
    const interpreted = TABLEAU_STATISTICS.filter((d) => !(`${d.head}@${d.on}` in COMPILED)).map((d) => d.head);
    expect(interpreted.toSorted()).toEqual(INTERPRETED);
  },
);
