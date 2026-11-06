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
  // St001555: compose p with itself, as a map of -n..n, until it is the identity.
  SignedPermutationOrder: (p) => {
    const apply = (a: number): number => (a > 0 ? p[a - 1]! : -p[-a - 1]!);
    const identity = (q: readonly number[]): boolean => q.every((a, i) => a === i + 1);
    let power = [...p];
    let order = 1;
    while (!identity(power)) {
      power = power.map(apply);
      order += 1;
    }
    return order;
  },
  // St001769: the codimension of the fixed space of the signed permutation matrix.
  SignedReflectionLength: (p) => {
    const n = p.length;
    // The matrix minus the identity: column t holds sign(p(t)) in row |p(t)|.
    const rows = indices(n).map((r) =>
      indices(n).map((c) => (Math.abs(p[c]!) === r + 1 ? Math.sign(p[c]!) : 0) - (r === c ? 1 : 0)),
    );
    let rank = 0;
    for (let c = 0; c < n; c++) {
      const pivot = rows.findIndex((row, r) => r >= rank && Math.abs(row[c]!) > 1e-9);
      if (pivot < 0) continue;
      [rows[rank], rows[pivot]] = [rows[pivot]!, rows[rank]!];
      for (let r = 0; r < n; r++)
        if (r !== rank) {
          const factor = rows[r]![c]! / rows[rank]![c]!;
          rows[r] = rows[r]!.map((v, k) => v - factor * rows[rank]![k]!);
        }
      rank += 1;
    }
    return rank;
  },
  // St001819: neg + 2 den(perm), den adding the excedance positions to the inversions within the excedance and non-excedance subwords.
  FlagDenertIndex: (p) => {
    const w = p.map(Math.abs);
    const excedance = indices(w.length).filter((i) => w[i]! > i + 1);
    const rest = indices(w.length).filter((i) => w[i]! <= i + 1);
    const inversionsOf = (block: number[]): number =>
      pairs(block.length, false).filter(([a, b]) => w[block[a]!]! > w[block[b]!]!).length;
    return (
      negatives(p) +
      2 * (excedance.reduce((total, i) => total + i + 1, 0) + inversionsOf(excedance) + inversionsOf(rest))
    );
  },
  // St001821: sort by moving n, then n - 1, ... into place with the signed transposition (+-t, k); it costs k - (+-t), less 1 when the sign is negative.
  SignedSortingIndex: (p) => {
    const w = [...p];
    let total = 0;
    for (let k = w.length; k >= 1; k--) {
      const t = w.findIndex((a) => Math.abs(a) === k) + 1;
      const sign = Math.sign(w[t - 1]!);
      if (t < k) {
        total += k - sign * t - (sign < 0 ? 1 : 0);
        w[t - 1] = sign * w[k - 1]!;
        w[k - 1] = k;
      } else if (sign < 0) {
        total += 2 * k - 1;
        w[t - 1] = k;
      }
    }
    return total;
  },
  // St001822: the pairs (i, j) of 1..n meeting any of FindStat's six alignment inequalities, with p(-i) = -p(i).
  SignedAlignmentCount: (p) => {
    const f = (i: number): number => (i > 0 ? p[i - 1]! : -p[-i - 1]!);
    let total = 0;
    for (let i = 1; i <= p.length; i++)
      for (let j = 1; j <= p.length; j++) {
        if (-i < -j && -j < -f(j) && -f(j) < -f(i)) total++;
        if (-i < j && j <= f(j) && f(j) < -f(i)) total++;
        if (i < j && j <= f(j) && f(j) < f(i)) total++;
        if (-i < 0 && 0 < -f(i) && -f(i) < f(j) && f(j) < j) total++;
        if (i <= f(i) && f(i) < f(j) && f(j) < j) total++;
        if (f(i) < i && i < j && j <= f(j)) total++;
      }
    return total;
  },
  // St001823: half the pairs -n <= i < j <= n of different parity with p(i) > p(j), where p(-k) = -p(k) and p(0) = 0.
  StasinskiVollLength: (p) => {
    const f = (i: number): number => (i === 0 ? 0 : i > 0 ? p[i - 1]! : -p[-i - 1]!);
    let total = 0;
    for (let i = -p.length; i <= p.length; i++)
      for (let j = i + 1; j <= p.length; j++) if ((j - i) % 2 !== 0 && f(i) > f(j)) total++;
    return total / 2;
  },
  // The two statistics of permutations that read a value against its position, on signed words.
  Excedances: (p) => p.filter((a, i) => a > i + 1).length,
  WeakExcedances: (p) => p.filter((a, i) => a >= i + 1).length,
};
