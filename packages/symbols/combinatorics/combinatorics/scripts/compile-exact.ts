// Compile the exact counts (`Definition.exact`) over BigInts ahead of time, into src/statistics.exact.generated.js:
// the one table of every area's, cross-checked against the interpreter (shards.ts) on small subjects and on
// sizes where an intermediate passes 2^53.
//
//   node scripts/compile-exact.ts

import { fileURLToPath } from "node:url";
import { ALL_STATISTICS } from "../src/statistics/all.ts";
import { exactDefinitionsFor, renderExact } from "../src/statistics/generate-exact.ts";
import { signatureOf } from "../src/statistics/types.ts";
import { cartanTypesUpTo } from "../cartan/src/sample-types.ts";
import { ladderElements, smallElements } from "./samples.ts";
import { sharded } from "./shards.ts";
import { checkers } from "./verdicts.ts";
import { writeGenerated } from "./write-generated.ts";

/** The bare shape of each carrier that has an exact count. */
const SHAPES: Readonly<Record<string, string>> = {
  IntegerPartition: "list<integer>",
  DyckPath: "list<integer>",
  IntegerComposition: "list<integer>",
  Permutation: "list<integer>",
  SignedPermutation: "list<integer>",
  BinaryWord: "list<integer>",
  CartanType: "tuple<string, integer>",
};

/** The carriers whose families unrank at the ladder's sizes in a moment; the others have curated subjects alone. */
const LADDERED = new Set(["IntegerPartition", "DyckPath", "IntegerComposition"]);

/** Sizes the cross-check adds to `smallElements`: dozens of subjects between, and the factorials past 2^53 (19! and beyond). */
const SIZES = [7, 9, 12, 19, 22];

/** Statistics that name a `checkWeight` take the interpreter seconds per subject: they see only a few curated subjects of 12 cells or more, besides the small ones. */
const SLOW_SUBJECTS = 5;

/** Counts whose interpreter or compiled code takes minutes past a dozen cells (tree and tiling counts over the parts): checked on the small subjects alone. */
const WEIGHT_CAP = 8;
const HEAVY = new Set(
  [
    "ColoredRootedTreeCount",
    "ColoredTreeCount",
    "InvariantSetPartitionCount",
    "RootedTreeCountWithNoLeafOfItsParentsColor",
    "IncreasingTreeCountWithNoLeafOfItsParentsColor",
    "BinaryTreeCountWithNoTwinLeavesOfOneColor",
    "LeafLabeledTreeCountWithNoTwinLeavesOfOneColor",
    "LehmerCodeMultiplicityPermutationCount",
    "DiagramPosetLinearExtensionCount",
    "DominoTilingCount",
    "ColoredCycleMultisetCount",
  ].map((head) => `${head}@IntegerPartition`),
);

/** A seeded generator, so the subjects (and the verdict's key) are the same on every run. */
function generator(seed: number): () => number {
  let state = seed;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32;
}

/** Partitions with several different parts, hooks, rectangles and staircases, where a hook-length quotient's factorial passes 2^53
 *  (the sizes of 19 and over) and where the crawl's rounding declines were found, then seeded random ones of 12 to 24 cells. */
function partitionSubjects(): unknown[] {
  const random = generator(497);
  const fixed = [
    [9, 6, 5, 3],
    [3, 3, 3, 3, 3, 3, 3, 2],
    [4, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [7, 6, 5, 4, 3, 1, 1, 1],
    [10, 8, 6, 4, 1],
    [11, 8, 6, 4, 1],
    [6, 5, 4, 3, 2, 1],
    [7, 6, 5, 4, 3, 2, 1],
    [2, 2, 2, 1, 1, 1, 1, 1, 1],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [10, 2],
    [9, 3],
    [24],
    [12, 12],
  ];
  const randoms = Array.from({ length: 14 }, (_, k) => {
    let left = 12 + k;
    const parts: number[] = [];
    while (left > 0) {
      const part = 1 + Math.floor(random() * Math.min(left, 8));
      parts.push(part);
      left -= part;
    }
    return parts.toSorted((a, b) => b - a);
  });
  return [...fixed, ...randoms].map((parts) => ["List", ...parts]);
}

/** The Dyck path of the crawl's rounding decline, and seeded random ones of 8 to 13 up steps. */
function dyckSubjects(): unknown[] {
  const random = generator(498);
  const randoms = Array.from({ length: 12 }, (_, k) => {
    const n = 8 + (k % 6);
    const word: number[] = [];
    let [ups, height] = [0, 0];
    while (word.length < 2 * n) {
      const up = ups < n && (height === 0 || random() < 0.5);
      word.push(up ? 1 : 0);
      if (up) ups++;
      height += up ? 1 : -1;
    }
    return word;
  });
  return [[1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0], ...randoms].map((word) => ["List", ...word]);
}

/** Seeded random permutations of 1 .. n, and the identity and the reversal. */
function permutationOf(random: () => number, n: number): number[] {
  const p = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [p[i], p[j]] = [p[j]!, p[i]!];
  }
  return p;
}

