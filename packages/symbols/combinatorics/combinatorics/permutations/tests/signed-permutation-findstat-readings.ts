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
/** Every signed permutation of 1..n, as words. */
const signedPermutationsOf = (n: number): number[][] => {
  const permutations = (m: number): number[][] =>
    m === 0
      ? [[]]
      : permutations(m - 1).flatMap((rest) =>
          Array.from({ length: m }, (_, i) => [...rest.slice(0, i), m, ...rest.slice(i)]),
        );
  return permutations(n).flatMap((q) =>
    Array.from({ length: 2 ** n }, (_, mask) => q.map((v, i) => (mask & (1 << i) ? -v : v))),
  );
};
/** The inverse signed permutation, as the word of its entries: it sends |p(t)| to t, with p(t)'s sign. */
const inverse = (p: readonly number[]): number[] => {
  const q = new Array<number>(p.length);
  p.forEach((a, t) => (q[Math.abs(a) - 1] = Math.sign(a) * (t + 1)));
  return q;
};

/** FindStat's p(k) for k in -n .. n: p(-k) = -p(k) and p(0) = 0. */
const signedAt = (p: readonly number[], k: number): number => (k > 0 ? p[k - 1]! : k < 0 ? -p[-k - 1]! : 0);
/** The nonzero points -n .. n. */
const signedPoints = (n: number): number[] => [...indices(n).map((i) => i - n), ...indices(n).map((i) => i + 1)];
/** The blocks of the direct sum decomposition, FindStat's `decomposition`: cut where the first i entries have absolute values at most i. */
const signBlocks = (p: readonly number[]): number[][] => {
  const blocks: number[][] = [];
  let start = 0;
  for (let i = 1; i < p.length; i++)
    if (Math.max(...p.slice(0, i).map(Math.abs)) <= i) {
      blocks.push(p.slice(start, i));
      start = i;
    }
  if (p.length > 0) blocks.push(p.slice(start));
  return blocks;
};
const oddSignBlocks = (p: readonly number[]): number => signBlocks(p).filter((b) => negatives(b) % 2 === 1).length;
/** FindStat's Sparre Andersen walk, with the weights 1, 2, 4, ...: x_i adds 2^(|p(i)| - 1) times the sign of the entry at position |p(i)|. */
const andersenWalk = (p: readonly number[]): number[] => {
  let total = 0;
  return p.map((a) => {
    total += 2 ** (Math.abs(a) - 1) * Math.sign(p[Math.abs(a) - 1]!);
    return total;
  });
};
/** For each signed permutation of 1..n (as its key), the generators a reduced word uses, found on shortest paths from the identity: s_i swaps the entries i and i + 1, s_n negates the last. */
const supports = new Map<number, Map<string, Set<number>>>();
const generatorSupports = (n: number): Map<string, Set<number>> => {
  const known = supports.get(n);
  if (known) return known;
  const start = indices(n).map((i) => i + 1);
  const used = new Map<string, Set<number>>([[start.join(","), new Set()]]);
  let layer = [start];
  while (layer.length > 0) {
    const next: number[][] = [];
    for (const w of layer)
      for (let g = 1; g <= n; g++) {
        const v = [...w];
        if (g < n) [v[g - 1], v[g]] = [v[g]!, v[g - 1]!];
        else v[n - 1] = -v[n - 1]!;
        if (used.has(v.join(","))) continue;
        used.set(v.join(","), new Set([...used.get(w.join(","))!, g]));
        next.push(v);
      }
    layer = next;
  }
  supports.set(n, used);
  return used;
};
const generatorsUsed = (p: readonly number[]): Set<number> => generatorSupports(p.length).get(p.join(",")) ?? new Set();

