// The statistics compiled at build from their Epsil (each area's statistics.compiled.generated.js):
//   - compiled answers equal the interpreter's, exactly, over small subjects of every carrier;
//   - under DEEP_TESTS, compiled answers equal the hand-written kernels' over subjects spanning
//     orders of magnitude in size, and the timings are reported — the gap is what the compiler
//     has left to learn.

import { appendFileSync } from "node:fs";
import { bareEngine } from "@enumeratio/engine/testing";
import { declareCombinatorics } from "../src/index.ts";
import { operationOf } from "@enumeratio/structures";
import { expect, test } from "vite-plus/test";
import { ALL_STATISTICS } from "../src/statistics/all.ts";
import { compiledStatistic } from "../src/statistics/compiled.ts";
import { interpretDefinition } from "../src/statistics/declare.ts";
import { signatureOf } from "../src/statistics/types.ts";
import { COMPILED as PERMUTATIONS_COMPILED } from "../permutations/src/statistics.compiled.generated.js";
import { COMPILED as PARTITIONS_COMPILED } from "../partitions/src/statistics.compiled.generated.js";
import { COMPILED as COMPOSITIONS_COMPILED } from "../compositions/src/statistics.compiled.generated.js";
import { COMPILED as LATTICE_PATHS_COMPILED } from "../lattice-paths/src/statistics.compiled.generated.js";
import { COMPILED as SET_PARTITIONS_COMPILED } from "../set-partitions/src/statistics.compiled.generated.js";
import { COMPILED as TABLEAUX_COMPILED } from "../tableaux/src/statistics.compiled.generated.js";
import { COMPILED as TREES_COMPILED } from "../trees/src/statistics.compiled.generated.js";
import { COMPILED as CARTAN_COMPILED } from "../cartan/src/statistics.compiled.generated.js";
import { cartanTypesUpTo } from "../cartan/src/sample-types.ts";
import { COMPILED as WORDS_COMPILED } from "../words/src/statistics.compiled.generated.js";
import { COMPILED as GRAPHS_COMPILED } from "../graphs/src/statistics.compiled.generated.js";

const DEEP = process.env.DEEP_TESTS === "1";
const ce = bareEngine();
const list = (values: readonly unknown[]): unknown => ["List", ...values];

/** Each area's own `scripts/compile-definitions.ts` (run by `build`) writes its own table. */
const AREAS = [
  { name: "permutations", compiled: PERMUTATIONS_COMPILED },
  { name: "partitions", compiled: PARTITIONS_COMPILED },
  { name: "compositions", compiled: COMPOSITIONS_COMPILED },
  { name: "lattice-paths", compiled: LATTICE_PATHS_COMPILED },
  { name: "set-partitions", compiled: SET_PARTITIONS_COMPILED },
  { name: "tableaux", compiled: TABLEAUX_COMPILED },
  { name: "trees", compiled: TREES_COMPILED },
  { name: "words", compiled: WORDS_COMPILED },
  { name: "graphs", compiled: GRAPHS_COMPILED },
  { name: "cartan", compiled: CARTAN_COMPILED },
] as const;

for (const area of AREAS) {
  test(`${area.name}: the build compiled definitions`, () => {
    expect(Object.keys(area.compiled).length).toBeGreaterThan(0);
  });
}

/** Every signature ANY area's compiled table has an entry for. */
const COMPILED_SIGNATURES = new Set(
  [
    PERMUTATIONS_COMPILED,
    PARTITIONS_COMPILED,
    COMPOSITIONS_COMPILED,
    LATTICE_PATHS_COMPILED,
    SET_PARTITIONS_COMPILED,
    TABLEAUX_COMPILED,
    TREES_COMPILED,
    WORDS_COMPILED,
    GRAPHS_COMPILED,
    CARTAN_COMPILED,
  ].flatMap((table) => Object.keys(table)),
);

