// Independent readings of the perfect-matching statistics adopted from FindStat, written against
// FindStat's own code (partners, openers and closers, the scan of the open arcs) rather than
// against the expressions. A matching is its pairs, each ascending.

export type Matching = readonly (readonly [number, number])[];

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);
/** The number of points, 2n. */
const points = (m: Matching): number => 2 * m.length;
const partner = (m: Matching, p: number): number => {
  const pair = m.find(([a, b]) => a === p || b === p)!;
  return pair[0] === p ? pair[1] : pair[0];
};
const crosses = ([a, b]: readonly [number, number], [c, d]: readonly [number, number]): boolean =>
  (a < c && c < b && b < d) || (c < a && a < d && d < b);
const nests = ([a, b]: readonly [number, number], [c, d]: readonly [number, number]): boolean =>
  (a < c && d < b) || (c < a && b < d);

/** The size of the largest set of pairs that pairwise satisfy `related`, by trying every subset. */
function largestMutualSet(
  m: Matching,
  related: (p: readonly [number, number], q: readonly [number, number]) => boolean,
): number {
  let best = 0;
  for (let mask = 0; mask < 2 ** m.length; mask++) {
    const chosen = m.filter((_, i) => mask & (1 << i));
    if (chosen.every((p, i) => chosen.slice(i + 1).every((q) => related(p, q)))) best = Math.max(best, chosen.length);
  }
  return best;
}

/** FindStat's St001046: sweep the points, keeping the open openers; at a closer count those opened before its opener. */
function maximalNestingCount(m: Matching): number {
  let w = 0;
  const active: number[] = [];
  for (let i = 1; i <= points(m); i++) {
    const j = partner(m, i);
    if (j < i) {
      w = Math.max(w, active.filter((o) => o < j).length);
      active.splice(active.indexOf(j), 1);
    } else active.push(i);
  }
  return w;
}

/** FindStat's St001047: sweep the points, keeping the open openers; at a closer, the open arcs opened after its opener. */
function maximalRightCrossingCount(m: Matching): number {
  let w = 0;
  const active: number[] = [];
  for (let i = 1; i <= points(m); i++) {
    const j = partner(m, i);
    if (j < i) {
      w = Math.max(w, active.length - 1 - active.filter((o) => o < j).length);
      active.splice(active.indexOf(j), 1);
    } else active.push(i);
  }
  return w;
}

/** FindStat's St000924: pairs join when they cross, and the components are the classes. */
function connectedComponents(m: Matching): number {
  const label = m.map((_, i) => i);
  const root = (i: number): number => (label[i] === i ? i : root(label[i]!));
  m.forEach((p, i) => m.forEach((q, j) => crosses(p, q) && (label[root(i)] = root(j))));
  return new Set(m.map((_, i) => root(i))).size;
}

/** FindStat's restricted growth word: the blocks numbered from 1 in the order of their least points. */
const growthWord = (m: Matching): number[] => {
  const letter = new Map<number, number>();
  [...m]
    .toSorted((a, b) => a[0] - b[0])
    .forEach(([a, b], k) => {
      letter.set(a, k + 1);
      letter.set(b, k + 1);
    });
  return Array.from({ length: points(m) }, (_, i) => letter.get(i + 1)!);
};
/** The occurrences of a pattern of three distinct letters, as FindStat's `pattern_occurrences`: subwords whose standardization is the pattern. */
const patternOccurrences = (w: readonly number[], pattern: readonly number[]): number => {
  const standard = (s: readonly number[]): number[] =>
    s.map((e) => [...new Set(s)].toSorted((a, b) => a - b).indexOf(e) + 1);
  let total = 0;
  for (let i = 0; i < w.length; i++)
    for (let j = i + 1; j < w.length; j++)
      for (let k = j + 1; k < w.length; k++) if (standard([w[i]!, w[j]!, w[k]!]).join() === pattern.join()) total++;
  return total;
};
/** FindStat's St000843: add the blocks in order of their least points; a block that leaves 1 .. size filled closes a component. */
const decompositions = (m: Matching): number => {
  let closed = 0;
  const used: number[] = [];
  for (const [a, b] of [...m].toSorted((p, q) => p[0] - q[0])) {
    used.push(a, b);
    if (Math.max(...used) === used.length) closed++;
  }
  return closed;
};
/** FindStat's St000044: the cycles of the involution of the matching composed with the long cycle. */
const unicellularVertices = (m: Matching): number => {
  const n = points(m);
  const involution = new Map<number, number>(m.flatMap(([a, b]) => [[a, b] as const, [b, a] as const]));
  const longCycle = (i: number): number => (i % n) + 1;
  const seen = new Set<number>();
  let cycles = 0;
  for (let i = 1; i <= n; i++) {
    if (seen.has(i)) continue;
    cycles++;
    for (let j = i; !seen.has(j); j = longCycle(involution.get(j)!)) seen.add(j);
  }
  return cycles;
};
/** FindStat's St000945: the matchings reached by rotating one point at a time and by reflecting. */
const dihedralOrbit = (m: Matching): number => {
  const n = points(m);
  const normal = (pairs: readonly (readonly [number, number])[]): string =>
    JSON.stringify(pairs.map(([i, j]) => (i < j ? [i, j] : [j, i])).toSorted((p, q) => p[0]! - q[0]! || p[1]! - q[1]!));
  const reflect = (pairs: readonly (readonly [number, number])[]): [number, number][] =>
    pairs.map(([i, j]): [number, number] => [n + 1 - j, n + 1 - i]);
  const found = new Set<string>([normal(m), normal(reflect(m))]);
  let current: readonly (readonly [number, number])[] = m;
  for (let step = 0; step < n; step++) {
    current = current.map(([i, j]): [number, number] => [(i % n) + 1, (j % n) + 1]);
    found.add(normal(current));
    found.add(normal(reflect(current)));
  }
  return found.size;
};

