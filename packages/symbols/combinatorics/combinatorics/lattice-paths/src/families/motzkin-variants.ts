// Motzkin paths told apart further: KMotzkinPaths by their number of up steps (the Motzkin
// triangle) and ColoredMotzkinPaths with two colors of level step. Both are walks as in
// ./walks.ts, with Motzkin's tokens (up 1, level 0, down −1), tried in that order.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
import { add, choose, equal, iff, less, lets, mul, quotient, sub } from "../../../collections/src/families/tables.ts";
import { completionsOf, completionsTable, type Step, walkFamily } from "./walks.ts";

const UP: Step = { token: 1, rise: 1, width: 1 };
const LEVEL: Step = { token: 0, rise: 0, width: 1 };
/** The second color of level step, written 2. */
const LEVEL_TWO: Step = { token: 2, rise: 0, width: 1 };
const DOWN: Step = { token: -1, rise: -1, width: 1 };

const cost = { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" } as const;

/** The Motzkin paths of length n with k steps up, as a walk whose flag is the steps up still to take.
 *  From height y with w steps and u ups to go, the non-level steps number m = 2u + y; the levels
 *  are the other w − m, placed anywhere, and the rest is a ballot path from y to 0 with u ups,
 *  C(m, u) − C(m, u − 1) by reflection. T(n, k) = A055151. */
export const kMotzkinPaths: EpsilFamily = walkFamily({
  head: "KMotzkinPaths",
  carrier: "KMotzkinPath",
  declared: {
    carrier: "KMotzkinPath",
    params: [
      { name: "n", role: "axis", min: 0 },
      { name: "k", role: "axis", min: 0 },
    ],
    cost,
  } satisfies Declared,
  params: ["_n", "_k"],
  width: "_n",
  steps: [UP, LEVEL, DOWN],
  tables: [],
  completions: (w, y, ups) =>
    lets(
      [["km", add(mul(2, ups), y), "integer"]],
      iff(
        ["Or", less(ups, 0), less(w, "km")],
        0,
        mul(choose(w, sub(w, "km")), sub(choose("km", ups), choose("km", sub(ups, 1)))),
      ),
    ),
  flag: {
    initial: "_k",
    after: (ups, _y, rise) => (rise > 0 ? sub(ups, 1) : ups),
  },
  final: (ups) => equal(ups, 0),
});

/** The Motzkin paths of length n whose level steps are of two colors: Catalan(n + 1). */
export const coloredMotzkinPaths: EpsilFamily = (() => {
  const steps = [UP, LEVEL, LEVEL_TWO, DOWN];
  const cap = quotient("_n", 2);
  return walkFamily({
    head: "ColoredMotzkinPaths",
    carrier: "ColoredMotzkinPath",
    declared: {
      carrier: "ColoredMotzkinPath",
      params: [{ name: "n", role: "axis", min: 0 }],
      cost,
    } satisfies Declared,
    params: ["_n"],
    width: "_n",
    steps,
    tables: [completionsTable("t", steps, "_n", cap)],
    completions: completionsOf(cap),
  });
})();

export const entries = [kMotzkinPaths, coloredMotzkinPaths];
