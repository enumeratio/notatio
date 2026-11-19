// Independent readings of the poset statistics adopted from FindStat, written against FindStat's definitions rather than
// against the expressions: the poset as a boolean matrix, searched by brute force over element subsets.

/** A poset as the list of each element's lower covers: entry i (element i + 1) holds the elements it covers. */
export type Poset = readonly (readonly number[])[];

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);
const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
const largest = (values: readonly number[]): number => values.reduce((a, b) => Math.max(a, b), 0);

/** `less[x][y]`: x is strictly below y, the elements indexed from 0; the closure of the covers. */
export function strictOrder(covers: Poset): boolean[][] {
  const n = covers.length;
  const less = Array.from({ length: n }, () => Array.from({ length: n }, () => false));
  covers.forEach((lower, y) => {
    for (const x of lower) less[x - 1]![y] = true;
  });
  for (let k = 0; k < n; k++)
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) if (less[x]![k] && less[k]![y]) less[x]![y] = true;
  return less;
}

/** Whether `value` is a poset in our carrier's sense: entries ascending, each element below its index, transitively reduced. */
export function isPoset(value: unknown): value is Poset {
  if (!Array.isArray(value)) return false;
  const rows = value as unknown[];
  const shaped = rows.every(
    (row, i) =>
      Array.isArray(row) &&
      (row as unknown[]).every((c) => Number.isInteger(c) && (c as number) >= 1 && (c as number) <= i) &&
      (row as number[]).every((c, k, all) => k === 0 || all[k - 1]! < c),
  );
  if (!shaped) return false;
  const less = strictOrder(rows as number[][]);
  return (rows as number[][]).every((lower) => lower.every((a) => lower.every((b) => !less[a - 1]![b - 1])));
}

/** Every poset on n elements in our carrier's sense, each as its lower covers: an element added on top of an antichain. */
export function posetsOfSize(n: number): number[][][] {
  if (n === 0) return [[]];
  return posetsOfSize(n - 1).flatMap((rest) => {
    const less = strictOrder(rest);
    const found: number[][][] = [];
    for (let mask = 0; mask < 2 ** (n - 1); mask++) {
      const lower = range(1, n - 1).filter((x) => (mask >> (x - 1)) & 1);
      if (lower.every((a) => lower.every((b) => !less[a - 1]![b - 1]))) found.push([...rest, lower]);
    }
    return found;
  });
}

interface Order {
  readonly n: number;
  /** x is strictly below y. */
  readonly lt: (x: number, y: number) => boolean;
  /** x and y are comparable or equal. */
  readonly related: (x: number, y: number) => boolean;
  readonly elements: number[];
}
function orderOf(covers: Poset): Order {
  const less = strictOrder(covers);
  const n = covers.length;
  return {
    n,
    lt: (x, y) => less[x]![y]!,
    related: (x, y) => x === y || less[x]![y]! || less[y]![x]!,
    elements: range(0, n - 1),
  };
}

/** The subsets of the elements, as lists of elements from 0. */
const subsets = (n: number): number[][] =>
  Array.from({ length: 2 ** n }, (_, mask) => range(0, n - 1).filter((v) => (mask >> v) & 1));
const pairsOf = (set: readonly number[]): [number, number][] =>
  set.flatMap((u, i) => set.slice(i + 1).map((v) => [u, v] as [number, number]));
const chains = (o: Order): number[][] => subsets(o.n).filter((s) => pairsOf(s).every(([x, y]) => o.related(x, y)));
const antichains = (o: Order): number[][] => subsets(o.n).filter((s) => pairsOf(s).every(([x, y]) => !o.related(x, y)));
const strictPairs = (o: Order): [number, number][] =>
  o.elements.flatMap((x) => o.elements.filter((y) => o.lt(x, y)).map((y) => [x, y] as [number, number]));
const isCover = (o: Order, x: number, y: number): boolean =>
  o.lt(x, y) && !o.elements.some((z) => o.lt(x, z) && o.lt(z, y));
const covering = (o: Order): [number, number][] => strictPairs(o).filter(([x, y]) => isCover(o, x, y));
const between = (o: Order, x: number, y: number): number[] =>
  o.elements.filter((z) => (z === x || o.lt(x, z)) && (z === y || o.lt(z, y)));
const above = (o: Order, x: number): number[] => o.elements.filter((y) => y === x || o.lt(x, y));