function permutations(n: number): number[][] {
  if (n === 0) return [[]];
  return permutations(n - 1).flatMap((rest) =>
    Array.from({ length: n }, (_, i) => [...rest.slice(0, i), n, ...rest.slice(i)]),
  );
}
function partitions(n: number, max = n): number[][] {
  if (n === 0) return [[]];
  const out: number[][] = [];
  for (let first = Math.min(n, max); first >= 1; first--)
    for (const rest of partitions(n - first, first)) out.push([first, ...rest]);
  return out;
}
function compositions(n: number): number[][] {
  if (n === 0) return [[]];
  return Array.from({ length: n }, (_, i) => i + 1).flatMap((first) =>
    compositions(n - first).map((rest) => [first, ...rest]),
  );
}
function dyckPaths(n: number): number[][] {
  const out: number[][] = [];
  const walk = (word: number[], ups: number, downs: number): void => {
    if (ups === n && downs === n) out.push(word);
    if (ups < n) walk([...word, 1], ups + 1, downs);
    if (downs < ups) walk([...word, 0], ups, downs + 1);
  };
  walk([], 0, 0);
  return out;
}
function setPartitions(n: number): number[][][] {
  if (n === 0) return [[]];
  return setPartitions(n - 1).flatMap((blocks) => [
    ...blocks.map((_, i) => blocks.map((block, j) => (i === j ? [...block, n] : block))),
    [...blocks, [n]],
  ]);
}

/** The binary words of length n. */
function binaryWords(n: number): number[][] {
  if (n === 0) return [[]];
  return binaryWords(n - 1).flatMap((rest) => [0, 1].map((letter) => [...rest, letter]));
}

/** The binary trees of n nodes: 0 (empty) or [left, right]. */
function binaryTrees(n: number): unknown[] {
  if (n === 0) return [0];
  return Array.from({ length: n }, (_, k) => k).flatMap((k) =>
    binaryTrees(k).flatMap((l) => binaryTrees(n - 1 - k).map((r) => list([l, r]))),
  );
}
/** The ordered trees of n vertices: the list of the children's trees. */
function orderedTrees(n: number): unknown[] {
  const forests = (m: number): unknown[][] =>
    m === 0
      ? [[]]
      : Array.from({ length: m }, (_, i) => i + 1).flatMap((first) =>
          orderedTrees(first).flatMap((tree) => forests(m - first).map((rest) => [tree, ...rest])),
        );
  return forests(n - 1).map(list);
}

/** The standard tableaux of n entries, as rows: each entry goes on the end of a row that stays a partition. */
function standardTableaux(n: number): number[][][] {
  let all: number[][][] = [[]];
  for (let entry = 1; entry <= n; entry++)
    all = all.flatMap((t) =>
      [...t.keys(), t.length]
        .filter((r) => r === t.length || r === 0 || t[r]!.length < t[r - 1]!.length)
        .map((r) => (r === t.length ? [...t, [entry]] : t.map((row, i) => (i === r ? [...row, entry] : row)))),
    );
  return all;
}

/** The perfect matchings of 2n points: each pair ascending, the pairs by least element. */
function perfectMatchings(n: number): number[][][] {
  const pair = (free: readonly number[]): number[][][] => {
    if (free.length === 0) return [[]];
    const [first, ...rest] = free;
    return rest.flatMap((partner, i) =>
      pair(rest.filter((_, j) => j !== i)).map((others) => [[first!, partner], ...others]),
    );
  };
  return pair(Array.from({ length: 2 * n }, (_, i) => i + 1));
}

/** The permutations of 1..n with a sign on each entry. */
function signedPermutations(n: number): number[][] {
  return permutations(n).flatMap((p) =>
    Array.from({ length: 2 ** n }, (_, mask) => p.map((v, i) => (mask & (1 << i) ? -v : v))),
  );
}

