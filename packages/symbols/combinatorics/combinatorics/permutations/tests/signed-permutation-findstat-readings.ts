// Independent readings of the signed-permutation statistics adopted from FindStat, written against
// FindStat's own formulas (its pair sets, the 0 put before the word) rather than against the
// expressions. A signed permutation is the word of its signed entries.

const indices = (n: number): number[] => Array.from({ length: n }, (_, i) => i);
/** The index pairs i < j, or i <= j when `inclusive`. */
const pairs = (n: number, inclusive: boolean): [number, number][] =>
  indices(n).flatMap((i) =>
    indices(n)
      .filter((j) => (inclusive ? j >= i : j > i))
      .map((j): [number, number] => [i, j]),
  );

/** The number of adjacent pairs i < n with p(i) > p(i+1). */
const wordDescents = (p: readonly number[]): number => indices(p.length - 1).filter((i) => p[i]! > p[i + 1]!).length;
const negatives = (p: readonly number[]): number => p.filter((a) => a < 0).length;
/** The inverse signed permutation, as the word of its entries: it sends |p(t)| to t, with p(t)'s sign. */
const inverse = (p: readonly number[]): number[] => {
  const q = new Array<number>(p.length);
  p.forEach((a, t) => (q[Math.abs(a) - 1] = Math.sign(a) * (t + 1)));
  return q;
};

export type Reading = (p: readonly number[]) => number;

export const SIGNED_PERMUTATION_READINGS: Record<string, Reading> = {
  NegativeEntryCount: (p) => p.filter((a) => a < 0).length,
  PositiveEntryCount: (p) => p.filter((a) => a > 0).length,
  // St001428: pairs i < j with p(i) > p(j), and pairs i <= j with -p(i) > p(j).
  TypeBInversionCount: (p) =>
    pairs(p.length, false).filter(([i, j]) => p[i]! > p[j]!).length +
    pairs(p.length, true).filter(([i, j]) => -p[i]! > p[j]!).length,
  NegativeSumPairCount: (p) => pairs(p.length, false).filter(([i, j]) => p[i]! + p[j]! < 0).length,
  // St001433: with 0 put before the word, the negative entries plus twice the indices of the descents.
  FlagMajorIndex: (p) => {
    const q = [0, ...p];
    return (
      q.filter((a) => a < 0).length +
      indices(q.length - 1)
        .filter((i) => q[i]! > q[i + 1]!)
        .reduce((total, i) => total + 2 * i, 0)
    );
  },
  // St001893: twice the descents, and 1 more when the first entry is negative.
  FlagDescent: (p) => 2 * wordDescents(p) + ((p[0] ?? 0) < 0 ? 1 : 0),
  // St001892 and St001817: the negative entries plus twice the (weak) excedances.
  FlagExcedance: (p) => negatives(p) + 2 * p.filter((a, i) => a > i + 1).length,
  FlagWeakExcedance: (p) => negatives(p) + 2 * p.filter((a, i) => a >= i + 1).length,
  // St001771 and St001772: pairs i < j with 0 < p(i) < -p(j), and with 0 < p(i) < p(j).
  PositiveBeforeLargerNegativePairCount: (p) =>
    pairs(p.length, false).filter(([i, j]) => 0 < p[i]! && p[i]! < -p[j]!).length,
  IncreasingPositivePairCount: (p) => pairs(p.length, false).filter(([i, j]) => 0 < p[i]! && p[i]! < p[j]!).length,
  // St001870: a positive entry followed by a negative one in p(-n), ..., p(-1), p(1), ..., p(n), where p(-i) = -p(i).
  PositiveBeforeNegativeCount: (p) => {
    const word = [...p.map((a) => -a).toReversed(), ...p];
    return indices(word.length - 1).filter((i) => word[i]! > 0 && word[i + 1]! < 0).length;
  },
  // St001896: the left descents of the inverse, k with q(k) > q(k+1) for k from 0, where q(0) = 0.
  RightDescents: (p) => {
    const q = [0, ...inverse(p)];
    return indices(q.length - 1).filter((k) => q[k]! > q[k + 1]!).length;
  },
  // The two statistics of permutations that read a value against its position, on signed words.
  Excedances: (p) => p.filter((a, i) => a > i + 1).length,
  WeakExcedances: (p) => p.filter((a, i) => a >= i + 1).length,
};
