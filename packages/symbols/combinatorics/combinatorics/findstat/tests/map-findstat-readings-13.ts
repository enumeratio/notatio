// Readings for maps batch 13: the parking function and permutation maps through Prüfer trees and labelled Dyck words
// (Mp00297, Mp00299, Mp00300, Mp00325, Mp00290, Mp00054), after the Sage code FindStat states for each: a tree is a
// graph, its Prüfer code the smallest leaf's neighbor taken off, its components the subtrees. Same contract as
// map-findstat-readings.ts: FindStat's text in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const ints = (text: string): number[] => JSON.parse(text) as number[];
const list = (items: readonly number[]): string => `[${items.join(",")}]`;
const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);
const mod = (a: number, m: number): number => ((a % m) + m) % m;

/** An undirected graph as vertex -> neighbors. */
type Graph = Map<number, Set<number>>;
const graphOf = (vertices: readonly number[], edges: readonly (readonly [number, number])[]): Graph => {
  const graph: Graph = new Map(vertices.map((v) => [v, new Set<number>()]));
  for (const [a, b] of edges) {
    graph.get(a)!.add(b);
    graph.get(b)!.add(a);
  }
  return graph;
};
const neighbors = (graph: Graph, v: number): number[] => [...graph.get(v)!].toSorted((a, b) => a - b);
const without = (graph: Graph, v: number): Graph => {
  const rest: Graph = new Map(graph);
  rest.delete(v);
  return new Map([...rest].map(([u, adjacent]) => [u, new Set([...adjacent].filter((w) => w !== v))]));
};
/** The vertices reachable from `start`. */
const component = (graph: Graph, start: number): Set<number> => {
  const seen = new Set([start]);
  for (const v of seen) for (const u of graph.get(v)!) seen.add(u);
  return seen;
};
const restrictedTo = (graph: Graph, keep: ReadonlySet<number>): Graph =>
  new Map([...graph].filter(([v]) => keep.has(v)));

/** Sage's pruefer_to_tree vertex set and edges for a code: the smallest vertex outside the code hangs from the next
 *  entry, and the last two vertices are joined. */
const prueferEdges = (code: readonly number[]): [number, number][] => {
  const rest = [...code];
  const vertices = range(0, code.length + 1);
  const edges: [number, number][] = [];
  for (let k = 0; k < code.length; k++) {
    const at = vertices.findIndex((u) => !rest.includes(u));
    const [leaf] = vertices.splice(at, 1);
    edges.push([leaf!, rest.shift()!]);
  }
  edges.push([vertices[0]!, vertices[1]!]);
  return edges;
};

// --- Mp00297: the tree rooted at 0, forgetting labels; a vertex's children by their own child count, then label ---

type Rooted = { label: number; children: Rooted[] };
const subtree = (graph: Graph, root: number): Rooted => {
  const rest = without(graph, root);
  const children = neighbors(graph, root).map((u) => subtree(restrictedTo(rest, component(rest, u)), u));
  return {
    label: root,
    children: children.toSorted((a, b) => a.children.length - b.children.length || a.label - b.label),
  };
};
const shape = (tree: Rooted): string => `[${tree.children.map(shape).join(",")}]`;
const pollakRiordanTree = (p: readonly number[]): string => {
  const n = p.length;
  const code = range(0, n - 2).map((i) => mod(p[i + 1]! - p[i]!, n + 1));
  const edges = prueferEdges(code);
  return shape(subtree(graphOf(range(0, n), edges), 0));
};

// --- Mp00299 and Mp00325: the Foata-Riordan code of the tree of a parking function ---

/** Each entry's rank among the entries, equal entries from left to right. */
const standardization = (p: readonly number[]): number[] =>
  p.map((value, i) => p.filter((other, j) => other < value || (other === value && j <= i)).length);
const inverseOf = (word: readonly number[]): number[] => {
  const inverse: number[] = [];
  word.forEach((value, i) => (inverse[value - 1] = i + 1));
  return inverse;
};
const foataRiordanCode = (p: readonly number[]): { code: number[]; inverse: number[] } => {
  const n = p.length;
  const inverse = inverseOf(standardization(p));
  const edges = p.map((c, k): [number, number] => (c === 1 ? [0, k + 1] : [k + 1, inverse[c - 2]!]));
  let graph = graphOf(range(0, n), edges);
  const vertices = range(0, n);
  const code: number[] = [];
  for (let step = 0; step < n - 1; step++) {
    const leaf = vertices.find((u) => graph.get(u)!.size === 1)!;
    code.push([...graph.get(leaf)!][0]!);
    graph = without(graph, leaf);
    vertices.splice(vertices.indexOf(leaf), 1);
  }
  return { code, inverse };
};
const isParkingFunction = (word: readonly number[]): boolean =>
  word.toSorted((a, b) => a - b).every((value, i) => value >= 1 && value <= i + 1);
