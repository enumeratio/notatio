// FindStat writes each object as text (`[2,1]`, `{{1,3},{2}}`, `[.,[.,.]]`); the carrier value
// we read it as, for the carriers whose text has been checked against our own, and the object's
// size, which the by-value matching caps. Where FindStat and we differ the reader says so.

import type { MathJSON } from "../../src/statistics/types.ts";

const list = (items: readonly MathJSON[]): MathJSON => ["List", ...items];
const ints = (text: string): number[] => JSON.parse(text) as number[];
const intList = (text: string): MathJSON => list(ints(text));
const rows = (text: string): MathJSON => list((JSON.parse(text) as number[][]).map((row) => list(row)));
const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
const count = (text: string, pattern: RegExp): number => text.match(pattern)?.length ?? 0;

/** `{{1,3},{2}}` and `[{1},{2,3}]`: braces are blocks, so read them as lists. */
const blocks = (text: string): MathJSON =>
  list((JSON.parse(text.replace(/\{/g, "[").replace(/\}/g, "]")) as number[][]).map((block) => list(block)));

/** `[(1,2),(3,4)]` as the 2-element blocks `[[1,2],[3,4]]`. */
const pairs = (text: string): MathJSON =>
  list((JSON.parse(text.replace(/\(/g, "[").replace(/\)/g, "]")) as number[][]).map((pair) => list(pair)));

/** `[.,[.,.]]`: `.` is the empty tree, `[L,R]` a node with its left and right subtrees. */
function binaryTree(text: string): MathJSON {
  let at = 0;
  const tree = (): MathJSON => {
    if (text[at] === ".") {
      at++;
      return 0;
    }
    if (text[at] !== "[") throw new SyntaxError(`binary tree: unexpected ${text[at] ?? "end"} at ${at}`);
    at++;
    const left = tree();
    if (text[at++] !== ",") throw new SyntaxError(`binary tree: expected "," at ${at - 1}`);
    const right = tree();
    if (text[at++] !== "]") throw new SyntaxError(`binary tree: expected "]" at ${at - 1}`);
    return list([left, right]);
  };
  const result = tree();
  if (at !== text.length) throw new SyntaxError(`binary tree: trailing text at ${at}`);
  return result;
}

/** `[[],[[]]]`: a node is the list of its children, so `[]` is a single vertex. */
const orderedTree = (text: string): MathJSON => {
  const node = (value: unknown): MathJSON => {
    if (!Array.isArray(value)) throw new SyntaxError("ordered tree: expected a list of children");
    return list(value.map(node));
  };
  return node(JSON.parse(text));
};

/**
 * `([(0,1),(0,2),(1,2)],3)`: the edges on the vertices 0 .. n - 1, and n. Ours is `Tuple(n, edges)`, the vertices from 1
 * and each edge as [u, v] with u < v, in lexicographic order.
 */
function graph(text: string): MathJSON {
  const match = /^\(\[(.*)\],(\d+)\)$/.exec(text);
  if (match === null) throw new SyntaxError(`graph: expected ([(a,b),...],n), got ${text}`);
  const edges = [...match[1]!.matchAll(/\((\d+),(\d+)\)/g)]
    .map((end) => [Number(end[1]) + 1, Number(end[2]) + 1].toSorted((a, b) => a - b))
    .toSorted((a, b) => a[0]! - b[0]! || a[1]! - b[1]!);
  return ["Tuple", Number(match[2]), list(edges.map((edge) => list(edge)))];
}

/**
 * `[+,-,2,1]` as Sage's list: each fixed point decorated `+` stays its position and one decorated `-` is its position
 * negated, the other entries are the permutation's.
 */
function decoratedPermutation(text: string): MathJSON {
  const entries = text.slice(1, -1) === "" ? [] : text.slice(1, -1).split(",");
  if (!text.startsWith("[") || !text.endsWith("]")) throw new SyntaxError(`decorated permutation: cannot read ${text}`);
  return list(
    entries.map((entry, k) => {
      if (entry === "+") return k + 1;
      if (entry === "-") return -(k + 1);
      if (!/^\d+$/.test(entry)) throw new SyntaxError(`decorated permutation: cannot read ${entry}`);
      return Number(entry);
    }),
  );
}