/** The n x n alternating sign matrices: every row sums to 1, and the partial sums of each row and column are 0 or 1. */
function alternatingSignMatrices(n: number): number[][][] {
  const extend = (columns: readonly number[], rows: number[][]): number[][][] => {
    if (rows.length === n) return columns.every((c) => c === 1) ? [rows] : [];
    const found: number[][][] = [];
    const fill = (column: number, row: number[], total: number): void => {
      if (column === n) {
        if (total === 1)
          found.push(
            ...extend(
              columns.map((c, k) => c + row[k]!),
              [...rows, row],
            ),
          );
        return;
      }
      for (const entry of [-1, 0, 1]) {
        const down = columns[column]! + entry;
        const along = total + entry;
        if (down >= 0 && down <= 1 && along >= 0 && along <= 1) fill(column + 1, [...row, entry], along);
      }
    };
    fill(0, [], 0);
    return found;
  };
  return extend(
    Array.from({ length: n }, () => 0),
    [],
  );
}

/** The parking functions of length n: the lists on 1 .. n whose k-th smallest entry is at most k. */
function parkingFunctions(n: number): number[][] {
  const found: number[][] = [];
  const extend = (entries: number[]): void => {
    if (entries.length === n) {
      if (entries.toSorted((a, b) => a - b).every((entry, k) => entry <= k + 1)) found.push(entries);
      return;
    }
    for (let entry = 1; entry <= n; entry++) extend([...entries, entry]);
  };
  extend([]);
  return found;
}

/** The plane partitions of n boxes: rows that are partitions, each no longer than and entrywise at most the row above. */
function planePartitions(n: number): number[][][] {
  const rowsOf = (total: number, most: number): number[][] =>
    total === 0
      ? [[]]
      : Array.from({ length: Math.min(total, most) }, (_, k) => Math.min(total, most) - k).flatMap((first) =>
          rowsOf(total - first, first).map((rest) => [first, ...rest]),
        );
  const extend = (left: number, above: readonly number[] | undefined): number[][][] =>
    left === 0
      ? [[]]
      : Array.from({ length: left }, (_, k) => k + 1).flatMap((total) =>
          rowsOf(total, left)
            .filter((row) => above === undefined || (row.length <= above.length && row.every((e, j) => e <= above[j]!)))
            .flatMap((row) => extend(left - total, row).map((rest) => [row, ...rest])),
        );
  return extend(n, undefined);
}

/** The reduced skew shapes of n cells, as [outer, inner] part lists: no empty row and no empty column. */
function skewPartitions(n: number): number[][][] {
  // A reduced shape has at most n rows and n columns, so its outer partition fits in the n x n box.
  const inBox = (rows: number, width: number): number[][] =>
    rows === 0
      ? [[]]
      : Array.from({ length: width + 1 }, (_, part) => part).flatMap((part) =>
          inBox(rows - 1, part).map((rest) => [part, ...rest]),
        );
  const trim = (p: number[]): number[] => p.filter((part) => part > 0);
  const columns = (p: number[]): number[] => Array.from({ length: p[0] ?? 0 }, (_, j) => p.filter((q) => q > j).length);
  const shapes: number[][][] = [];
  for (const outer of inBox(n, n).map(trim))
    for (const inner of inBox(outer.length, outer[0] ?? 0).map(trim)) {
      const cells = outer.reduce((a, b) => a + b, 0) - inner.reduce((a, b) => a + b, 0);
      const innerColumns = columns(inner);
      const reduced =
        cells === n &&
        inner.length <= outer.length &&
        outer.every((part, i) => part > (inner[i] ?? 0)) &&
        columns(outer).every((height, j) => height > (innerColumns[j] ?? 0));
      if (reduced && inner.every((part, i) => part <= outer[i]!)) shapes.push([outer, inner]);
    }
  return shapes;
}

/** The labeled graphs on n vertices, each as the vertex count and its edge list. */
function labeledGraphs(n: number): unknown[] {
  const pairs: number[][] = [];
  for (let u = 1; u <= n; u++) for (let v = u + 1; v <= n; v++) pairs.push([u, v]);
  return Array.from({ length: 2 ** pairs.length }, (_, mask) => [
    "Tuple",
    n,
    list(pairs.filter((_, k) => (mask >> k) & 1).map(list)),
  ]);
}

