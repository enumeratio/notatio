// The canonical form of a graph (../src/canonical.ts): the labeling whose rank in LabeledGraphs(n) is least, held
// to brute force over every labeling, and the list of canonical ranks held to the counts of A000088 and to the
// heredity the generation relies on.

import { expect, test } from "vite-plus/test";
import {
  adjacencyOf,
  adjacencyOfRank,
  CANONICAL_LIST_LIMIT,
  canonicalBlocks,
  canonicalRank,
  canonicalRanks,
  canonicalSearch,
  edgesOfBlocks,
  edgesOfRank,
  isCanonical,
  labeledRank,
  positionOf,
  rankOfBlocks,
} from "../src/canonical.ts";

const DEEP = process.env.DEEP_TESTS === "1";
// The list for 8 vertices takes most of a second to build (12,346 graphs), so the standard run stops at 7 and DEEP_TESTS takes 8.
const LARGEST = DEEP ? CANONICAL_LIST_LIMIT : 7;

/** Every permutation of 0..n-1. */
function permutationsOf(n: number): number[][] {
  if (n === 0) return [[]];
  return permutationsOf(n - 1).flatMap((rest) =>
    Array.from({ length: n }, (_, i) => [...rest.slice(0, i), n - 1, ...rest.slice(i)]),
  );
}

/** The pairs (a, b), a < b, from 0, in the order of the rank's bits. */
const pairsOf = (n: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let a = 0; a < n - 1; a++) for (let b = a + 1; b < n; b++) out.push([a, b]);
  return out;
};

/** The least rank over all n! labelings of the graph with rank `rank`, by brute force. */
function bruteCanonical(n: number, rank: number, labelings: number[][], pairs: [number, number][]): number {
  const index = new Map(pairs.map(([a, b], k) => [a * n + b, k]));
  const present = pairs.filter((_, k) => Math.floor(rank / 2 ** k) % 2 === 1);
  let least = Number.POSITIVE_INFINITY;
  for (const sigma of labelings) {
    let relabeled = 0;
    for (const [a, b] of present) {
      const [x, y] = sigma[a] < sigma[b] ? [sigma[a], sigma[b]] : [sigma[b], sigma[a]];
      relabeled += 2 ** index.get(x * n + y)!;
    }
    if (relabeled < least) least = relabeled;
  }
  return least;
}

for (const n of DEEP ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5]) {
  test(`the canonical rank is the least over all ${n}! labelings, for every graph on ${n} vertices`, () => {
    const [labelings, pairs] = [permutationsOf(n), pairsOf(n)];
    const total = 2 ** pairs.length;
    const classes = new Set<number>();
    for (let rank = 0; rank < total; rank++) {
      const want = bruteCanonical(n, rank, labelings, pairs);
      const edges = edgesOfRank(n, rank);
      expect([rank, canonicalRank(n, edges)]).toEqual([rank, want]);
      expect([rank, labeledRank(n, edges)]).toEqual([rank, rank]);
      // The blocks carry the same rank and the same graph, exactly.
      const blocks = canonicalBlocks(adjacencyOf(n, edges))!;
      expect([rank, rankOfBlocks(blocks)]).toEqual([rank, BigInt(want)]);
      expect([rank, edgesOfBlocks(blocks)]).toEqual([rank, edgesOfRank(n, want)]);
      // A graph is canonical exactly when it is its own least relabeling.
      expect([rank, isCanonical(adjacencyOfRank(n, rank))]).toEqual([rank, want === rank]);
      classes.add(want);
    }
    // The list of canonical ranks is the set of least ranks.
    expect(canonicalRanks(n)).toEqual([...classes].toSorted((a, b) => a - b));
  });
}

test("the list's lengths are A000088, and it is ascending", () => {
  const lengths = Array.from({ length: LARGEST + 1 }, (_, n) => canonicalRanks(n)!.length);
  expect(lengths).toEqual([1, 1, 2, 4, 11, 34, 156, 1044, 12346].slice(0, LARGEST + 1));
  for (let n = 0; n <= LARGEST; n++) {
    const list = canonicalRanks(n)!;
    for (let i = 1; i < list.length; i++) expect([n, i, list[i - 1] < list[i]]).toEqual([n, i, true]);
  }
});

test("the list starts with the graph without edges, the single edge and the path, and ends with the complete graph", () => {
  for (let n = 3; n <= LARGEST; n++) {
    const list = canonicalRanks(n)!;
    const bits = (n * (n - 1)) / 2;
    expect([n, list.slice(0, 3)]).toEqual([n, [0, 1, 3]]);
    expect(edgesOfRank(n, 3)).toEqual([
      [1, 2],
      [1, 3],
    ]);
    // The complete graph, and before it the complete graph without the edge [n - 1, n], the top bit.
    expect([n, list.at(-1)]).toEqual([n, 2 ** bits - 1]);
    expect([n, list.at(-2)]).toEqual([n, 2 ** (bits - 1) - 1]);
  }
});

