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

/** Small subjects of each carrier, as MathJSON contents. */
const SUBJECTS: Record<string, unknown[]> = {
  // Up to 4: the cubic statistics are slow to interpret, and the exhaustive sweeps elsewhere
  // already hold every statistic to an independent reading up to 6.
  Permutation: [0, 1, 2, 3, 4].flatMap(permutations).map(list),
  IntegerPartition: [0, 1, 2, 3, 4, 5, 6, 7].flatMap((n) => partitions(n)).map(list),
  IntegerComposition: [0, 1, 2, 3, 4, 5, 6].flatMap(compositions).map(list),
  DyckPath: [0, 1, 2, 3, 4].flatMap(dyckPaths).map(list),
  BinaryWord: [0, 1, 2, 3, 4, 5, 6].flatMap(binaryWords).map(list),
  BinaryTree: [0, 1, 2, 3, 4, 5].flatMap(binaryTrees),
  OrderedTree: [1, 2, 3, 4, 5, 6].flatMap(orderedTrees),
  SetPartition: [0, 1, 2, 3, 4].flatMap(setPartitions).map((blocks) => list(blocks.map(list))),
  StandardTableau: [0, 1, 2, 3, 4, 5, 6].flatMap(standardTableaux).map((rows) => list(rows.map(list))),
  PerfectMatching: [1, 2, 3, 4].flatMap(perfectMatchings).map((pairs) => list(pairs.map(list))),
  SignedPermutation: [0, 1, 2, 3, 4].flatMap(signedPermutations).map(list),
  // The build's own samples have no matrices (the family has no carrier). All to size 4; deep, all of size 5
  // and every fourth of size 6 (7436 in all, too many to interpret within the file's timeout).
  AlternatingSignMatrix: [
    ...[1, 2, 3, 4].flatMap(alternatingSignMatrices),
    ...(DEEP ? [...alternatingSignMatrices(5), ...alternatingSignMatrices(6).filter((_, i) => i % 4 === 0)] : []),
  ].map((rows) => list(rows.map(list))),
  // Lengths to 3; deep, 4 and 5.
  ParkingFunction: [1, 2, 3, ...(DEEP ? [4, 5] : [])].flatMap(parkingFunctions).map(list),
  // Up to 4 boxes; deep, 5 and 6.
  PlanePartition: [1, 2, 3, 4, ...(DEEP ? [5, 6] : [])].flatMap(planePartitions).map((rows) => list(rows.map(list))),
  // Up to 2; deep, up to 5 (the dynamic programs take about a tenth of a second a shape to interpret at 3 cells, and growing).
  // Up to 3 vertices, every fourth graph on 4; deep, all of 4 and every 64th of 5 (the distance and component statistics
  // take a second or more a graph to interpret).
  LabeledGraph: [
    ...[0, 1, 2, 3].flatMap(labeledGraphs),
    ...labeledGraphs(4).filter((_, i) => DEEP || i % 4 === 0),
    ...(DEEP ? labeledGraphs(5).filter((_, i) => i % 64 === 0) : []),
  ],
  SkewPartition: (DEEP ? [1, 2, 3, 4, 5] : [1, 2]).flatMap(skewPartitions).map((shape) => list(shape.map(list))),
};

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

for (const definition of ALL_STATISTICS.filter((d) => COMPILED_SIGNATURES.has(signatureOf(d)))) {
  test(`${signatureOf(definition)}: compiled agrees with interpreted`, () => {
    const run = compiledStatistic(ce, definition);
    expect(run).toBeDefined();
    let compared = 0;
    const largest = DEEP ? Infinity : (SLOW_TO_INTERPRET.get(signatureOf(definition)) ?? Infinity);
    for (const contents of (SUBJECTS[definition.on] ?? []).filter((c) => sizeOf(c) <= largest)) {
      const interpreted = interpretDefinition(ce, definition, ce.box(contents as never)).json;
      const answer = run!(contents);
      // Compiled code may decline only an infinite answer, which MathJSON can't carry as a number.
      if (answer === undefined) {
        expect(interpreted, JSON.stringify(contents)).toBe("PositiveInfinity");
        continue;
      }
      compared++;
      expect(answer, JSON.stringify(contents)).toEqual(interpreted);
    }
    expect(compared, "no compiled answer was compared").toBeGreaterThan(0);
  });
}

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
