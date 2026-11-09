// Readings for maps batch 12: parking function (Mp00052, Mp00298, Mp00301, Mp00303, Mp00319, Mp00057), permutation
// (Mp00252, Mp00248, Mp00063, Mp00305), alternating sign matrix (Mp00003-5), perfect matching (Mp00113, Mp00144,
// Mp00145, Mp00116), skew partition (Mp00182, Mp00183, Mp00186, Mp00181, Mp00187, Mp00189), integer partition and
// composition (Mp00179, Mp00180) and graph (Mp00037, Mp00275) maps, after the Sage code FindStat states for
// each. Same contract as map-findstat-readings.ts: FindStat's text in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const ints = (text: string): number[] => JSON.parse(text) as number[];
const list = (items: readonly number[]): string => `[${items.join(",")}]`;
const matrix = (text: string): number[][] => JSON.parse(text) as number[][];
const matrixText = (rows: readonly (readonly number[])[]): string => `[${rows.map(list).join(",")}]`;
const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);
const sum = (items: readonly number[]): number => items.reduce((a, b) => a + b, 0);
const descending = (items: readonly number[]): number[] => items.toSorted((a, b) => b - a);

// --- parking functions: Sage's circular shifts into ParkingFunctions(n) ---

const isParkingFunction = (word: readonly number[]): boolean =>
  word.toSorted((a, b) => a - b).every((value, k) => value >= 1 && value <= k + 1);

/** The first of the n + 1 cyclic shifts mod n + 1 of `word` that is a parking function. */
const circular = (word: readonly number[], n: number): number[] => {
  let shifted = [...word];
  for (let k = 0; k <= n; k++) {
    if (isParkingFunction(shifted)) break;
    shifted = shifted.map((entry) => (entry + 1) % (n + 1));
  }
  return shifted;
};

/** Mp00298: successive differences mod n + 1 with a 0 in front, shifted. */
const repeatsToLeading = (p: readonly number[]): number[] => {
  const n = p.length;
  const code = range(0, n - 2).map((i) => (((p[i + 1]! - p[i]!) % (n + 1)) + n + 1) % (n + 1));
  return circular([0, ...code], n);
};

/** Mp00301: running sums of the differences from the first entry, mod n + 1, shifted. */
const leadingToRepeats = (p: readonly number[]): number[] => {
  const n = p.length;
  const code = range(1, n - 1).map((i) => (((p[i]! - p[0]!) % (n + 1)) + n + 1) % (n + 1));
  return circular(
    range(0, n - 1).map((i) => sum(code.slice(0, i)) % (n + 1)),
    n,
  );
};

/** Mp00057: the touch composition of the Dyck word of the parking function, from its area sequence. */
const touchComposition = (p: readonly number[]): number[] => {
  const area = p.toSorted((a, b) => a - b).map((entry, k) => k + 1 - entry);
  const starts = [...range(0, area.length - 1).filter((k) => area[k] === 0), area.length];
  return range(0, starts.length - 2).map((k) => starts[k + 1]! - starts[k]!);
};

// --- permutations ---

/** Mp00248: the cut set is the descent set of the word with each excedance barred below every other letter. */
const dexComposition = (pi: readonly number[]): number[] => {
  const n = pi.length;
  const barred = pi.map((entry, k) => (entry > k + 1 ? entry - n - 1 : entry));
  const cutsAt = range(1, n - 1).filter((i) => barred[i - 1]! > barred[i]!);
  const bounds = [0, ...cutsAt, n];
  return range(0, bounds.length - 2).map((k) => bounds[k + 1]! - bounds[k]!);
};

/** Mp00063: row π(j), column j. */
const permutationMatrix = (pi: readonly number[]): number[][] =>
  pi.map((_, row) => pi.map((entry) => (entry === row + 1 ? 1 : 0)));

// --- alternating sign matrices ---

const turnedCounterclockwise = (m: number[][]): number[][] => m.map((_, i) => m.map((row) => row[m.length - 1 - i]!));
const turnedClockwise = (m: number[][]): number[][] => m.map((_, i) => m.map((__, j) => m[m.length - 1 - j]![i]!));
const transposed = (m: number[][]): number[][] => m.map((_, i) => m.map((row) => row[i]!));