test("the form is hereditary: a canonical rank shifted right by n - 1 is canonical on n - 1 vertices", () => {
  for (let n = 1; n <= LARGEST; n++) {
    const below = new Set(canonicalRanks(n - 1)!);
    for (const rank of canonicalRanks(n)!) {
      const rest = Math.floor(rank / 2 ** (n - 1));
      expect([n, rank, below.has(rest)]).toEqual([n, rank, true]);
    }
  }
});

test("positionOf finds a canonical rank in its list, and no other", () => {
  const list = canonicalRanks(5)!;
  list.forEach((rank, i) => expect(positionOf(5, rank)).toBe(i));
  const member = new Set(list);
  for (let rank = 0; rank < 2 ** 10; rank++) if (!member.has(rank)) expect(positionOf(5, rank)).toBe(-1);
});

test("past the list's limit the list declines, and so does a rank no double holds", () => {
  expect(canonicalRanks(CANONICAL_LIST_LIMIT + 1)).toBeUndefined();
  expect(canonicalRanks(-1)).toBeUndefined();
  expect(canonicalRanks(2.5)).toBeUndefined();
  expect(positionOf(CANONICAL_LIST_LIMIT + 1, 0)).toBe(-1);
  expect(canonicalRank(11, [[1, 2]])).toBeUndefined();
  expect(labeledRank(11, [[1, 2]])).toBeUndefined();
});

// ─── beyond what brute force reaches: relabelings, named graphs, and the blocks ───────────────────────────────

type Edges = [number, number][];
const withPairs = (n: number, joined: (a: number, b: number) => boolean): Edges => {
  const edges: Edges = [];
  for (let a = 1; a < n; a++) for (let b = a + 1; b <= n; b++) if (joined(a, b)) edges.push([a, b]);
  return edges;
};
const cycle = (n: number): Edges => withPairs(n, (a, b) => b === a + 1 || (a === 1 && b === n));
const path = (n: number): Edges => withPairs(n, (a, b) => b === a + 1);
const completeBipartite = (m: number): Edges => withPairs(2 * m, (a, b) => a <= m && b > m);
const rook = (rows: number, columns: number): Edges =>
  withPairs(
    rows * columns,
    (a, b) =>
      Math.floor((a - 1) / columns) === Math.floor((b - 1) / columns) || (a - 1) % columns === (b - 1) % columns,
  );
const petersen = (): Edges => {
  // The vertices are the 2-subsets of 1..5, joined when disjoint.
  const pairsOfFive: number[][] = [];
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) pairsOfFive.push([i, j]);
  return withPairs(10, (a, b) => !pairsOfFive[a - 1].some((x) => pairsOfFive[b - 1].includes(x)));
};
/** The Paley graph on the prime q: joined when the difference is a nonzero square. */
const paley = (q: number): Edges => {
  const squares = new Set(Array.from({ length: q - 1 }, (_, i) => ((i + 1) * (i + 1)) % q));
  return withPairs(q, (a, b) => squares.has((b - a) % q));
};
/** The Shrikhande graph: the Cayley graph of Z4 x Z4 on ±(1, 0), ±(0, 1), ±(1, 1), as strongly regular as the 4 × 4 rook's graph. */
const shrikhande = (): Edges => {
  const steps = [
    [1, 0],
    [3, 0],
    [0, 1],
    [0, 3],
    [1, 1],
    [3, 3],
  ];
  return withPairs(16, (a, b) => {
    const [x, y, u, v] = [Math.floor((a - 1) / 4), (a - 1) % 4, Math.floor((b - 1) / 4), (b - 1) % 4];
    return steps.some(([dx, dy]) => (x + dx) % 4 === u && (y + dy) % 4 === v);
  });
};

// A fixed pseudo-random stream, so a failure repeats.
let seed = 20261115;
const random = (below: number): number => {
  seed = (seed * 1103515245 + 12345) % 2 ** 31;
  return Math.floor((seed / 2 ** 31) * below);
};

/** The graph with its vertices renamed by a pseudo-random permutation, edges back in the form [u, v] with u < v. */
function relabeled(n: number, edges: Edges): Edges {
  const names = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = random(i + 1);
    [names[i], names[j]] = [names[j], names[i]];
  }
  return edges.map(([a, b]) => [names[a - 1], names[b - 1]].toSorted((x, y) => x - y) as [number, number]);
}