export type Reading = (m: Matching) => number;

export const PERFECT_MATCHING_READINGS: Record<string, Reading> = {
  // St000843, St000044, St001835 - St001837, St000945.
  ArcDiagramComponentCount: decompositions,
  UnicellularMapVertexCount: unicellularVertices,
  RestrictedGrowthTwoThreeOneCount: (m) => patternOccurrences(growthWord(m), [2, 3, 1]),
  RestrictedGrowthTwoOneThreeCount: (m) => patternOccurrences(growthWord(m), [2, 1, 3]),
  RestrictedGrowthThreeOneTwoCount: (m) => patternOccurrences(growthWord(m), [3, 1, 2]),
  DihedralOrbitSize: (m) => (m.length === 0 ? 1 : dihedralOrbit(m)),
  PropagatingNumber: (m) => m.filter(([a, b]) => a <= m.length && m.length < b).length,
  EarlyCloserPairCount: (m) => m.filter(([, b]) => b <= m.length + 1).length,
  MaximalNestingCount: maximalNestingCount,
  // St000840: the closers below the largest opener.
  ClosersBelowLargestOpener: (m) => {
    const largest = Math.max(...m.map(([a]) => a));
    return m.filter(([, b]) => b < largest).length;
  },
  // St001997: the edges among 12, 34, 56, ....
  IdentityMatchingEdgeCount: (m) => m.filter(([a, b]) => a % 2 === 1 && b === a + 1).length,
  MaximalRightCrossingCount: maximalRightCrossingCount,
  // St000719, over the pairs sorted by least element: a pair that ends before the next begins.
  AlignedPairCount: (m) => sum(m.map(([, b], i) => m.slice(i + 1).filter(([c]) => b < c).length)),
  // St000043: the crossings and twice the nestings.
  CrossingsPlusTwiceNestings: (m) =>
    sum(m.map((p, i) => m.slice(i + 1).filter((q) => crosses(p, q)).length)) +
    2 * sum(m.map((p, i) => m.slice(i + 1).filter((q) => nests(p, q)).length)),
  // Statistics of set partitions that matchings share.
  TopologicallyConnectedComponents: connectedComponents,
  Successions: (m) => Array.from({ length: points(m) }, (_, i) => i + 1).filter((p) => partner(m, p) === p + 1).length,
  BlocksWithOddMinimum: (m) => m.filter(([a]) => a % 2 === 1).length,
  BlocksWithEvenMinimum: (m) => m.filter(([a]) => a % 2 === 0).length,
  LargestOpener: (m) => Math.max(...m.map(([a]) => a)),
  TerminalClosers: (m) => points(m) - Math.max(...m.map(([a]) => a)),
  CrossingNumber: (m) => largestMutualSet(m, crosses),
  NestingNumber: (m) => largestMutualSet(m, nests),
  Crossings: (m) => sum(m.map((p, i) => m.slice(i + 1).filter((q) => crosses(p, q)).length)),
  // St000780: the matchings that turning the circle of points by 0, 1, 2, ... places give.
  RotationOrbitSize: (m) => {
    const turned = (k: number): string =>
      JSON.stringify(
        m
          .map(([a, b]) => [((a - 1 + k) % points(m)) + 1, ((b - 1 + k) % points(m)) + 1].toSorted((x, y) => x - y))
          .toSorted((p, q) => p[0]! - q[0]!),
      );
    return new Set(Array.from({ length: points(m) }, (_, k) => turned(k))).size;
  },
  Nestings: (m) => sum(m.map((p, i) => m.slice(i + 1).filter((q) => nests(p, q)).length)),
};

/** The heads defined on the matching carrier; the rest are set-partition statistics the carrier shares. */
export const DEFINED_ON_MATCHINGS = [
  "AlignedPairCount",
  "ArcDiagramComponentCount",
  "ClosersBelowLargestOpener",
  "CrossingsPlusTwiceNestings",
  "DihedralOrbitSize",
  "EarlyCloserPairCount",
  "IdentityMatchingEdgeCount",
  "MaximalNestingCount",
  "MaximalRightCrossingCount",
  "PropagatingNumber",
  "RestrictedGrowthThreeOneTwoCount",
  "RestrictedGrowthTwoOneThreeCount",
  "RestrictedGrowthTwoThreeOneCount",
  "UnicellularMapVertexCount",
];