/** The cuts of the order into ordinal summands: the proper nonempty sets entirely below everything outside them. */
const cuts = (o: Order): number[][] =>
  subsets(o.n).filter(
    (d) =>
      d.length > 0 &&
      d.length < o.n &&
      d.every((x) => o.elements.filter((y) => !d.includes(y)).every((y) => o.lt(x, y))),
  );
/** The sizes of the ordinal summands, from the bottom. */
function summandSizes(o: Order): number[] {
  if (o.n === 0) return [];
  const sizes = [
    0,
    ...cuts(o)
      .map((d) => d.length)
      .toSorted((a, b) => a - b),
    o.n,
  ];
  return sizes.slice(1).map((size, k) => size - sizes[k]!);
}

/** The Möbius function by its recurrence, read from the bottom: μ(x, x) = 1, μ(x, y) = −Σ over x ≤ z < y of μ(x, z). */
function moebius(o: Order): number[][] {
  const mu = Array.from({ length: o.n }, () => Array.from({ length: o.n }, () => 0));
  for (const x of o.elements) {
    mu[x]![x] = 1;
    for (const y of o.elements.filter((y) => o.lt(x, y)))
      mu[x]![y] = -sum(o.elements.filter((z) => (z === x || o.lt(x, z)) && o.lt(z, y)).map((z) => mu[x]![z]!));
  }
  return mu;
}

/** The number of relations x ≤ y after adding x < y and closing under transitivity. */
function closedRelationCount(o: Order, x: number, y: number): number {
  const le = o.elements.map((a) => o.elements.map((b) => a === b || o.lt(a, b)));
  le[x]![y] = true;
  for (const k of o.elements)
    for (const a of o.elements) for (const b of o.elements) if (le[a]![k] && le[k]![b]) le[a]![b] = true;
  return sum(le.map((row) => row.filter(Boolean).length));
}

/** Every linear extension, as a list of elements from 0, found by search: each step places an element all of whose lower elements are placed. */
function linearExtensions(o: Order): number[][] {
  const found: number[][] = [];
  const place = (sequence: number[]): void => {
    if (sequence.length === o.n) {
      found.push(sequence);
      return;
    }
    for (const x of o.elements)
      if (!sequence.includes(x) && o.elements.every((y) => !o.lt(y, x) || sequence.includes(y)))
        place([...sequence, x]);
  };
  place([]);
  return found;
}
/** The unordered pairs {x, y}, x < y as numbers, with the count of linear extensions placing x first, over the count of all. */
function pairShares(o: Order): { first: number; all: number }[] {
  const extensions = linearExtensions(o);
  return pairsOf(o.elements).map(([x, y]) => ({
    first: extensions.filter((e) => e.indexOf(x) < e.indexOf(y)).length,
    all: extensions.length,
  }));
}
/** The maximal chains and antichains: the ones no other element can join. */
const maximalChains = (o: Order): number[][] =>
  chains(o).filter((c) => o.elements.every((x) => c.includes(x) || !c.every((y) => o.related(x, y))));
const maximalAntichains = (o: Order): number[][] =>
  antichains(o).filter((a) => o.elements.every((x) => a.includes(x) || a.some((y) => o.related(x, y))));
/** How many sets of `family` have the fewest (or most) elements, the family being empty giving 0. */
const withExtremeSize = (family: number[][], pick: (sizes: number[]) => number): number => {
  const target = pick(family.map((s) => s.length));
  return family.filter((s) => s.length === target).length;
};

/** The sequences of the greedy algorithm: from the rest's minimal elements, one covering the last chosen if there is one. */
function greedySequences(o: Order): number {
  const take = (sequence: number[]): number => {
    if (sequence.length === o.n) return 1;
    const last = sequence.at(-1);
    const minimal = o.elements.filter(
      (x) => !sequence.includes(x) && o.elements.every((y) => !o.lt(y, x) || sequence.includes(y)),
    );
    const covering = minimal.filter((x) => last !== undefined && isCover(o, last, x));
    return sum((covering.length > 0 ? covering : minimal).map((x) => take([...sequence, x])));
  };
  return take([]);
}