// --- perfect matchings: "[(1,3),(2,4)]", the arcs by least end ---

const arcs = (text: string): [number, number][] =>
  (JSON.parse(text.replaceAll("(", "[").replaceAll(")", "]")) as number[][]).map(
    ([a, b]) => [Math.min(a!, b!), Math.max(a!, b!)] as [number, number],
  );
const arcsText = (items: readonly (readonly [number, number])[]): string =>
  `[${items
    .map(([a, b]) => [Math.min(a, b), Math.max(a, b)] as const)
    .toSorted((x, y) => x[0] - y[0])
    .map(([a, b]) => `(${a},${b})`)
    .join(",")}]`;

/** Mp00116, Sage's loop: each closer joins the gamma-th open arc from the top of the stack. */
const kasraouiZeng = (matching: readonly [number, number][]): [number, number][] => {
  const sorted = matching.toSorted((x, y) => x[0] - y[0]);
  const gamma = new Map<number, number>();
  sorted.forEach(([, b], i) => gamma.set(b, 1 + sorted.slice(0, i).filter(([, other]) => other > b).length));
  const openers = new Set(sorted.map(([a]) => a));
  const active: number[][] = [];
  const blocks: number[][] = [];
  for (const point of range(1, 2 * matching.length)) {
    const j = gamma.get(point);
    let block: number[];
    if (j === undefined) block = [point];
    else {
      block = active.splice(active.length - j, 1)[0]!;
      block.push(point);
    }
    if (openers.has(point)) active.push(block);
    else blocks.push(block);
  }
  return blocks.map((block) => [block[0]!, block[1]!]);
};

// --- skew partitions: "[[3,2,1],[1,1]]", the outer and inner partitions ---

const skew = (text: string): { outer: number[]; inner: number[]; padded: number[] } => {
  const [outer, inner] = JSON.parse(text) as [number[], number[]];
  return { outer: outer!, inner: inner!, padded: outer!.map((_, k) => inner![k] ?? 0) };
};
const conjugate = (parts: readonly number[]): number[] =>
  range(1, parts[0] ?? 0).map((c) => parts.filter((p) => p >= c).length);
const trimmed = (parts: readonly number[]): number[] => {
  const out = [...parts];
  while (out.at(-1) === 0) out.pop();
  return out;
};

/** Mp00186: the conjugate of the sorted column lengths. */
const dominatingPartition = (text: string): number[] => {
  const { outer, padded } = skew(text);
  const columns = range(0, (outer[0] ?? 0) - 1).map(
    (c) => outer.filter((length, r) => padded[r]! <= c && c < length).length,
  );
  return conjugate(descending(columns.filter((c) => c > 0)));
};

/** Mp00189, Sage's rotation: the half turn about the rectangle of the outer partition. */
const rotatedSkew = (text: string): string => {
  const { outer, padded } = skew(text);
  if (outer.length === 0) return text;
  const width = outer[0]!;
  const nu = outer.toReversed().map((part) => width - part);
  const rowLengths = outer.map((part, r) => part - padded[r]!);
  const ka = nu.map((entry, r) => entry + rowLengths.toReversed()[r]!);
  return `[${list(trimmed(ka))},${list(trimmed(nu))}]`;
};

/** Mp00180: the ribbon whose i-th row from the bottom has a_i cells. */
const ribbon = (a: readonly number[]): string => {
  const rows = a.toReversed();
  const outer: number[] = [];
  const inner: number[] = [];
  for (let r = rows.length - 1; r >= 0; r--) {
    inner[r] = r === rows.length - 1 ? 0 : outer[r + 1]! - 1;
    outer[r] = inner[r]! + rows[r]!;
  }
  return `[${list(outer)},${list(trimmed(inner))}]`;
};

// --- graphs: "([(0,2),(1,2)],3)", edges on the vertices 0 .. n - 1 ---

const graph = (text: string): { n: number; edges: [number, number][] } => {
  const match = /^\(\[(.*)\],(\d+)\)$/.exec(text)!;
  return {
    n: Number(match[2]),
    edges: [...match[1]!.matchAll(/\((\d+),(\d+)\)/g)].map(
      (end) => [Number(end[1]), Number(end[2])] as [number, number],
    ),
  };
};

