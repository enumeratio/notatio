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

export type Reading = (m: Matching) => number;

export const PERFECT_MATCHING_READINGS: Record<string, Reading> = {
  PropagatingNumber: (m) => m.filter(([a, b]) => a <= m.length && m.length < b).length,
  EarlyCloserPairCount: (m) => m.filter(([, b]) => b <= m.length + 1).length,
  MaximalNestingCount: maximalNestingCount,
  // Statistics of set partitions that matchings share.
  Successions: (m) => Array.from({ length: points(m) }, (_, i) => i + 1).filter((p) => partner(m, p) === p + 1).length,
  BlocksWithOddMinimum: (m) => m.filter(([a]) => a % 2 === 1).length,
  BlocksWithEvenMinimum: (m) => m.filter(([a]) => a % 2 === 0).length,
  LargestOpener: (m) => Math.max(...m.map(([a]) => a)),
  TerminalClosers: (m) => points(m) - Math.max(...m.map(([a]) => a)),
  CrossingNumber: (m) => largestMutualSet(m, crosses),
  NestingNumber: (m) => largestMutualSet(m, nests),
  Crossings: (m) => sum(m.map((p, i) => m.slice(i + 1).filter((q) => crosses(p, q)).length)),
  Nestings: (m) => sum(m.map((p, i) => m.slice(i + 1).filter((q) => nests(p, q)).length)),
};

/** The heads defined on the matching carrier; the rest are set-partition statistics the carrier shares. */
export const DEFINED_ON_MATCHINGS = ["EarlyCloserPairCount", "MaximalNestingCount", "PropagatingNumber"];
