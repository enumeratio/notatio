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
  // The two statistics of permutations that read a value against its position, on signed words.
  Excedances: (p) => p.filter((a, i) => a > i + 1).length,
  WeakExcedances: (p) => p.filter((a, i) => a >= i + 1).length,
};