const same = (n: number, a: Edges, b: Edges): boolean => {
  const [x, y] = [canonicalBlocks(adjacencyOf(n, a)), canonicalBlocks(adjacencyOf(n, b))];
  return x !== undefined && y !== undefined && x.every((block, i) => block === y[i]);
};

const CASES: [string, number, Edges][] = [
  ["the 6-cycle", 6, cycle(6)],
  ["the 12-cycle", 12, cycle(12)],
  ["the path on 10 vertices", 10, path(10)],
  ["K(4, 4)", 8, completeBipartite(4)],
  ["K(6, 6)", 12, completeBipartite(6)],
  ["the Petersen graph", 10, petersen()],
  ["the Paley graph on 13 vertices", 13, paley(13)],
  ["the 3 × 3 rook's graph", 9, rook(3, 3)],
  ["the 4 × 4 rook's graph", 16, rook(4, 4)],
  ["the Shrikhande graph", 16, shrikhande()],
];

for (const [name, n, edges] of CASES) {
  test(`${name}: every relabeling has the same canonical blocks, and its canonical graph is canonical`, () => {
    const blocks = canonicalBlocks(adjacencyOf(n, edges))!;
    expect(blocks).toBeDefined();
    for (let i = 0; i < 4; i++) expect(canonicalBlocks(adjacencyOf(n, relabeled(n, edges)))).toEqual(blocks);
    // The canonical graph read back has the same blocks, and is its own least labeling.
    const canonical = edgesOfBlocks(blocks) as Edges;
    expect(canonical.length).toBe(edges.length);
    expect(canonicalBlocks(adjacencyOf(n, canonical))).toEqual(blocks);
    expect(isCanonical(adjacencyOf(n, canonical))).toBe(true);
  });
}

test("graphs that differ in structure have different blocks, strongly regular graphs among them", () => {
  // The 4 × 4 rook's graph and the Shrikhande graph: both strongly regular with parameters (16, 6, 2, 2).
  expect(same(16, rook(4, 4), shrikhande())).toBe(false);
  // Three edges on 6 vertices: a perfect matching against a triangle.
  expect(
    same(
      6,
      [
        [1, 2],
        [3, 4],
        [5, 6],
      ],
      cycle(3),
    ),
  ).toBe(false);
  // The 6-cycle against two triangles: both 2-regular on 6 vertices.
  expect(
    same(6, cycle(6), [
      [1, 2],
      [2, 3],
      [1, 3],
      [4, 5],
      [5, 6],
      [4, 6],
    ]),
  ).toBe(false);
  // The Petersen graph against a different 3-regular graph on 10 vertices (a 5-prism).
  const prism = withPairs(
    10,
    (a, b) =>
      b === a + 5 ||
      (a <= 5 && b <= 5 && (b === a + 1 || (a === 1 && b === 5))) ||
      (a > 5 && (b === a + 1 || (a === 6 && b === 10))),
  );
  expect(same(10, petersen(), prism)).toBe(false);
});

test("the Paley graph on 9 vertices is the 3 × 3 rook's graph", () => {
  // GF(9) = Z3[i]: the element a + b i is 3b + a.
  const times = (x: number, y: number): number => {
    const [a, b, c, d] = [x % 3, Math.floor(x / 3), y % 3, Math.floor(y / 3)];
    return 3 * ((a * d + b * c) % 3) + ((a * c - b * d + 9) % 3);
  };
  const squares = new Set(Array.from({ length: 8 }, (_, i) => times(i + 1, i + 1)));
  expect(squares.size).toBe(4);
  const minus = (x: number, y: number): number =>
    3 * ((Math.floor(x / 3) - Math.floor(y / 3) + 3) % 3) + (((x % 3) - (y % 3) + 3) % 3);
  const paley9 = withPairs(9, (a, b) => squares.has(minus(a - 1, b - 1)));
  expect(paley9.length).toBe(18);
  expect(same(9, paley9, rook(3, 3))).toBe(true);
});

test("a search past its branch limit declines, and the blocks are the search's levels", () => {
  expect(canonicalSearch(adjacencyOf(16, path(16)), 100)).toBeUndefined();
  expect(canonicalBlocks(adjacencyOf(31, []))).toBeUndefined();
  const found = canonicalSearch(adjacencyOf(10, petersen()))!;
  expect(found.levels.length).toBe(10);
  expect(found.levels[0]).toBe(0);
  expect(found.nodes).toBeGreaterThan(10);
});

test("twins give the same canonical form whichever is taken: the complete bipartite graph needs few branches", () => {
  const found = canonicalSearch(adjacencyOf(30, completeBipartite(15)))!;
  expect(found.nodes).toBeLessThan(200);
});