/** The products p t of the word with each reflection t of the group: one entry negated, or two entries swapped, with or without both negated. */
const timesReflections = (p: readonly number[]): number[][] => {
  const out: number[][] = [];
  for (let i = 0; i < p.length; i++) {
    out.push(p.map((a, k) => (k === i ? -a : a)));
    for (let j = i + 1; j < p.length; j++) {
      out.push(p.map((a, k) => (k === i ? p[j]! : k === j ? p[i]! : a)));
      out.push(p.map((a, k) => (k === i ? -p[j]! : k === j ? -p[i]! : a)));
    }
  }
  return out;
};
/** The distance of every signed permutation of 1..n from the identity along `neighbors`, by breadth first search. */
const distancesFrom = (n: number, neighbors: (p: readonly number[]) => number[][]): Map<string, number> => {
  const start = indices(n).map((i) => i + 1);
  const distance = new Map<string, number>([[start.join(","), 0]]);
  let layer = [start];
  while (layer.length > 0) {
    const next: number[][] = [];
    for (const w of layer)
      for (const v of neighbors(w))
        if (!distance.has(v.join(","))) {
          distance.set(v.join(","), distance.get(w.join(","))! + 1);
          next.push(v);
        }
    layer = next;
  }
  return distance;
};
/** The Coxeter length, the distance along the generators s_i (swap entries i, i + 1) and s_n (negate the last entry). */
const coxeterLengths = new Map<number, Map<string, number>>();
const coxeterLength = (p: readonly number[]): number => {
  const n = p.length;
  if (!coxeterLengths.has(n))
    coxeterLengths.set(
      n,
      distancesFrom(n, (w) => [
        ...indices(n - 1).map((g) => w.map((a, k) => (k === g ? w[g + 1]! : k === g + 1 ? w[g]! : a))),
        ...(n > 0 ? [w.map((a, k) => (k === n - 1 ? -a : a))] : []),
      ]),
    );
  return coxeterLengths.get(n)!.get(p.join(","))!;
};
/** The reflection length, the distance along the reflections. */
const reflectionLengths = new Map<number, Map<string, number>>();
const reflectionLength = (p: readonly number[]): number => {
  const n = p.length;
  if (!reflectionLengths.has(n)) reflectionLengths.set(n, distancesFrom(n, timesReflections));
  return reflectionLengths.get(n)!.get(p.join(","))!;
};
/** p composed with q: the entry of the composite at i is p(q(i)), signs multiplying. */
const composeSigned = (p: readonly number[], q: readonly number[]): number[] =>
  q.map((b) => Math.sign(b) * p[Math.abs(b) - 1]!);
/** The roots e_i, e_i - e_j and e_i + e_j (i < j) with their heights for the simple roots e_i - e_{i+1} and e_n; a root is positive when its first nonzero coordinate is. */
const positiveRoots = (n: number): { vector: number[]; height: number }[] => {
  const roots: { vector: number[]; height: number }[] = [];
  for (let i = 1; i <= n; i++) {
    roots.push({ vector: indices(n).map((k) => (k === i - 1 ? 1 : 0)), height: n - i + 1 });
    for (let j = i + 1; j <= n; j++) {
      roots.push({ vector: indices(n).map((k) => (k === i - 1 ? 1 : k === j - 1 ? -1 : 0)), height: j - i });
      roots.push({
        vector: indices(n).map((k) => (k === i - 1 || k === j - 1 ? 1 : 0)),
        height: j - i + 2 * (n - j + 1),
      });
    }
  }
  return roots;
};

export type Reading = (p: readonly number[]) => number;