interface Reader {
  readonly read: (text: string) => MathJSON;
  /** The size FindStat's tables are cut at: the length, sum or node count the collection grows by. */
  readonly size: (text: string) => number | undefined;
  /** The arguments of our collection FindStat's level of the object is counted at, where its levels take two: the size and the largest entry. */
  readonly level?: (text: string) => readonly number[];
}

/** `['A', 3]` as its letter and rank. */
function cartanText(text: string): [letter: string, rank: number] {
  const match = /^\['([A-G])',\s*(\d+)\]$/.exec(text);
  if (match === null) throw new SyntaxError(`Cartan type: cannot read ${text}`);
  return [match[1]!, Number(match[2])];
}

const READERS: Readonly<Record<string, Reader>> = {
  Permutation: { read: (t) => ["Permutation", intList(t)], size: (t) => ints(t).length },
  IntegerPartition: { read: (t) => ["IntegerPartition", intList(t)], size: (t) => sum(ints(t)) },
  // A Dyck path is its 0/1 steps: 1 up, 0 down; its size the semilength.
  DyckPath: { read: (t) => ["DyckPath", intList(t)], size: (t) => ints(t).length / 2 },
  SetPartition: { read: (t) => ["SetPartition", blocks(t)], size: (t) => count(t, /\d+/g) },
  // The word as a string of letters: `0110`, the empty word `""`.
  BinaryWord: {
    read: (t) => {
      if (!/^[01]*$/.test(t)) throw new SyntaxError("binary word: not 0s and 1s");
      return ["BinaryWord", list(t.split("").map(Number))];
    },
    size: (t) => t.length,
  },
  IntegerComposition: { read: (t) => ["IntegerComposition", intList(t)], size: (t) => sum(ints(t)) },
  // Signs are on the values and the entries are 1..n, as ours.
  SignedPermutation: { read: (t) => ["SignedPermutation", intList(t)], size: (t) => ints(t).length },
  // Same orientation as ours: a node is [left, right] and the empty tree is 0. Size is the node count.
  BinaryTree: { read: (t) => ["BinaryTree", binaryTree(t)], size: (t) => count(t, /\[/g) },
  // Ours is the same nesting; size is the edge count (a vertex per bracket, less the root).
  OrderedTree: { read: (t) => ["OrderedTree", orderedTree(t)], size: (t) => count(t, /\[/g) - 1 },
  // Rows, English notation, entries 1..n; size the entry count.
  StandardTableau: {
    read: (t) => ["StandardTableau", rows(t)],
    size: (t) => sum((JSON.parse(t) as number[][]).map((r) => r.length)),
  },
  // Rows, English notation, entries weakly increasing along rows and strictly down columns; size the cells. FindStat's level
  // is the cells and the largest entry (exactly), the arguments of `SemistandardTableaux`, whose entries are at most the second.
  SemistandardTableau: {
    read: (t) => ["SemistandardTableau", rows(t)],
    size: (t) => sum((JSON.parse(t) as number[][]).map((r) => r.length)),
    level: (t) => {
      const tableau = JSON.parse(t) as number[][];
      return [sum(tableau.map((r) => r.length)), Math.max(0, ...tableau.flat())];
    },
  },
  // Rows from the top, the row of n entries first, weakly decreasing, each entry between the two above it, as ours; size the rows.
  // FindStat's level is the rows and the first entry of the top row (exactly), the arguments of `GelfandTsetlin`, whose entries are
  // at most the second. The empty pattern has no rows and no top row.
  GelfandTsetlinPattern: {
    read: (t) => ["GelfandTsetlinPattern", rows(t)],
    size: (t) => (JSON.parse(t) as number[][]).length,
    level: (t) => {
      const pattern = JSON.parse(t) as number[][];
      return [pattern.length, pattern[0]?.[0] ?? 0];
    },
  },
  // 1-based: entry i is the spot car i prefers, as ours.
  ParkingFunction: { read: (t) => ["ParkingFunction", intList(t)], size: (t) => ints(t).length },
  // The decorated fixed points are signed in Sage's list: `[-,+]` is [-1, 2]. Size is the number of entries.
  DecoratedPermutation: {
    read: (t) => ["DecoratedPermutation", decoratedPermutation(t)],
    size: (t) => (t === "[]" ? 0 : t.split(",").length),
  },
  // A matching is its 2-element blocks; size the number of points.
  PerfectMatching: { read: (t) => ["PerfectMatching", pairs(t)], size: (t) => count(t, /\d+/g) },
  // Rows of -1, 0, 1; size the number of rows. Our AlternatingSignMatrices family yields the bare rows; this is the carrier's constructor on them.
  AlternatingSignMatrix: {
    read: (t) => ["AlternatingSignMatrix", rows(t)],
    size: (t) => (JSON.parse(t) as number[][]).length,
  },
  SetComposition: { read: (t) => ["SetComposition", blocks(t)], size: (t) => count(t, /\d+/g) },
  // Rows of weakly decreasing positive entries, as ours; size is the number of boxes, the sum of the entries.
  PlanePartition: {
    read: (t) => ["PlanePartition", rows(t)],
    size: (t) => sum((JSON.parse(t) as number[][]).map((r) => sum(r))),
  },
  // `[[outer],[inner]]`, the part lists of λ and μ; size the cells of λ/μ, as ours.
  SkewPartition: {
    read: (t) => ["SkewPartition", rows(t)],
    size: (t) => {
      const [outer, inner] = JSON.parse(t) as [number[], number[]];
      return sum(outer) - sum(inner);
    },
  },
  // A graph up to isomorphism, as the labeled graph FindStat lists it by; the vertex count is the size. We have no collection of
  // graphs up to isomorphism, so the crosscheck compares object by object.
  LabeledGraph: {
    read: (t) => ["LabeledGraph", graph(t)],
    size: (t) => Number(/,(\d+)\)$/.exec(t)?.[1]),
  },
  // `['A', 3]`: the letter and the rank, the size. FindStat also writes C_2 (and B_1, C_1), the same types as B_2 and A_1:
  // the size of those is undefined, so they are left out of the sizes.
  CartanType: {
    read: (t) => {
      const [letter, rank] = cartanText(t);
      return ["CartanType", ["Tuple", `'${letter}'`, rank]];
    },
    size: (t) => {
      const [letter, rank] = cartanText(t);
      return (letter === "C" && rank < 3) || (letter === "B" && rank < 2) ? undefined : rank;
    },
  },
};

/** The carrier value FindStat's `text` names, or `undefined` for a carrier we don't read. A malformed text throws. */
export const readObject = (carrier: string, text: string): MathJSON | undefined => READERS[carrier]?.read(text);

/** The size of the object FindStat's `text` names, or `undefined` for a carrier we don't read. */
export const objectSize = (carrier: string, text: string): number | undefined => READERS[carrier]?.size(text);

/** The arguments of our collection of the level of the object FindStat's `text` names: its size, and for a tableau or a pattern also its largest entry. */
export const objectLevel = (carrier: string, text: string): readonly number[] | undefined => {
  const reader = READERS[carrier];
  if (reader?.level) return reader.level(text);
  const size = reader?.size(text);
  return size === undefined ? undefined : [size];
};

/** FindStat's collections that are one of our carriers, whether or not we read their objects. */
export const COLLECTION_CARRIER: Readonly<Record<string, string>> = {
  Permutations: "Permutation",
  "Signed permutations": "SignedPermutation",
  "Decorated permutations": "DecoratedPermutation",
  "Dyck paths": "DyckPath",
  "Integer partitions": "IntegerPartition",
  "Skew partitions": "SkewPartition",
  Cores: "CorePartition",
  "Set partitions": "SetPartition",
  "Ordered set partitions": "SetComposition",
  "Integer compositions": "IntegerComposition",
  "Binary words": "BinaryWord",
  "Binary trees": "BinaryTree",
  "Ordered trees": "OrderedTree",
  "Perfect matchings": "PerfectMatching",
  "Parking functions": "ParkingFunction",
  "Alternating sign matrices": "AlternatingSignMatrix",
  "Standard tableaux": "StandardTableau",
  "Semistandard tableaux": "SemistandardTableau",
  "Plane partitions": "PlanePartition",
  "Gelfand-Tsetlin patterns": "GelfandTsetlinPattern",
  Graphs: "LabeledGraph",
  "Finite Cartan types": "CartanType",
};

/** The carriers whose text we read. */
export const readableCarriers = (): string[] => Object.keys(READERS);
