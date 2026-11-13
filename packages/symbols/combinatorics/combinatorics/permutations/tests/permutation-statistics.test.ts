import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { applyDefinition, declareStatistics } from "../../src/statistics/declare.ts";
import { PERMUTATION_STATISTICS } from "../src/statistics.ts";
import { FINDSTAT_READINGS as EXPECTED } from "./permutation-findstat-readings.ts";

const ce = bareEngine();
const index = declareStatistics(ce, PERMUTATION_STATISTICS);

/** Every permutation of 1..n, in one-line notation. */
function permutations(n: number): number[][] {
  if (n === 0) return [[]];
  const out: number[][] = [];
  for (const rest of permutations(n - 1))
    for (let i = 0; i <= rest.length; i++) out.push([...rest.slice(0, i), n, ...rest.slice(i)]);
  return out;
}
const upTo = (n: number) => Array.from({ length: n + 1 }, (_, k) => k).flatMap((k) => permutations(k));

const evaluate = (head: string, p: number[]): number =>
  applyDefinition(ce, index.get(`${head}@Permutation`)!, ce.box(["List", ...p])).re;

test("every new permutation definition has an independent reading", () => {
  for (const head of Object.keys(EXPECTED)) expect(index.has(`${head}@Permutation`), head).toBe(true);
});

// Definitions that cost seconds in the interpreter over 1..5 are checked over 1..4; the nightly takes them to 1..6.
const HEAVY = new Set([
  "BreakpointGraphCycles",
  "ShortestDistinctWindowLength",
  "BruhatTranspositionCount",
  "BruhatNonInversionTranspositionCount",
  "DescentWordFiberSize",
  "RajchgotIndex",
  "HalfSymmetryClassSize",
  "CycleInverseClassSize",
  "InsertionBumpsOfOne",
  "SimionSchmidtPreimageSize",
  "PrefixExchangeDistance",
  "LusztigAFunction",
  "ConsecutiveSwapClassSize",
  "DistanceTwoSwapClassSize",
  "ChordDiagramComponentCount",
  "RunSetFiberSize",
]);
// Sweeps over every subset or pair of subsets cost a second or more per permutation of 5: 1..3 here, 4 and 5 nightly.
const SWEEPS = new Set([
  "SubsetHoleyness",
  "CyclicSubsetHoleyness",
  "AlternatingSubsetBreakCount",
  "PopStackSortingPasses",
  "DistinctPatternCount",
  "StackSortingPasses",
  "LargestUniversalPatternSize",
  "LongestTwinLength",
  "LongestWeakTwinLength",
]);
const ALL = upTo(5);
const SMALL = upTo(4);
const TINY = upTo(3);
const largest = (head: string): number => (SWEEPS.has(head) ? 3 : HEAVY.has(head) ? 4 : 5);
for (const [head, expected] of Object.entries(EXPECTED)) {
  test(`${head} agrees over every permutation of 1..${largest(head)}`, () => {
    for (const p of SWEEPS.has(head) ? TINY : HEAVY.has(head) ? SMALL : ALL)
      expect(evaluate(head, p), `[${p.join(", ")}]`).toBe(expected(p));
  });
}

// The scale lcm(1 .. 2n) passes 2^53 at n = 21 and the sum does at n = 20 for the identity: the compiled code
// declines there and the interpreter answers exactly.
test("ScaledReciprocalPositionValueSum is exact past the doubles", () => {
  const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));
  for (const n of [20, 22]) {
    let scale = 1n;
    for (let k = 1n; k <= BigInt(2 * n); k++) scale = (scale * k) / gcd(scale, k);
    const p = Array.from({ length: n }, (_, i) => i + 1);
    const expected = p.reduce((total, v, i) => total + scale / BigInt(i + 1 + v), 0n);
    const answer = applyDefinition(
      ce,
      index.get("ScaledReciprocalPositionValueSum@Permutation")!,
      ce.box(["List", ...p]),
    );
    expect(
      String(answer.json && typeof answer.json === "object" ? (answer.json as { num: string }).num : answer.json),
    ).toBe(String(expected));
  }
});

// Larger permutations run nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)(
  "every new permutation definition agrees over every permutation of 6 and 7",
  () => {
    for (const [head, expected] of Object.entries(EXPECTED))
      for (const p of (SWEEPS.has(head) ? [4, 5] : HEAVY.has(head) ? [5, 6] : [6, 7]).flatMap((n) => permutations(n)))
        expect(evaluate(head, p), `${head} [${p.join(", ")}]`).toBe(expected(p));
  },
  3_600_000,
);