/** The semistandard tableaux of n cells with entries 1 .. k: rows weakly and columns strictly increasing. */
function semistandardTableaux(n: number, k: number): number[][][] {
  const weakRows = (cells: number): number[][] =>
    cells === 0
      ? [[]]
      : weakRows(cells - 1).flatMap((rest) =>
          Array.from({ length: k - (rest.at(-1) ?? 1) + 1 }, (_, i) => [...rest, (rest.at(-1) ?? 1) + i]),
        );
  const fill = (shape: number[], rows: number[][]): number[][][] => {
    if (rows.length === shape.length) return [rows];
    const above = rows.at(-1);
    return weakRows(shape[rows.length]!)
      .filter((row) => above === undefined || row.every((entry, c) => above[c]! < entry))
      .flatMap((row) => fill(shape, [...rows, row]));
  };
  return partitions(n).flatMap((shape) => fill(shape, []));
}

/** The Gelfand-Tsetlin patterns of n rows with entries 0 .. k, the longest row first. */
function gelfandTsetlinPatterns(n: number, k: number): number[][][] {
  const tops = (cells: number, most: number): number[][] =>
    cells === 0
      ? [[]]
      : Array.from({ length: most + 1 }, (_, i) => most - i).flatMap((first) =>
          tops(cells - 1, first).map((rest) => [first, ...rest]),
        );
  const interlacing = (above: number[]): number[][] =>
    above.length === 1
      ? [[]]
      : interlacing(above.slice(0, -1)).flatMap((shorter) =>
          Array.from({ length: above[above.length - 2]! - above[above.length - 1]! + 1 }, (_, i) => [
            ...shorter,
            above[above.length - 1]! + i,
          ]),
        );
  const below = (row: number[]): number[][][] =>
    row.length === 1 ? [[row]] : interlacing(row).flatMap((next) => below(next).map((rest) => [row, ...rest]));
  return n === 0 ? [[]] : tops(n, k).flatMap(below);
}

/** The subjects of one carrier a size at a time, smallest first, each as MathJSON contents. */
const bySize = <T>(sizes: readonly number[], of: (n: number) => T[], toContents: (item: T) => unknown): unknown[][] =>
  sizes.map((n) => of(n).map(toContents));
const ofLists = (rows: readonly unknown[]): unknown => list((rows as unknown[][]).map(list));