/** The connected components, each a set of vertices. */
const components = (n: number, edges: readonly [number, number][]): Set<number>[] => {
  const parts = range(0, n - 1).map((v) => new Set([v]));
  for (const [a, b] of edges) {
    const first = parts.find((part) => part.has(a))!;
    const second = parts.find((part) => part.has(b))!;
    if (first !== second) {
      for (const v of second) first.add(v);
      parts.splice(parts.indexOf(second), 1);
    }
  }
  return parts;
};

export const BATCH_TWELVE_READINGS: Readonly<Record<string, Reading>> = {
  "NonDecreasingParkingFunction@ParkingFunction": (p) => list(ints(p).toSorted((a, b) => a - b)),
  "RepeatsToLeading@ParkingFunction": (p) => list(ints(p).length === 0 ? [] : repeatsToLeading(ints(p))),
  "LeadingToRepeats@ParkingFunction": (p) => list(ints(p).length === 0 ? [] : leadingToRepeats(ints(p))),
  "Complement@ParkingFunction": (p) =>
    list(
      circular(
        ints(p).map((entry) => (ints(p).length + 1 - entry) % (ints(p).length + 1)),
        ints(p).length,
      ),
    ),
  "ParkingFunctionComposition@ParkingFunction": (p) => list(ints(p)),
  "TouchComposition@ParkingFunction": (p) => list(touchComposition(ints(p))),
  "Restriction@Permutation": (pi) => list(ints(pi).filter((entry) => entry < ints(pi).length)),
  "DexComposition@Permutation": (pi) => list(dexComposition(ints(pi))),
  "AlternatingSignMatrix@Permutation": (pi) => matrixText(permutationMatrix(ints(pi))),
  "ParkingFunction@Permutation": (pi) => list(ints(pi)),
  "CounterclockwiseRotation@AlternatingSignMatrix": (m) => matrixText(turnedCounterclockwise(matrix(m))),
  "ClockwiseRotation@AlternatingSignMatrix": (m) => matrixText(turnedClockwise(matrix(m))),
  "TransposeAlternatingSignMatrix@AlternatingSignMatrix": (m) => matrixText(transposed(matrix(m))),
  "Reverse@PerfectMatching": (m) =>
    arcsText(arcs(m).map(([a, b]) => [2 * arcs(m).length + 1 - a, 2 * arcs(m).length + 1 - b])),
  "Rotation@PerfectMatching": (m) =>
    arcsText(arcs(m).map(([a, b]) => [(a % (2 * arcs(m).length)) + 1, (b % (2 * arcs(m).length)) + 1])),
  "InverseRotation@PerfectMatching": (m) =>
    arcsText(
      arcs(m).map(([a, b]) => [
        ((a - 2 + 2 * arcs(m).length) % (2 * arcs(m).length)) + 1,
        ((b - 2 + 2 * arcs(m).length) % (2 * arcs(m).length)) + 1,
      ]),
    ),
  "KasraouiZeng@PerfectMatching": (m) => arcsText(kasraouiZeng(arcs(m))),
  "OuterShape@SkewPartition": (s) => list(skew(s).outer),
  "InnerShape@SkewPartition": (s) => list(skew(s).inner),
  "DominatingPartition@SkewPartition": (s) => list(dominatingPartition(s)),
  "RowLengths@SkewPartition": (s) => list(skew(s).outer.map((part, r) => part - skew(s).padded[r]!)),
  "TransposeSkewPartition@SkewPartition": (s) =>
    `[${list(conjugate(skew(s).outer))},${list(conjugate(skew(s).inner))}]`,
  "RotateSkewPartition@SkewPartition": rotatedSkew,
  "SkewPartition@IntegerPartition": (la) => `[${list(ints(la))},[]]`,
  "SkewPartition@IntegerComposition": (a) => ribbon(ints(a)),
  "ComponentSizePartition@LabeledGraph": (g) => {
    const { n, edges } = graph(g);
    return list(descending(components(n, edges).map((part) => part.size)));
  },
  "ComponentEdgePartition@LabeledGraph": (g) => {
    const { n, edges } = graph(g);
    return list(
      descending(components(n, edges).map((part) => edges.filter(([a]) => part.has(a)).length)).filter(
        (size) => size > 0,
      ),
    );
  },
};