/** Permutations of 10 to 22 points: where a factorial or a product of cycle lengths passes 2^53 (19! and beyond). */
function permutationSubjects(): unknown[] {
  const random = generator(499);
  const identity = Array.from({ length: 20 }, (_, i) => i + 1);
  return [
    identity,
    identity.toReversed(),
    ...[10, 12, 19, 20, 21, 22].flatMap((n) => [permutationOf(random, n), permutationOf(random, n)]),
  ].map((p) => ["List", ...p]);
}

/** Signed permutations of 8 to 19 points: a random signed permutation. */
function signedPermutationSubjects(): unknown[] {
  const random = generator(500);
  return [8, 12, 16, 19, 19].map((n) => ["List", ...permutationOf(random, n).map((v) => (random() < 0.5 ? -v : v))]);
}

/** Binary words past 34 letters, where a factor read as a base-3 number passes 2^53, and shorter ones, the zero word and random ones. */
function binaryWordSubjects(): unknown[] {
  const random = generator(501);
  const word = (n: number, p: number) => Array.from({ length: n }, () => (random() < p ? 1 : 0));
  return [
    ...[12, 35, 36].map((n) => word(n, 0)),
    ...[20, 35].map((n) => word(n, 0.5)),
    [1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1],
  ].map((w) => ["List", ...w]);
}

/** Compositions of 12 to 22, where a multinomial or a descent count passes 2^53 while the count stays under it, and the crawl's wrong ones. */
function compositionSubjects(): unknown[] {
  const random = generator(502);
  const randoms = [12, 16, 17, 18, 19, 20, 22, 22].map((n) => {
    const parts: number[] = [];
    for (let left = n; left > 0;) {
      const part = Math.min(left, 1 + Math.floor(random() * 3));
      parts.push(part);
      left -= part;
    }
    return parts;
  });
  return [
    [4, 4, 4, 4, 2],
    [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
    [1, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 1],
    ...randoms,
  ].map((parts) => ["List", ...parts]);
}

const CURATED: Readonly<Record<string, () => unknown[]>> = {
  IntegerPartition: partitionSubjects,
  DyckPath: dyckSubjects,
  IntegerComposition: compositionSubjects,
  Permutation: permutationSubjects,
  SignedPermutation: signedPermutationSubjects,
  BinaryWord: binaryWordSubjects,
  // Ranks 1 to 10 take in the B, C and D types of rank 9 and 10 and E8, where the products of the degrees pass 2^53.
  CartanType: () =>
    cartanTypesUpTo(10, [
      ["A", 12],
      ["B", 14],
      ["D", 16],
      ["A", 20],
    ]),
};

const weightOf = (subject: unknown): number =>
  typeof subject === "number"
    ? subject
    : Array.isArray(subject)
      ? subject.reduce<number>((n, e) => n + weightOf(e), 0)
      : 0;

const shapeOf = (carrier: string): string => {
  const shape = SHAPES[carrier];
  if (shape === undefined) throw new Error(`compile-exact: no shape for the carrier ${carrier}`);
  return shape;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const definitions = ALL_STATISTICS.filter((d) => d.exact === true);
  const run = await sharded(
    import.meta.url,
    "compile-exact",
    checkers.exact,
    definitions.map(signatureOf),
    (verdicts, mine) =>
      exactDefinitionsFor(
        definitions,
        shapeOf,
        (ce, definition) => {
          const heavy = HEAVY.has(signatureOf(definition));
          const slow = definition.checkWeight !== undefined;
          const curated = CURATED[definition.on]!().filter(
            (subject) => (!slow || weightOf(subject) >= 12) && (!heavy || weightOf(subject) <= WEIGHT_CAP),
          );
          return [
            ...smallElements(ce, definition.on).filter(
              (subject) => weightOf(subject) <= (definition.checkWeight ?? Infinity),
            ),
            ...(slow || heavy || !LADDERED.has(definition.on)
              ? []
              : SIZES.flatMap((n) => ladderElements(ce, definition.on, n, 2))),
            ...curated.slice(0, slow ? SLOW_SUBJECTS : Infinity),
          ];
        },
        verdicts,
        mine,
      ),
  );
  if (run !== undefined) {
    const entries = run.results.flatMap((r) => r.compiled);
    const disagreed = run.results.flatMap((r) => r.disagreed).toSorted();
    writeGenerated(
      fileURLToPath(new URL("../src/statistics.exact.generated.js", import.meta.url)),
      renderExact(entries),
    );
    run.verdicts.save();
    console.log(`${entries.length} of ${definitions.length} exact definitions compiled`);
    for (const signature of disagreed)
      console.log(`${signature}: no fresh verdict that the exact code agrees; left interpreted`);
  }
}