/** Small subjects of each carrier, as MathJSON contents, grouped by size. */
const SUBJECTS: Record<string, unknown[][]> = {
  // Up to 4: the cubic statistics are slow to interpret, and the exhaustive sweeps elsewhere
  // already hold every statistic to an independent reading up to 6.
  Permutation: bySize([0, 1, 2, 3, 4], permutations, list),
  IntegerPartition: bySize([0, 1, 2, 3, 4, 5, 6, 7], partitions, list),
  IntegerComposition: bySize([0, 1, 2, 3, 4, 5, 6], compositions, list),
  DyckPath: bySize([0, 1, 2, 3, 4], dyckPaths, list),
  BinaryWord: bySize([0, 1, 2, 3, 4, 5, 6], binaryWords, list),
  BinaryTree: bySize([0, 1, 2, 3, 4, 5], binaryTrees, (tree) => tree),
  OrderedTree: bySize([1, 2, 3, 4, 5, 6], orderedTrees, (tree) => tree),
  SetPartition: bySize([0, 1, 2, 3, 4], setPartitions, ofLists),
  StandardTableau: bySize([0, 1, 2, 3, 4, 5, 6], standardTableaux, ofLists),
  PerfectMatching: bySize([1, 2, 3, 4], perfectMatchings, ofLists),
  SignedPermutation: bySize([0, 1, 2, 3, 4], signedPermutations, list),
  // The build's own samples have no matrices (the family has no carrier). To size 4; deep, 5 and 6
  // (7436 of size 6, thinned by the head's allowance like every carrier).
  AlternatingSignMatrix: bySize(DEEP ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4], alternatingSignMatrices, ofLists),
  // Lengths to 3; deep, 4 and 5.
  ParkingFunction: bySize([1, 2, 3, ...(DEEP ? [4, 5] : [])], parkingFunctions, list),
  // Up to 4 boxes; deep, 5 and 6.
  PlanePartition: bySize([1, 2, 3, 4, ...(DEEP ? [5, 6] : [])], planePartitions, ofLists),
  // Up to 2; deep, up to 5 (the dynamic programs take about a tenth of a second a shape to interpret at 3 cells, and growing).
  // Up to 3 vertices, every fourth graph on 4; deep, all of 4 and 5 (the distance and component statistics
  // take a second or more a graph to interpret, so a head's allowance thins them).
  LabeledGraph: [
    ...[0, 1, 2, 3].map(labeledGraphs),
    labeledGraphs(4).filter((_, i) => DEEP || i % 4 === 0),
    ...(DEEP ? [labeledGraphs(5)] : []),
  ],
  // Ranks to 6; deep, to 8 (the permanent's table doubles with each rank).
  CartanType: [cartanTypesUpTo(DEEP ? 8 : 6)],
  SkewPartition: bySize(DEEP ? [1, 2, 3, 4, 5] : [1, 2], skewPartitions, ofLists),
  // Up to 4 cells with entries to 3; deep, up to 6.
  SemistandardTableau: bySize(DEEP ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4], (n) => semistandardTableaux(n, 3), ofLists),
  // Up to 3 rows with entries to 2, and 4 rows with entries to 1 (a tile takes seconds to interpret); deep, 4 rows to 2.
  GelfandTsetlinPattern: [
    ...[0, 1, 2, 3].map((n) => gelfandTsetlinPatterns(n, 2).map(ofLists)),
    gelfandTsetlinPatterns(4, DEEP ? 2 : 1).map(ofLists),
  ],
};

/** How many subjects of a carrier its heads interpret together, deep or not. The interpreter is the slow
 *  side of the comparison, so a head's share is this over the carrier's compiled heads: the file's time
 *  stays put as statistics are added, and each head sees fewer subjects. Sized from the mean seconds one
 *  interpretation took on a 2-thread box (Permutation .01, SignedPermutation .01, PerfectMatching .02,
 *  BinaryTree .02, OrderedTree .02, BinaryWord .04, IntegerComposition .04, StandardTableau .05,
 *  IntegerPartition .07, SetPartition .07, AlternatingSignMatrix .07 to size 4, DyckPath .2) to give each
 *  carrier a few minutes. */
const CARRIER_ALLOWANCE: Readonly<Record<string, number>> = {
  Permutation: 6000,
  SignedPermutation: 4000,
  IntegerPartition: 2700,
  IntegerComposition: 2400,
  DyckPath: 1300,
  BinaryWord: 4000,
  BinaryTree: 600,
  OrderedTree: 900,
  SetPartition: 1700,
  StandardTableau: 2500,
  PerfectMatching: 1300,
  AlternatingSignMatrix: 2300,
  ParkingFunction: 2000,
  PlanePartition: 1000,
  SkewPartition: 1000,
  SemistandardTableau: 1500,
  GelfandTsetlinPattern: 200,
  LabeledGraph: 150,
  CartanType: 600,
};

/** The fewest subjects a head interprets however many heads share the carrier: the sizes up to a
 *  Dyck path's 3 whole, and a few of the next size up. */
const MIN_PER_HEAD = 12;

/** Which of a carrier's subjects (grouped by size, smallest first) a head interprets, at most `cap`.
 *  The smallest sizes stay whole while they fit in half the cap; the rest is shared equally by the
 *  larger sizes, each spread evenly with its last subject taken, so every size is represented and so is
 *  the carrier's largest. The same subjects every run. */