const onesToLeading = (p: readonly number[]): number[] => {
  if (p.length === 0) return [];
  let word = [0, ...foataRiordanCode(p).code];
  const n = word.length;
  for (let shift = 0; shift < n && !isParkingFunction(word); shift++) word = word.map((e) => (e + 1) % (n + 1));
  return word;
};
const onesToLeadingPermutation = (tau: readonly number[]): number[] => {
  const n = tau.length;
  if (n === 0) return [];
  const { code, inverse } = foataRiordanCode(tau);
  return [0, ...code].map((e) => mod(e - inverse[n - 1]!, n + 1));
};

// --- Mp00300: the code (p(i) - p(1)) mod (n + 1), its tree read breadth first, back through Foata-Riordan ---

const leadingToOnes = (p: readonly number[]): number[] => {
  const n = p.length;
  if (n === 0) return [];
  const code = range(1, n - 1).map((i) => mod(p[i]! - p[0]!, n + 1));
  const tree = subtree(graphOf(range(0, n), prueferEdges(code)), 0);
  // Breadth first, children by label; f[v] is the label of v's parent and `labels` the order of the visits.
  const labels: number[] = [];
  const parent: number[] = [];
  const queue: Rooted[] = [tree];
  for (const vertex of queue) {
    labels.push(vertex.label);
    const byLabel = vertex.children.toSorted((a, b) => a.label - b.label);
    for (const child of byLabel) parent[child.label - 1] = vertex.label;
    queue.push(...byLabel);
  }
  const sigma = inverseOf(labels.slice(1));
  return parent.map((e) => (e === 0 ? 1 : 1 + sigma[e - 1]!));
};

// --- Mp00290: the runs of the labelled Dyck word, a car's label on each of its up steps ---

const orderedSetPartition = (p: readonly number[]): string => {
  const word = range(1, p.length).flatMap((column) => [
    ...range(1, p.length).filter((car) => p[car - 1] === column),
    0,
  ]);
  const blocks: number[][] = [];
  let block: number[] = [];
  for (const entry of word) {
    if (entry !== 0) block.push(entry);
    else if (block.length > 0) {
      blocks.push(block);
      block = [];
    }
  }
  return `[${blocks.map((b) => `{${b.join(",")}}`).join(",")}]`;
};

// --- Mp00054: the descents composition of the inverse of the diagonal reading word ---

/** The cars of the Dyck path read by diagonal, the largest area first, each diagonal from the top row down. */
const diagonalReadingWord = (p: readonly number[]): number[] => {
  const rows = range(1, p.length)
    .toSorted((a, b) => p[a - 1]! - p[b - 1]! || a - b)
    .map((car, k) => ({ car, row: k + 1, area: k + 1 - p[car - 1]! }));
  return rows.toSorted((a, b) => b.area - a.area || b.row - a.row).map((r) => r.car);
};
const inverseDescentComposition = (p: readonly number[]): number[] => {
  const inverse = inverseOf(diagonalReadingWord(p));
  const parts: number[] = [];
  let run = 1;
  for (let i = 0; i + 1 < inverse.length; i++) {
    if (inverse[i]! > inverse[i + 1]!) {
      parts.push(run);
      run = 1;
    } else run++;
  }
  return [...parts, run];
};

export const BATCH_THIRTEEN_READINGS: Readonly<Record<string, Reading>> = {
  "OrderedTree@ParkingFunction": (p) => pollakRiordanTree(ints(p)),
  "OnesToLeading@ParkingFunction": (p) => list(onesToLeading(ints(p))),
  "LeadingToOnes@ParkingFunction": (p) => list(leadingToOnes(ints(p))),
  "OnesToLeading@Permutation": (tau) => list(onesToLeadingPermutation(ints(tau))),
  "SetComposition@ParkingFunction": (p) => orderedSetPartition(ints(p)),
  "InverseDescentComposition@ParkingFunction": (p) => list(inverseDescentComposition(ints(p))),
};