/** The maps from the elements to 0 .. size - 1 that never send a < b to a larger value of a than of b, listed as value lists. */
function monotoneMaps(o: Order, size: number): number[][] {
  const maps: number[][] = [];
  const assign = (values: number[]): void => {
    if (values.length === o.n) {
      maps.push(values);
      return;
    }
    for (let value = 0; value < size; value++) {
      const x = values.length;
      if (o.elements.every((y) => y >= x || !o.lt(y, x) || values[y]! <= value)) assign([...values, value]);
    }
  };
  assign([]);
  return maps;
}

export const POSET_READINGS: Readonly<Record<string, (covers: Poset) => number>> = {
  ElementCount: (p) => p.length,
  MinimalElementCount: (p) => {
    const o = orderOf(p);
    return o.elements.filter((y) => !o.elements.some((x) => o.lt(x, y))).length;
  },
  MaximalElementCount: (p) => {
    const o = orderOf(p);
    return o.elements.filter((x) => !o.elements.some((y) => o.lt(x, y))).length;
  },
  CoverRelationCount: (p) => covering(orderOf(p)).length,
  RelationCount: (p) => p.length + strictPairs(orderOf(p)).length,
  PosetComponentCount: (p) => {
    const o = orderOf(p);
    const left = new Set(o.elements);
    let found = 0;
    while (left.size > 0) {
      found++;
      const reached = [[...left][0]!];
      for (const x of reached) for (const y of o.elements) if (o.related(x, y) && !reached.includes(y)) reached.push(y);
      for (const x of reached) left.delete(x);
    }
    return found;
  },
  // The rank is the length of the longest chain, one less than its size; the poset with no elements has no chain, so -1.
  PosetRank: (p) => largest(chains(orderOf(p)).map((c) => c.length)) - 1,
  PosetHeight: (p) => largest(chains(orderOf(p)).map((c) => c.length)),
  PosetWidth: (p) => largest(antichains(orderOf(p)).map((a) => a.length)),
  ElementCountMinusWidth: (p) => p.length - largest(antichains(orderOf(p)).map((a) => a.length)),
  OrdinalSummandCount: (p) => summandSizes(orderOf(p)).length,
  LargestOrdinalSummandSize: (p) => largest(summandSizes(orderOf(p))),
  MaximumLowerCoverCount: (p) => {
    const o = orderOf(p);
    return largest(o.elements.map((y) => covering(o).filter(([, top]) => top === y).length));
  },
  MaximumUpperCoverCount: (p) => {
    const o = orderOf(p);
    return largest(o.elements.map((x) => covering(o).filter(([bottom]) => bottom === x).length));
  },
  IncomparablePairCount: (p) => antichains(orderOf(p)).filter((a) => a.length === 2).length,
  IncomparableTripleCount: (p) => antichains(orderOf(p)).filter((a) => a.length === 3).length,
  VSubsetCount: (p) => {
    const o = orderOf(p);
    return subsets(o.n)
      .filter((s) => s.length === 3)
      .filter((s) =>
        s.some(
          (x) => s.every((y) => y === x || o.lt(x, y)) && !o.related(...(s.filter((y) => y !== x) as [number, number])),
        ),
      ).length;
  },
  LargestIntervalSize: (p) => {
    const o = orderOf(p);
    return largest(
      o.elements.flatMap((x) => o.elements.filter((y) => x === y || o.lt(x, y)).map((y) => between(o, x, y).length)),
    );
  },
  OpenIntervalCount: (p) => {
    const o = orderOf(p);
    return strictPairs(o).filter(([x, y]) => between(o, x, y).length > 2).length;
  },
  PotentialCoverCount: (p) => {
    const o = orderOf(p);
    const before = p.length + strictPairs(o).length;
    return o.elements
      .flatMap((x) => o.elements.filter((y) => x !== y && !o.related(x, y)).map((y) => [x, y]))
      .filter(([x, y]) => closedRelationCount(o, x!, y!) === before + 1).length;
  },
  PrincipalFilterSizeProduct: (p) => {
    const o = orderOf(p);
    return o.elements.reduce((product, x) => product * above(o, x).length, 1);
  },
  MoebiusFunctionSum: (p) => {
    const o = orderOf(p);
    const mu = moebius(o);
    return sum(o.elements.flatMap((x) => o.elements.filter((y) => x === y || o.lt(x, y)).map((y) => mu[x]![y]!)));
  },
  MaximumMoebiusMagnitude: (p) => {
    const o = orderOf(p);
    const mu = moebius(o);
    return largest(mu.flat().map(Math.abs));
  },
  // The order polytope's facets (Stanley): one for each cover, one for each minimal and one for each maximal element.
  OrderPolytopeFacetCount: (p) => {
    const o = orderOf(p);
    return (
      covering(o).length +
      o.elements.filter((y) => !o.elements.some((x) => o.lt(x, y))).length +
      o.elements.filter((x) => !o.elements.some((y) => o.lt(x, y))).length
    );
  },
  ChainCount: (p) => chains(orderOf(p)).length,
  AntichainCount: (p) => antichains(orderOf(p)).length,
  // The maximal chains are the chains no other element can join.
  MaximalChainCount: (p) => {
    const o = orderOf(p);
    return chains(o).filter((c) => o.elements.every((x) => c.includes(x) || !c.every((y) => o.related(x, y)))).length;
  },
  ShortestMaximalChainSize: (p) => {
    const o = orderOf(p);
    const maximal = chains(o).filter((c) => o.elements.every((x) => c.includes(x) || !c.every((y) => o.related(x, y))));
    return maximal.length === 0 ? 0 : Math.min(...maximal.map((c) => c.length));
  },
  LinearExtensionCount: (p) => linearExtensions(orderOf(p)).length,
  // The empty poset has no chain polytope row: 0 by convention, not the one maximal chain it has.
  ChainPolytopeFacetCount: (p) => (p.length === 0 ? 0 : p.length + maximalChains(orderOf(p)).length),
  JumpNumber: (p) => {
    const o = orderOf(p);
    return Math.min(...linearExtensions(o).map((e) => e.slice(1).filter((next, i) => !isCover(o, e[i]!, next)).length));
  },
  // A cut: the subsets equal to the lower bounds of their upper bounds.
  CutCount: (p) => {
    const o = orderOf(p);
    const atMost = (x: number, y: number): boolean => x === y || o.lt(x, y);
    return subsets(o.n).filter((a) => {
      const upper = o.elements.filter((w) => a.every((x) => atMost(x, w)));
      const lower = o.elements.filter((z) => upper.every((w) => atMost(z, w)));
      return lower.length === a.length && lower.every((z) => a.includes(z));
    }).length;
  },
  MostBalancedPairExtensionCount: (p) => largest(pairShares(orderOf(p)).map((s) => Math.min(s.first, s.all - s.first))),
  OneThirdBalancedPairCount: (p) =>
    pairShares(orderOf(p)).filter((s) => 3 * s.first >= s.all && 3 * s.first <= 2 * s.all).length,
  HalfBalancedPairCount: (p) => pairShares(orderOf(p)).filter((s) => 2 * s.first === s.all).length,
  ShortestMaximalAntichainCount: (p) => withExtremeSize(maximalAntichains(orderOf(p)), (sizes) => Math.min(...sizes)),
  ShortestMaximalAntichainSize: (p) => Math.min(...maximalAntichains(orderOf(p)).map((a) => a.length)),
  LongestMaximalChainCount: (p) => withExtremeSize(maximalChains(orderOf(p)), (sizes) => Math.max(...sizes)),
  ShortestMaximalChainCount: (p) => withExtremeSize(maximalChains(orderOf(p)), (sizes) => Math.min(...sizes)),
  LargestMaximalAntichainCount: (p) => withExtremeSize(maximalAntichains(orderOf(p)), (sizes) => Math.max(...sizes)),
  MaximalAntichainCount: (p) => maximalAntichains(orderOf(p)).length,
  GreedyLinearExtensionCount: (p) => greedySequences(orderOf(p)),
  // The maps route: every monotone map to the 3-chain, not the pairs of ideals the definition counts.
  ThreeChainHomomorphismCount: (p) => monotoneMaps(orderOf(p), 3).length,
  // The surjections onto a chain of any size k, found among the monotone maps to 0 .. k - 1.
  OrderPreservingSurjectionToChainCount: (p) => {
    const o = orderOf(p);
    if (o.n === 0) return 1;
    return sum(
      range(1, o.n).map(
        (k) => monotoneMaps(o, k).filter((values) => range(0, k - 1).every((v) => values.includes(v))).length,
      ),
    );
  },
  IntervalClosedSetCount: (p) => {
    const o = orderOf(p);
    return subsets(o.n).filter((s) =>
      s.every((x) => s.every((y) => (x !== y && !o.lt(x, y)) || between(o, x, y).every((z) => s.includes(z)))),
    ).length;
  },
};