function selectSubjects(groups: readonly (readonly unknown[])[], cap: number): unknown[] {
  if (groups.reduce((n, g) => n + g.length, 0) <= cap) return groups.flat();
  const chosen: unknown[] = [];
  let g = 0;
  while (g < groups.length && chosen.length + groups[g]!.length <= Math.ceil(cap / 2)) chosen.push(...groups[g++]!);
  for (let left = groups.length - g; left > 0; left--, g++) {
    const group = groups[g]!;
    const share = Math.min(group.length, Math.max(1, Math.floor((cap - chosen.length) / left)));
    // share positions evenly through the group, the last at its end
    for (let k = 1; k <= share; k++) chosen.push(group[Math.ceil((k * group.length) / share) - 1]);
  }
  return chosen;
}

/** Statistics whose interpretation grows about threefold per size of partition: the largest size
 *  (the sum of the parts) their subjects reach in the standard run, every size under DEEP_TESTS.
 *  Chains of single splits take about 15 s here at size 6, so past 5 a loaded runner is within
 *  reach of the file's timeout. */
const SLOW_TO_INTERPRET: ReadonlyMap<string, number> = new Map([["SingletonRefinementCount@IntegerPartition", 5]]);

/** The sum of the numbers in a subject's `List`. */
const sizeOf = (contents: unknown): number =>
  Array.isArray(contents)
    ? contents.slice(1).reduce((n: number, part) => n + (typeof part === "number" ? part : 0), 0)
    : 0;

/** Pairs where compiled code may decline while the interpreter answers exactly: an intermediate
 *  product passes 2^53, so the compiled parity tripwire declines rather than risk a rounded digit.
 *  `answer` is the exact value from the product formula in BigInt (the numerator divides evenly).
 *  Only E8 (degrees 2, 8, 12, 14, 18, 20, 24, 30; Coxeter number 30; |W| = 696729600) reaches it:
 *  E7 and every smaller type stay below 2^53 and are compared as usual.
 *  - ThirdWeylFussCatalanNumber: ∏ (d + 90) = 15543540607795200
 *  - ThirdPositiveWeylFussCatalanNumber: ∏ (d + 88) = 13333481570304000
 *  - CoxeterElementFactorizationCount: 8! 30^8 = 26453952000000000 */
const DECLINES_PAST_2_53: readonly { signature: string; subject: unknown; answer: number }[] = [
  { signature: "ThirdWeylFussCatalanNumber@CartanType", subject: ["Tuple", "'E'", 8], answer: 22309287 },
  { signature: "ThirdPositiveWeylFussCatalanNumber@CartanType", subject: ["Tuple", "'E'", 8], answer: 19137240 },
  { signature: "CoxeterElementFactorizationCount@CartanType", subject: ["Tuple", "'E'", 8], answer: 37968750 },
];

const compiledDefinitions = ALL_STATISTICS.filter((d) => COMPILED_SIGNATURES.has(signatureOf(d)));
const headsOn = (carrier: string): number => compiledDefinitions.filter((d) => d.on === carrier).length;

for (const definition of compiledDefinitions) {
  test(`${signatureOf(definition)}: compiled agrees with interpreted`, () => {
    const run = compiledStatistic(ce, definition);
    expect(run).toBeDefined();
    let compared = 0;
    const largest = DEEP ? Infinity : (SLOW_TO_INTERPRET.get(signatureOf(definition)) ?? Infinity);
    const cap = Math.max(MIN_PER_HEAD, Math.floor((CARRIER_ALLOWANCE[definition.on] ?? 0) / headsOn(definition.on)));
    const groups = (SUBJECTS[definition.on] ?? []).map((group) => group.filter((c) => sizeOf(c) <= largest));
    for (const contents of selectSubjects(groups, cap)) {
      const interpreted = interpretDefinition(ce, definition, ce.box(contents as never)).json;
      const answer = run!(contents);
      // Compiled code may decline only an infinite answer, which MathJSON can't carry as a number,
      // or a listed pair (DECLINES_PAST_2_53) whose interpreted answer is its exact value.
      if (answer === undefined) {
        const allowed = DECLINES_PAST_2_53.find(
          (a) => a.signature === signatureOf(definition) && JSON.stringify(a.subject) === JSON.stringify(contents),
        );
        expect(interpreted, JSON.stringify(contents)).toBe(allowed?.answer ?? "PositiveInfinity");
        continue;
      }
      compared++;
      expect(answer, JSON.stringify(contents)).toEqual(interpreted);
    }
    expect(compared, "no compiled answer was compared").toBeGreaterThan(0);
  });
}