export const SIGNED_PERMUTATION_READINGS: Record<string, Reading> = {
  // St001907: floor((2 exc + neg + 1) / 2), the excedances being the entries above their positions.
  BastidasHohlwegSaliolaExcedanceCount: (p) =>
    p.length === 0 ? 0 : Math.floor((2 * p.filter((a, i) => a > i + 1).length + negatives(p) + 1) / 2),
  // St001862: FindStat's three sums over index pairs.
  SignedCrossingCount: (p) => {
    const n = p.length;
    let total = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < j; i++) if (j + 1 <= p[i]! && p[i]! < p[j]!) total++;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (j + 1 <= -p[i]! && -p[i]! < p[j]!) total++;
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) if (j + 1 > p[i]! && p[i]! > p[j]!) total++;
    return total;
  },
  // St001865: the pairs -n <= i < j <= n, i, j != 0, meeting the first of FindStat's four cases that applies.
  SignedSymmetricAlignmentCount: (p) => {
    let total = 0;
    for (const j of signedPoints(p.length))
      for (const i of signedPoints(p.length).filter((k) => k < j)) {
        const [a, b] = [signedAt(p, i), signedAt(p, j)];
        if (i < j && j <= b && b < a && (j < b || j > 0)) total++;
        else if (b < a && a <= i && i < j && (a < i || i < 0)) total++;
        else if (i <= a && a < b && b <= j && (i < a || i > 0) && (b < j || j < 0)) total++;
        else if (a <= i && i < j && j <= b && (a < i || i < 0) && (j < b || j > 0)) total++;
      }
    return total;
  },
  // St001866, St001867 and St001868: FindStat's pair lists over 1 .. n.
  SignedNestingAlignmentCount: (p) => {
    let total = 0;
    for (let i = 1; i <= p.length; i++)
      for (let j = 1; j <= p.length; j++) {
        const [a, b] = [signedAt(p, i), signedAt(p, j)];
        if ((-i < -j && -j < -b && -b < -a) || (-i < j && j <= b && b < -a) || (i < j && j <= b && b < a)) total++;
      }
    return total;
  },
  SignedEastNorthAlignmentCount: (p) => {
    let total = 0;
    for (let i = 1; i <= p.length; i++)
      for (let j = 1; j <= p.length; j++) {
        const [a, b] = [signedAt(p, i), signedAt(p, j)];
        if ((-i < 0 && 0 < -a && -a < b && b < j) || (i <= a && a < b && b < j)) total++;
      }
    return total;
  },
  SignedNorthEastAlignmentCount: (p) => {
    let total = 0;
    for (let i = 1; i <= p.length; i++)
      for (let j = 1; j <= p.length; j++) if (signedAt(p, i) < i && i < j && j <= signedAt(p, j)) total++;
    return total;
  },
  // St001882: FindStat's triples -n <= i < j < k <= n with 1 <= j.
  TypeBPatternTwoThreeOneCount: (p) => {
    const n = p.length;
    let total = 0;
    for (let i = -n; i <= n; i++)
      for (let j = Math.max(1, i + 1); j <= n; j++)
        for (let k = Math.max(1, j + 1); k <= n; k++) {
          if (i === 0 || j === 0 || k === 0) continue;
          const [a, b, c] = [signedAt(p, i), signedAt(p, j), signedAt(p, k)];
          if (b > a && a === (c === -1 ? 1 : c + 1)) total++;
        }
    return total;
  },
  // St001895: the blocks with an odd number of signs.
  OddSignBlockCount: oddSignBlocks,
  // St001894: the excedance heights, the negative entries' absolute values and half the odd blocks less the signs.
  SignedPermutationDepth: (p) =>
    p.reduce((total, a, i) => total + (a > i + 1 ? a - (i + 1) : 0) + (a < 0 ? -a : 0), 0) +
    (oddSignBlocks(p) - negatives(p)) / 2,
  // St001927 and St001926: the strictly positive values of the walk, and the last place of its maximum, the start included.
  SparreAndersenPositiveCount: (p) => andersenWalk(p).filter((x) => x > 0).length,
  SparreAndersenMaximumPosition: (p) => {
    const walk = [0, ...andersenWalk(p)];
    return walk.lastIndexOf(Math.max(...walk));
  },
  // St001889: n less the generators in a reduced word.
  SignedConnectivitySetSize: (p) => p.length - generatorsUsed(p).size,
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
  // St001852: the conjugates q p q^-1 over every signed permutation q, counted.
  SignedConjugacyClassSize: (p) => {
    const n = p.length;
    const conjugates = new Set<string>();
    for (const q of signedPermutationsOf(n)) {
      const inverseOfQ = inverse(q);
      conjugates.add(composeSigned(q, composeSigned(p, inverseOfQ)).join(","));
    }
    return conjugates.size;
  },
  // St001848: the heights of the positive roots a with w^-1(a) negative, w^-1 sending the coordinate vector v to the vector u with u_k = sign(p(k)) v_|p(k)|.
  AtomicLength: (p) =>
    positiveRoots(p.length)
      .filter(({ vector }) => {
        const image = p.map((a) => Math.sign(a) * vector[Math.abs(a) - 1]!);
        return image.find((c) => c !== 0)! < 0;
      })
      .reduce((total, { height }) => total + height, 0),
  // St001861: the reflections t with p t one shorter, in the Coxeter length found by search.
  BruhatLowerCoverCount: (p) =>
    p.length === 0 ? 0 : timesReflections(p).filter((q) => coxeterLength(q) === coxeterLength(p) - 1).length,
  // St001858: the reflections t with p t one longer in the reflection length found by search.
  AbsoluteOrderCoverCount: (p) =>
    p.length === 0 ? 0 : timesReflections(p).filter((q) => reflectionLength(q) === reflectionLength(p) + 1).length,
  // The two statistics of permutations that read a value against its position, on signed words.
  Excedances: (p) => p.filter((a, i) => a > i + 1).length,
  WeakExcedances: (p) => p.filter((a, i) => a >= i + 1).length,
};
