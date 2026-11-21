import { bareEngine, createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { interpretDefinition } from "../../src/statistics/declare.ts";
import { PARTITION_STATISTICS } from "../src/statistics.ts";
import { COMPILED } from "../src/statistics.compiled.generated.js";

// The definitions the JavaScript compiler does not lower, which run in the interpreter. A new
// definition that lands here is slower than the rest, so it should be a deliberate addition;
// one that starts compiling should leave the list. A bound value read by `At`, `Count`, `Sum` or
// `Min` needs a `list<…>` type on its `bind`: the default `collection` is not indexable to the compiler.
// The exact counts (`Definition.exact`) compile over BigInts elsewhere: tests/statistics-exact.test.ts lists those that do not.
const INTERPRETED: string[] = [];

// The compiled file is built, and empty until the package's build has run.
test.skipIf(Object.keys(COMPILED).length === 0)(
  "exactly these partition definitions fall back to the interpreter",
  () => {
    const interpreted = PARTITION_STATISTICS.filter(
      (d) => d.exact !== true && !(`${d.head}@IntegerPartition` in COMPILED),
    ).map((d) => d.head);
    expect(interpreted.toSorted()).toEqual(INTERPRETED);
  },
);

// The interpreter is the definition's meaning, and the library's head overrides must not change it: on the
// engine every page uses it answers as on a bare one (`Ordering` once read the arguments of a lazy
// collection, not its elements).
test("a definition interpreted on the declared engine answers as on a bare one", () => {
  const declared = createEngine(declareCombinatorics);
  const bare = bareEngine();
  const definition = PARTITION_STATISTICS.find((d) => d.head === "SingletonRefinementCount")!;
  for (const [parts, count] of [
    [[4, 2, 1], 5],
    [[3, 3, 1], 2],
    [[3], 1],
  ] as const) {
    const subject = ["List", ...parts];
    for (const ce of [declared, bare])
      expect(interpretDefinition(ce, definition, ce.box(subject as never)).json).toBe(count);
  }
});