// The 5-vertex graph whose Euclid steps on the distance Laplacian's characteristic polynomial pass 2^53 over the
// integers: the spectrum heads work modulo primes, and their compiled code answers it (the interpreter takes
// tens of seconds, so the values are pinned; reference's `known.test.ts` holds the examples).
test("the spectrum heads' compiled code answers a graph whose gcd passes 2^53 over the integers", () => {
  const subject = ["Tuple", 5, list([list([1, 2]), list([1, 4]), list([2, 3]), list([2, 5]), list([3, 5])])];
  const answers = {
    "DistinctLaplacianEigenvalueCount@LabeledGraph": 5,
    "MaximumLaplacianEigenvalueMultiplicity@LabeledGraph": 1,
    "DistinctDistanceLaplacianEigenvalueCount@LabeledGraph": 5,
    "MaximumDistanceLaplacianEigenvalueMultiplicity@LabeledGraph": 1,
  };
  for (const [signature, answer] of Object.entries(answers)) {
    const definition = compiledDefinitions.find((d) => signatureOf(d) === signature)!;
    expect(compiledStatistic(ce, definition)!(subject), signature).toEqual(answer);
  }
});

// Hand-written kernels against the compiled definitions, over subjects up to n = 1000. A size
// that already takes long is the last one tried: the point is the ratio, not the wait.
test.runIf(DEEP)(
  "compiled statistics match the hand-written kernels, and how fast",
  () => {
    const engine = bareEngine();
    declareCombinatorics(engine);
    const rows: string[] = [
      "| statistic | n | compiled (ms) | kernel (ms) | ratio |",
      "| --- | --- | --- | --- | --- |",
    ];
    const random = (n: number, seed: number): number[] => {
      const p = Array.from({ length: n }, (_, i) => i + 1);
      let s = seed;
      for (let i = n - 1; i > 0; i--) {
        s = (s * 1103515245 + 12345) % 2147483648;
        const j = s % (i + 1);
        [p[i], p[j]] = [p[j]!, p[i]!];
      }
      return p;
    };
    const time = (f: () => unknown): number => {
      const once = performance.now();
      f();
      const single = performance.now() - once;
      const reps = Math.max(1, Math.min(20, Math.floor(50 / Math.max(single, 0.001))));
      const start = performance.now();
      for (let k = 0; k < reps; k++) f();
      return (performance.now() - start) / reps;
    };
    for (const definition of ALL_STATISTICS.filter((d) => d.on === "Permutation")) {
      const kernel = operationOf(engine, "CombinatorialStat", "Permutation", definition.head)?.kernel;
      const run = compiledStatistic(ce, definition);
      if (kernel === undefined || run === undefined) continue;
      for (const n of [10, 100, 1000]) {
        const subject = list(random(n, n));
        const boxed = engine.box(["Permutation", subject] as never);
        expect(run(subject), `${definition.head}, n = ${n}`).toEqual(kernel(boxed)?.json);
        const compiledMs = time(() => run(subject));
        const kernelMs = time(() => kernel(boxed));
        rows.push(
          `| ${definition.head} | ${n} | ${compiledMs.toFixed(3)} | ${kernelMs.toFixed(3)} | ${(compiledMs / kernelMs).toFixed(1)}× |`,
        );
        // The next size is ten times larger; past a few milliseconds that is a wait, not a finding.
        if (compiledMs > 5) break;
      }
    }
    const table = `### Compiled statistics against hand-written kernels\n\n${rows.join("\n")}\n`;
    if (process.env.GITHUB_STEP_SUMMARY !== undefined) appendFileSync(process.env.GITHUB_STEP_SUMMARY, table);
    else process.stderr.write(table);
  },
  600_000,
);
