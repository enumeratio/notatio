// Walks whose steps are not unit: KDyckPaths (up k, down 1) and RationalDyckPaths (the lattice
// paths weakly above a line of slope b/a). Both are walks as in ./walks.ts, the steps' rise a
// parameter, and take Dyck's tokens: 1 is the step up (or north), 0 the step down (or east), tried
// first and second, so k = 1 and a = b = n give DyckPaths(n) word for word.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
import { add, mul } from "../../../collections/src/families/tables.ts";
import { completionsOf, completionsTable, type Step, walkFamily } from "./walks.ts";

/** A walk whose steepest descent is `slope` per step and whose height stays within `cap`. */
const slopeWalk = (
  head: string,
  carrier: string,
  params: readonly string[],
  width: unknown,
  cap: unknown,
  steps: readonly Step[],
  slope: unknown,
  declared: Declared,
): EpsilFamily =>
  walkFamily({
    head,
    carrier,
    declared,
    params,
    width,
    steps,
    tables: [completionsTable("t", steps, width, cap, slope)],
    completions: completionsOf(cap),
  });

/** k-Dyck paths of semilength n: n steps up by k and kn steps down by 1, never below the ground,
 *  (k + 1)n steps in all; the Fuss-Catalan number binom((k + 1)n, n) / (kn + 1) of them. */
export const kDyckPaths = slopeWalk(
  "KDyckPaths",
  "KDyckPath",
  ["_n", "_k"],
  mul(add("_k", 1), "_n"),
  mul("_k", "_n"),
  [
    { token: 1, rise: "_k", direction: 1, width: 1 },
    { token: 0, rise: -1, width: 1 },
  ],
  1,
  {
    carrier: "KDyckPath",
    params: [
      { name: "n", role: "axis", min: 0 },
      { name: "k", role: "param", min: 1 },
    ],
    cost: { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
  },
);

/** The rational Dyck paths of (a, b): a steps east (0) and b north (1) that stay weakly above the
 *  line from the origin to (a, b), that is a·y ≥ b·x at every point (x, y). The height a·y − b·x is
 *  what the walk tracks, so a north step rises by a and an east step falls by b. For coprime a and b
 *  there are binom(a + b, a) / (a + b) of them (Bizley). */
export const rationalDyckPaths = slopeWalk(
  "RationalDyckPaths",
  "RationalDyckPath",
  ["_a", "_b"],
  add("_a", "_b"),
  mul("_a", "_b"),
  [
    { token: 1, rise: "_a", direction: 1, width: 1 },
    { token: 0, rise: ["Negate", "_b"], direction: -1, width: 1 },
  ],
  "_b",
  {
    carrier: "RationalDyckPath",
    params: [
      { name: "a", role: "axis", min: 1 },
      { name: "b", role: "param", min: 1 },
    ],
    cost: { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
  },
);

export const entries = [kDyckPaths, rationalDyckPaths];
