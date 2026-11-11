// Independent readings of the integer-partition statistics adopted from FindStat, written
// against the Young diagram and the multiset of parts rather than against the expressions.
//
// A partition is its parts in weakly decreasing order.

export type Partition = readonly number[];

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);
const product = (a: readonly number[]): number => a.reduce((x, y) => x * y, 1);
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
const largestEven = (l: Partition): number => Math.max(0, ...l.filter((p) => p % 2 === 0));

/** Column lengths: the conjugate partition. */
const conjugate = (l: Partition): number[] =>
  Array.from({ length: l[0] ?? 0 }, (_, k) => l.filter((p) => p >= k + 1).length);

/** The sums of the sub-multisets of the parts, the empty one excluded. */
const subsetSums = (l: Partition): Set<number> => {
  let sums = new Set([0]);
  for (const p of l) sums = new Set([...sums, ...[...sums].map((s) => s + p)]);
  sums.delete(0);
  return sums;
};

/** Arm and leg of every cell. */
const cells = (l: Partition): { arm: number; leg: number }[] => {
  const c = conjugate(l);
  return l.flatMap((part, i) => Array.from({ length: part }, (_, k) => ({ arm: part - k - 1, leg: c[k]! - i - 1 })));
};

const binomial = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let j = 1; j <= k; j++) r = (r * (n - k + j)) / j;
  return r;
};
/** Parts to a permutation of 1..n with those cycle lengths: p[i] is the image of i. */
const permutationOfCycleType = (l: Partition): number[] => {
  const p: number[] = [];
  let start = 0;
  for (const length of l) {
    for (let k = 0; k < length; k++) p[start + k] = start + ((k + 1) % length);
    start += length;
  }
  return p;
};
/** The subsets of 0..n-1 of the given size (any size when omitted), as bitmasks. */
const subsetMasks = (n: number, size?: number): number[] => {
  const out: number[] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    let bits = 0;
    for (let b = 0; b < n; b++) bits += (mask >> b) & 1;
    if (size === undefined || bits === size) out.push(mask);
  }
  return out;
};
const invariantSubsets = (l: Partition, size?: number): number => {
  const p = permutationOfCycleType(l);
  const n = p.length;
  return subsetMasks(n, size).filter((mask) => p.every((image, i) => ((mask >> i) & 1) === ((mask >> image) & 1)))
    .length;
};
/** Subset-sum differences: |sum(S) - sum(rest)| over every split of the parts. */
const splitDifferences = (l: Partition): number[] => {
  const n = sum(l);
  return subsetMasks(l.length).map((mask) => Math.abs(n - 2 * sum(l.filter((_, i) => (mask >> i) & 1))));
};
/** Partitions mu with l[i] >= mu[i] >= l[i+1] (the part after the last is 0), counted by walking the choices. */
const interlacing = (l: Partition, i = 0): number => {
  if (i === l.length) return 1;
  let total = 0;
  for (let m = l[i + 1] ?? 0; m <= l[i]!; m++) total += interlacing(l, i + 1);
  return total;
};
/** The number of ways to deal the points 1..n into blocks of these sizes, in order. */
const orderedBlocks = (l: Partition): number => {
  let left = sum(l);
  let ways = 1;
  for (const part of l) {
    ways *= binomial(left, part);
    left -= part;
  }
  return ways;
};
const multiplicities = (l: Partition): number[] => [...new Set(l)].map((part) => l.filter((q) => q === part).length);
/** e_m at k ones: the coefficient of t^m in (1 + t)^k, multiplying the polynomial in one factor at a time. */
const elementaryAtOnes = (k: number, m: number): number => {
  let poly = [1, ...Array<number>(m).fill(0)];
  for (let v = 0; v < k; v++) poly = poly.map((c, d) => c + (poly[d - 1] ?? 0));
  return poly[m]!;
};
// ── Fourth round ─────────────────────────────────────────────────────────────────────────

const bigFactorial = (n: number): bigint => (n <= 1 ? 1n : BigInt(n) * bigFactorial(n - 1));
const bigProduct = (a: readonly bigint[]): bigint => a.reduce((x, y) => x * y, 1n);

/** The number of semistandard tableaux of the shape with entries at most k: Weyl's dimension formula for GL_k, the shape padded with zeros. */
const weylDimension = (l: Partition, k: number): number => {
  if (l.length > k) return 0;
  const w = [...l, ...Array<number>(k - l.length).fill(0)];
  let top = 1n;
  let bottom = 1n;
  for (let i = 0; i < k; i++)
    for (let j = i + 1; j < k; j++) {
      top *= BigInt(w[i]! - w[j]! + j - i);
      bottom *= BigInt(j - i);
    }
  return Number(top / bottom);
};
/** The number of standard tableaux, by removing a corner in every way: the sum over the shapes one cell smaller. */
const standardMemo = new Map<string, number>();
const standardTableaux = (l: Partition): number => {
  if (l.length === 0) return 1;
  const key = l.join(",");
  const known = standardMemo.get(key);
  if (known !== undefined) return known;
  let total = 0;
  for (let i = 0; i < l.length; i++) {
    if (l[i]! === (l[i + 1] ?? 0)) continue;
    total += standardTableaux(l.map((p, r) => (r === i ? p - 1 : p)).filter((p) => p > 0));
  }
  standardMemo.set(key, total);
  return total;
};
/** Standard tableaux of the shifted shape of a strict partition, by removing a corner in every way; 0 unless the parts are distinct. */
const shiftedMemo = new Map<string, number>();
const shiftedStandardTableaux = (l: Partition): number => {
  if (l.some((p, i) => i > 0 && p === l[i - 1])) return 0;
  if (l.length === 0) return 1;
  const key = l.join(",");
  const known = shiftedMemo.get(key);
  if (known !== undefined) return known;
  let total = 0;
  for (let i = 0; i < l.length; i++) {
    if (i + 1 < l.length && l[i]! - 1 === l[i + 1]!) continue;
    total += shiftedStandardTableaux(l.map((p, r) => (r === i ? p - 1 : p)).filter((p) => p > 0));
  }
  shiftedMemo.set(key, total);
  return total;
};
/** Over every standard tableau: the count, the sum of the major indices and the sum of their squares. Entries are placed one at a time; i is a descent when i + 1 lands in a lower row. */
interface Moments {
  count: bigint;
  sum: bigint;
  squares: bigint;
}
const majorIndexMemo = new Map<string, Moments>();
const majorIndexMoments = (l: Partition): Moments => {
  const key = l.join(",");
  const known = majorIndexMemo.get(key);
  if (known) return known;
  const moments: Moments = { count: 0n, sum: 0n, squares: 0n };
  const n = sum(l);
  const shape = l.map(() => 0);
  const walk = (placed: number, lastRow: number, major: number): void => {
    if (placed === n) {
      moments.count += 1n;
      moments.sum += BigInt(major);
      moments.squares += BigInt(major * major);
      return;
    }
    for (let row = 0; row < l.length; row++) {
      if (shape[row]! >= l[row]! || (row > 0 && shape[row]! >= shape[row - 1]!)) continue;
      shape[row]!++;
      walk(placed + 1, row, major + (placed > 0 && row > lastRow ? placed : 0));
      shape[row]!--;
    }
  };
  walk(0, 0, 0);
  majorIndexMemo.set(key, moments);
  return moments;
};
/** The degree of the polynomial prod over pairs i < j of (k (l_j - l_i) + j - i)/(j - i), multiplied out in k. */
const stretchedDegree = (l: Partition): number => {
  let poly = [1];
  for (let j = 0; j < l.length; j++)
    for (let i = 0; i < j; i++) {
      const [slope, constant] = [l[j]! - l[i]!, j - i];
      const next = Array<number>(poly.length + 1).fill(0);
      poly.forEach((c, d) => {
        next[d]! += c * constant;
        next[d + 1]! += c * slope;
      });
      poly = next;
    }
  while (poly.length > 1 && poly.at(-1) === 0) poly.pop();
  return poly.length - 1;
};
/** The border-strip decomposition, as FindStat steps it: drop the first part and take one off each of the rest. */
const borderStrips = (l: Partition): Partition[] => {
  const strips: Partition[] = [];
  for (
    let current = l;
    current.length > 0;
    current = current
      .slice(1)
      .filter((p) => p > 1)
      .map((p) => p - 1)
  )
    strips.push(current);
  return strips;
};
/** The k-rim hooks removed to reach the k-core: slide a bead of the abacus back k places while that place is free. */
const rimHooksToCore = (l: Partition, k: number): number => {
  const beads = new Set(l.map((p, i) => p + l.length - 1 - i));
  let moved = 0;
  for (let again = true; again;) {
    again = false;
    for (const bead of [...beads].toSorted((a, b) => a - b)) {
      if (bead >= k && !beads.has(bead - k)) {
        beads.delete(bead);
        beads.add(bead - k);
        moved++;
        again = true;
      }
    }
  }
  return moved;
};
/** The number of partitions of n with parts at most m. */
const partitionsMemo = new Map<string, number>();
const partitionCount = (n: number, m = n): number => {
  if (n === 0) return 1;
  if (m === 0) return 0;
  const key = `${n},${m}`;
  const known = partitionsMemo.get(key);
  if (known !== undefined) return known;
  const total = partitionCount(n, m - 1) + (m <= n ? partitionCount(n - m, m) : 0);
  partitionsMemo.set(key, total);
  return total;
};
/** z_l: the size of the centralizer of a permutation of this cycle type. */
const centralizerOf = (l: Partition): number =>
  product(
    [...new Set(l)].map((j) => j ** l.filter((p) => p === j).length * factorial(l.filter((p) => p === j).length)),
  );
/** Compose permutations of 0..n-1 given as image arrays: first `p`, then `q`. */
const compose = (p: readonly number[], q: readonly number[]): number[] => p.map((image) => q[image]!);
/**
 * The tuples of `length` transpositions (a, b), a < b, with b weakly increasing, that connect every point and whose product is the
 * permutation of this cycle type.
 */
const transitiveMonotoneFactorizations = (l: Partition, length: number): number => {
  const n = sum(l);
  const identity = Array.from({ length: n }, (_, i) => i);
  let found = 0;
  const walk = (left: number, atLeast: number, current: number[], edges: [number, number][]): void => {
    if (left === 0) {
      if (!current.every((image, i) => image === identity[i])) return;
      const reach = new Set([0]);
      for (let again = true; again;) {
        again = false;
        for (const [a, b] of edges)
          if (reach.has(a) !== reach.has(b)) {
            reach.add(a).add(b);
            again = true;
          }
      }
      if (reach.size === n) found++;
      return;
    }
    for (let b = atLeast; b < n; b++)
      for (let a = 0; a < b; a++) {
        const swap = identity.map((i) => (i === a ? b : i === b ? a : i));
        walk(left - 1, b, compose(swap, current), [...edges, [a, b]]);
      }
  };
  walk(length, 1, permutationOfCycleType(l), []);
  return found;
};
/** Every partition contained in this one (rows weakly decreasing, each at most the shape's row), the empty one included. */
const subpartitionMemo = new Map<string, number[][]>();
const subpartitions = (l: Partition): number[][] => {
  const key = l.join(",");
  const known = subpartitionMemo.get(key);
  if (known) return known;
  const out: number[][] = [];
  const walk = (row: number, cap: number, chosen: number[]): void => {
    if (row === l.length) {
      out.push(chosen.filter((p) => p > 0));
      return;
    }
    for (let size = 0; size <= Math.min(cap, l[row]!); size++) walk(row + 1, size, [...chosen, size]);
  };
  walk(0, l[0] ?? 0, []);
  subpartitionMemo.set(key, out);
  return out;
};
/**
 * The standard tableaux of the skew shape nu / l, where nu has one more cell in every column of l and a cell in each of the
 * columns up to n: FindStat's construction. Cells are filled in any order that has the cell to the left and the one above
 * (when they are in the skew shape) filled first, counted over the sets of filled cells.
 */
const borderSkewTableaux = (l: Partition): number => {
  const n = sum(l);
  const columns = conjugate(l);
  const cellsOfSkew: [number, number][] = [];
  for (let c = 0; c < n; c++) cellsOfSkew.push([columns[c] ?? 0, c]);
  const index = new Map(cellsOfSkew.map(([r, c], i) => [`${r},${c}`, i]));
  const before = cellsOfSkew.map(
    ([r, c]) => [index.get(`${r},${c - 1}`), index.get(`${r - 1},${c}`)].filter((i) => i !== undefined) as number[],
  );
  const full = (1 << n) - 1;
  const ways = new Map<number, number>([[full, 1]]);
  const completions = (mask: number): number => {
    const known = ways.get(mask);
    if (known !== undefined) return known;
    let total = 0;
    for (let i = 0; i < n; i++)
      if (!((mask >> i) & 1) && before[i]!.every((j) => (mask >> j) & 1)) total += completions(mask | (1 << i));
    ways.set(mask, total);
    return total;
  };
  return completions(0);
};
/** Weyl's dimension formula for a symplectic group, in fundamental-weight coordinates: the product over the positive coroots c of (c . (a + 1)) over (c . 1). The partition is the highest weight in the orthogonal basis. */
const symplecticDimension = (l: Partition, coroots: readonly (readonly number[])[]): number => {
  const rank = coroots[0]!.length;
  if (l.length > rank) return 0;
  const parts = [...l, ...Array<number>(rank - l.length).fill(0)];
  const shifted = parts.map((p, i) => p - (parts[i + 1] ?? 0) + 1);
  const dot = (c: readonly number[], v: readonly number[]) => sum(c.map((x, i) => x * v[i]!));
  const ones = Array<number>(rank).fill(1);
  return Math.round(product(coroots.map((c) => dot(c, shifted))) / product(coroots.map((c) => dot(c, ones))));
};
const COROOTS_C2 = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, 2],
];
const COROOTS_C3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
  [0, 1, 1],
  [1, 1, 1],
  [0, 1, 2],
  [1, 1, 2],
  [1, 2, 2],
];
/** FindStat's formula for the transitive monotone factorizations: the monotone Hurwitz number over the size of the conjugacy class. */
const monotoneHurwitz = (l: Partition): number => {
  const [n, c] = [sum(l), l.length];
  const classSize = bigFactorial(n) / BigInt(centralizerOf(l));
  let top =
    (bigFactorial(n) / bigProduct(multiplicities(l).map((m) => bigFactorial(m)))) *
    bigProduct(l.map((p) => bigFactorial(2 * p) / (bigFactorial(p) * bigFactorial(p))));
  let bottom = 1n;
  const k = c - 3;
  if (k >= 0) for (let j = 0; j < k; j++) top *= BigInt(2 * n + 1 + j);
  else for (let j = 0; j < -k; j++) bottom *= BigInt(2 * n + k + 1 + j);
  return Number(top / bottom / classSize);
};
/** Factorizations are tried by brute force up to this size, and by FindStat's formula past it. */
const BRUTE_FORCE_SIZE = 5;
/** The transitive tuples of `length` star transpositions (0, a), those that between them touch every point, whose product is the permutation of this cycle type. */
const starFactorizations = (l: Partition, length: number): number => {
  const n = sum(l);
  const identity = Array.from({ length: n }, (_, i) => i);
  const walk = (left: number, current: number[], used: number): number => {
    if (left === 0) return used === (1 << n) - 2 && current.every((image, i) => image === identity[i]) ? 1 : 0;
    let total = 0;
    for (let a = 1; a < n; a++)
      total += walk(
        left - 1,
        compose(
          identity.map((i) => (i === 0 ? a : i === a ? 0 : i)),
          current,
        ),
        used | (1 << a),
      );
    return total;
  };
  return walk(length, permutationOfCycleType(l), 0);
};

// ── The sixth batch's helpers ─────────────────────────────────────────────────────────────

/** The determinant of an integer matrix, by fraction-free elimination (Bareiss). */
const determinant = (m: readonly (readonly number[])[]): bigint => {
  const a = m.map((row) => row.map((v) => BigInt(v)));
  const n = a.length;
  let [sign, previous] = [1n, 1n];
  for (let k = 0; k < n - 1; k++) {
    if (a[k]![k] === 0n) {
      const swap = a.findIndex((row, r) => r > k && row[k] !== 0n);
      if (swap < 0) return 0n;
      [a[k], a[swap]] = [a[swap]!, a[k]!];
      sign = -sign;
    }
    for (let i = k + 1; i < n; i++)
      for (let j = k + 1; j < n; j++) a[i]![j] = (a[i]![j]! * a[k]![k]! - a[i]![k]! * a[k]![j]!) / previous;
    previous = a[k]![k]!;
  }
  return n === 0 ? 1n : sign * a[n - 1]![n - 1]!;
};

/** The numbers of ways to place 0, 1, ... non-attacking rooks on the Ferrers board, by walking the rows with the used columns. */
const rookVector = (l: Partition): number[] => {
  const vector = new Array<number>(l.length + 1).fill(0);
  const place = (row: number, used: number, rooks: number): void => {
    if (row === l.length) {
      vector[rooks]!++;
      return;
    }
    place(row + 1, used, rooks);
    for (let c = 0; c < l[row]!; c++) if (!((used >> c) & 1)) place(row + 1, used | (1 << c), rooks + 1);
  };
  place(0, 0, 0);
  return vector;
};

/** The colorings of positions 0..n-1 with `l[c]` of color c that a permutation of the positions fixes: each of its cycles takes one color. */
const fixedColorings = (cycleLengths: readonly number[], l: Partition): number => {
  const left = [...l];
  const memo = new Map<string, number>();
  const go = (k: number): number => {
    if (k === cycleLengths.length) return left.every((m) => m === 0) ? 1 : 0;
    const key = `${k}:${left.join()}`;
    if (memo.has(key)) return memo.get(key)!;
    let ways = 0;
    for (let c = 0; c < left.length; c++)
      if (left[c]! >= cycleLengths[k]!) {
        left[c]! -= cycleLengths[k]!;
        ways += go(k + 1);
        left[c]! += cycleLengths[k]!;
      }
    memo.set(key, ways);
    return ways;
  };
  return go(0);
};
/** The cycle lengths of a permutation of 0..n-1. */
const cycleLengthsOf = (p: readonly number[]): number[] => {
  const seen = new Set<number>();
  const out: number[] = [];
  for (let s = 0; s < p.length; s++) {
    if (seen.has(s)) continue;
    let [length, at] = [0, s];
    while (!seen.has(at)) {
      seen.add(at);
      at = p[at]!;
      length++;
    }
    out.push(length);
  }
  return out;
};
/** The colorings of an n-cycle with these multiplicities up to the cyclic group, or the dihedral one, by Burnside over the group's elements. */
const cycleColoringOrbits = (l: Partition, dihedral: boolean): number => {
  const n = sum(l);
  const rotation = (r: number): number[] => Array.from({ length: n }, (_, i) => (i + r) % n);
  const reflection = (r: number): number[] => Array.from({ length: n }, (_, i) => (((r - i) % n) + n) % n);
  let total = 0;
  for (let r = 0; r < n; r++) {
    total += fixedColorings(cycleLengthsOf(rotation(r)), l);
    if (dihedral) total += fixedColorings(cycleLengthsOf(reflection(r)), l);
  }
  return total / (n * (dihedral ? 2 : 1));
};

/** The standard tableaux of the shape with major index m, as a map from m: entries placed one at a time, carrying (shape so far, row of the last entry). */
const majorIndexHistogram = (l: Partition): Map<number, number> => {
  let states = new Map<string, Map<number, number>>([[`${l.map(() => 0).join()}|0`, new Map([[0, 1]])]]);
  for (let placed = 0; placed < sum(l); placed++) {
    const next = new Map<string, Map<number, number>>();
    for (const [key, histogram] of states) {
      const [shapeKey, lastKey] = key.split("|");
      const shape = shapeKey!.split(",").map(Number);
      for (let row = 0; row < l.length; row++) {
        if (shape[row]! >= l[row]! || (row > 0 && shape[row]! >= shape[row - 1]!)) continue;
        const grown = shape.map((p, r) => (r === row ? p + 1 : p));
        const target = `${grown.join()}|${row}`;
        const into = next.get(target) ?? new Map<number, number>();
        const step = placed > 0 && row > Number(lastKey) ? placed : 0;
        for (const [m, c] of histogram) into.set(m + step, (into.get(m + step) ?? 0) + c);
        next.set(target, into);
      }
    }
    states = next;
  }
  const total = new Map<number, number>();
  for (const histogram of states.values()) for (const [m, c] of histogram) total.set(m, (total.get(m) ?? 0) + c);
  return total;
};
const tableauxWithMajorIndexRemainder = (l: Partition, remainder: number): number =>
  sum([...majorIndexHistogram(l)].filter(([m]) => m % sum(l) === remainder).map(([, c]) => c));

/** The permutations pi of the points with alpha pi alpha^-1 = pi^-1 for alpha of this cycle type, which is pi alpha pi = alpha, tried one by one. */
const permutationsInvertedByConjugation = (l: Partition): number => {
  const n = sum(l);
  const alpha = permutationOfCycleType(l);
  let found = 0;
  const walk = (pi: number[]): void => {
    if (pi.length === n) {
      if (pi.every((_, v) => pi[alpha[pi[v]!]!] === alpha[v])) found++;
      return;
    }
    for (let image = 0; image < n; image++) if (!pi.includes(image)) walk([...pi, image]);
  };
  walk([]);
  return found;
};
/** The cycle type of the square of a permutation of this cycle type: an odd cycle stays, an even one splits in two halves. */
const squareCycleType = (l: Partition): number[] =>
  l.flatMap((p) => (p % 2 === 1 ? [p] : [p / 2, p / 2])).toSorted((a, b) => b - a);
/**
 * The permutations whose square is a fixed permutation of cycle type `l`, by counting the pairs (root, square): the classes of
 * every cycle type that squares to `l`, over the size of the class of `l`.
 */
const permutationsSquaringTo = (l: Partition): number => {
  const n = sum(l);
  const target = l.join();
  const classSize = (m: Partition): bigint => bigFactorial(n) / BigInt(PARTITION_READINGS.CentralizerSize!(m));
  const roots = partitionsOf(n).filter((m) => squareCycleType(m).join() === target);
  return Number(roots.reduce((total, m) => total + classSize(m), 0n) / classSize(l));
};
/** The permutations whose square is a fixed permutation of the square's cycle type. */
const rootsOfSquare = (l: Partition): number => permutationsSquaringTo(squareCycleType(l));
/** The permutations of the points whose square is a fixed permutation of this cycle type, tried one by one. */
const squareRootsByTrial = (l: Partition): number => {
  const alpha = permutationOfCycleType(l);
  return allPermutations(sum(l)).filter((pi) => pi.every((image, v) => pi[image] === alpha[v])).length;
};
/** The standard tableaux of the shape, as rows of entries: 1 .. n placed one at a time at the end of a row that may grow. */
const standardTableauxOf = (l: Partition): number[][][] => {
  const grow = (rows: number[][], entry: number): number[][][] =>
    entry > sum(l)
      ? [rows]
      : l.flatMap((limit, r) =>
          rows[r]!.length < limit && (r === 0 || rows[r - 1]!.length > rows[r]!.length)
            ? grow(
                rows.map((row, k) => (k === r ? [...row, entry] : row)),
                entry + 1,
              )
            : [],
        );
  return grow(
    l.map(() => []),
    1,
  );
};
/** Schützenberger's evacuation: remove the corner entry, slide the hole out along the smaller neighbors, and label the cell it leaves n, then n - 1, ... */
const evacuation = (tableau: number[][]): number[][] => {
  const rows = tableau.map((row) => [...row]);
  const out = tableau.map((row) => row.map(() => 0));
  for (let label = rows.flat().length; label >= 1; label--) {
    let [r, c] = [0, 0];
    for (;;) {
      const right = rows[r]![c + 1];
      const below = rows[r + 1]?.[c];
      if (right === undefined && below === undefined) break;
      if (below === undefined || (right !== undefined && right < below)) {
        rows[r]![c] = right!;
        c++;
      } else {
        rows[r]![c] = below;
        r++;
      }
    }
    out[r]![c] = label;
    rows[r]!.pop();
  }
  return out.filter((row) => row.length > 0);
};
/** The standard domino tableaux, chains of rim dominoes from the shape down to the empty shape (or one cell, when the size is odd). */
const dominoTableaux = (l: Partition, memo = new Map<string, number>()): number => {
  if (sum(l) <= 1) return 1;
  const key = l.join();
  const known = memo.get(key);
  if (known !== undefined) return known;
  let total = 0;
  for (let r = 0; r < l.length; r++) {
    const below = l[r + 1] ?? 0;
    if (l[r]! - 2 >= below)
      total += dominoTableaux(
        l.map((p, k) => (k === r ? p - 2 : p)).filter((p) => p > 0),
        memo,
      );
    if (r + 1 < l.length && l[r] === l[r + 1] && l[r + 1]! - 1 >= (l[r + 2] ?? 0))
      total += dominoTableaux(
        l.map((p, k) => (k === r || k === r + 1 ? p - 1 : p)).filter((p) => p > 0),
        memo,
      );
  }
  memo.set(key, total);
  return total;
};

/** The cyclic permutations of 0..n-1 that commute with a permutation of the given cycle type, by trying every n-cycle. */
const commutingCycles = (l: Partition): number => {
  const n = sum(l);
  const sigma = permutationOfCycleType(l);
  let found = 0;
  const walk = (order: number[]): void => {
    if (order.length === n) {
      const tau = new Array<number>(n);
      order.forEach((v, i) => (tau[v] = order[(i + 1) % n]!));
      if (tau.every((_, v) => tau[sigma[v]!] === sigma[tau[v]!])) found++;
      return;
    }
    for (let v = 1; v < n; v++) if (!order.includes(v)) walk([...order, v]);
  };
  walk([0]);
  return found;
};
/** Words with l[c] letters c and no letter twice running, by the last letter and what is left. */
const smirnovWords = (l: Partition): number => {
  const memo = new Map<string, number>();
  const go = (left: number[], last: number): number => {
    if (left.every((m) => m === 0)) return 1;
    const key = `${left.join()}|${last}`;
    if (memo.has(key)) return memo.get(key)!;
    let ways = 0;
    for (let c = 0; c < left.length; c++)
      if (c !== last && left[c]! > 0) {
        left[c]!--;
        ways += go(left, c);
        left[c]!++;
      }
    memo.set(key, ways);
    return ways;
  };
  return go([...l], -1);
};
/** Partitions covering this one in dominance order, by the definition: strictly dominating, with nothing strictly between (the same size, parts padded with zeros). */
const dominates = (a: Partition, b: Partition): boolean => {
  let [x, y] = [0, 0];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    x += a[i] ?? 0;
    y += b[i] ?? 0;
    if (x < y) return false;
  }
  return true;
};
const upperCovers = (l: Partition): number => {
  const all = partitionsOf(sum(l));
  const above = all.filter((m) => m.join() !== l.join() && dominates(m, l));
  return above.filter((m) => !above.some((k) => k.join() !== m.join() && dominates(m, k))).length;
};

/** The partitions of n as weakly decreasing part lists. */
const partitionsOf = (n: number, cap = n): number[][] =>
  n === 0
    ? [[]]
    : Array.from({ length: Math.min(n, cap) }, (_, k) => Math.min(n, cap) - k).flatMap((part) =>
        partitionsOf(n - part, part).map((rest) => [part, ...rest]),
      );
/** One move of Bulgarian solitaire: the first column becomes a row. */
const bulgarianMove = (l: Partition): number[] =>
  [...l.map((p) => p - 1), l.length].filter((p) => p > 0).toSorted((a, b) => b - a);

/** Every permutation of 0..n-1, as arrays. */
const allPermutations = (n: number): number[][] =>
  n === 0
    ? [[]]
    : allPermutations(n - 1).flatMap((rest) =>
        Array.from({ length: n }, (_, i) => [...rest.slice(0, i), n - 1, ...rest.slice(i)]),
      );
const cubeCounts = new Map<number, Map<string, number>>();
/** How many permutations of 0..n-1 cube to each permutation, found by cubing them all. */
const cubesOfSize = (n: number): Map<string, number> => {
  let counts = cubeCounts.get(n);
  if (!counts) {
    counts = new Map();
    for (const p of allPermutations(n)) {
      const cube = p.map((_, i) => p[p[p[i]!]!]!).join();
      counts.set(cube, (counts.get(cube) ?? 0) + 1);
    }
    cubeCounts.set(n, counts);
  }
  return counts;
};
/**
 * Cube roots of a permutation of this cycle type: by cubing every permutation for small sizes, and beyond by the
 * recurrence on one cycle of length d: it is the cube of a d-cycle alone (3 not dividing d), or of a 3d-cycle with two
 * others of the same length, in 2d^2 ways.
 */
const cubeRoots = (l: Partition): number => {
  if (sum(l) <= 8) return cubesOfSize(sum(l)).get(permutationOfCycleType(l).join()) ?? 0;
  return product(
    [...new Set(l)].map((d) => {
      const roots = [1];
      for (let a = 1; a <= l.filter((p) => p === d).length; a++)
        roots[a] =
          (d % 3 === 0 ? 0 : roots[a - 1]!) + (a >= 3 ? (((a - 1) * (a - 2)) / 2) * 2 * d * d * roots[a - 3]! : 0);
      return roots[l.filter((p) => p === d).length]!;
    }),
  );
};
/** Bulgarian solitaire from a partition: the steps before the cycle and the cycle's length. */
const solitaireOrbit = (l: Partition): { preperiod: number; period: number } => {
  const seen = new Map<string, number>();
  for (let state: number[] = [...l], step = 0; ; state = bulgarianMove(state), step++) {
    const earlier = seen.get(state.join());
    if (earlier !== undefined) return { preperiod: earlier, period: step - earlier };
    seen.set(state.join(), step);
  }
};

/** The least nonnegative integer not in the set. */
const leastMissing = (values: ReadonlySet<number>): number => {
  let k = 0;
  while (values.has(k)) k++;
  return k;
};
const couplesValues: number[] = [0, 0, 0];
/** Grundy value of one part in "Couples are forever": a part above 2 splits into two parts, a position is the nim-sum of its parts. */
const couplesValue = (m: number): number => {
  for (let k = couplesValues.length; k <= m; k++)
    couplesValues[k] = leastMissing(
      new Set(Array.from({ length: k - 1 }, (_, a) => couplesValues[a + 1]! ^ couplesValues[k - a - 1]!)),
    );
  return couplesValues[m]!;
};
const rowRemovalValues = new Map<string, number>();
/** Grundy value of the game that cuts a row down to any length from the next row's up, searched move by move. */
const rowRemovalValue = (l: Partition): number => {
  const known = rowRemovalValues.get(l.join());
  if (known !== undefined) return known;
  const options = new Set<number>();
  l.forEach((part, i) => {
    for (let kept = l[i + 1] ?? 0; kept < part; kept++)
      options.add(rowRemovalValue(l.map((p, k) => (k === i ? kept : p)).filter((p) => p > 0)));
  });
  const value = leastMissing(options);
  rowRemovalValues.set(l.join(), value);
  return value;
};
/** The partitions one split away (a part into two) or one merge away (two parts into one), as sorted distinct lists. */
const distinctPartitions = (lists: number[][]): number[][] => [
  ...new Map(lists.map((m) => [m.toSorted((a, b) => b - a).join(), m.toSorted((a, b) => b - a)])).values(),
];
const splitsOf = (l: Partition): number[][] =>
  distinctPartitions(
    l.flatMap((part, i) =>
      Array.from({ length: Math.floor(part / 2) }, (_, a) => [...l.filter((_, k) => k !== i), a + 1, part - a - 1]),
    ),
  );
const mergesOf = (l: Partition): number[][] =>
  distinctPartitions(
    l.flatMap((p, i) => l.slice(i + 1).map((q, k) => [...l.filter((_, m) => m !== i && m !== i + 1 + k), p + q])),
  );
/** Every partition reached from this one by the moves. */
const reachedBy = (l: Partition, moves: (l: Partition) => number[][]): number => {
  const seen = new Set([l.join()]);
  for (let frontier: Partition[] = [l]; frontier.length > 0;) {
    const next = frontier.flatMap(moves).filter((m) => !seen.has(m.join()));
    frontier = distinctPartitions(next);
    for (const m of frontier) seen.add(m.join());
  }
  return seen.size;
};
const chainCounts = new Map<string, number>();
const splitChains = (l: Partition): number => {
  const known = chainCounts.get(l.join());
  if (known !== undefined) return known;
  const next = splitsOf(l);
  const chains = next.length === 0 ? 1 : sum(next.map(splitChains));
  chainCounts.set(l.join(), chains);
  return chains;
};

/** Hurwitz's formula (n + c - 2)! n^(c-3) prod p^p / (p-1)!, exactly: the power of n on the side it belongs. */
const hurwitzNumber = (l: Partition): number => {
  let [numerator, denominator] = [bigFactorial(sum(l) + l.length - 2), 1n];
  for (const p of l) [numerator, denominator] = [numerator * BigInt(p) ** BigInt(p), denominator * bigFactorial(p - 1)];
  if (l.length >= 3) numerator *= BigInt(sum(l)) ** BigInt(l.length - 3);
  else denominator *= BigInt(sum(l)) ** BigInt(3 - l.length);
  return Number(numerator / denominator);
};
/** The cycles of a permutation of 0..n-1 given as an image list. */
const cycleCount = (p: readonly number[]): number => {
  const seen = new Set<number>();
  let cycles = 0;
  for (let start = 0; start < p.length; start++) {
    if (seen.has(start)) continue;
    cycles++;
    for (let at = start; !seen.has(at); at = p[at]!) seen.add(at);
  }
  return cycles;
};
/**
 * Factorizations of a permutation into transpositions (a b), a < b, with b weakly decreasing as they are peeled off: each one
 * must split a cycle, since the number of transpositions is the size less the number of cycles.
 */
const monotoneFactorizations = (p: readonly number[], steps: number, bound: number): number => {
  if (steps === 0) return p.every((image, i) => image === i) ? 1 : 0;
  let total = 0;
  for (let b = 1; b < bound; b++)
    for (let a = 0; a < b; a++) {
      const swapped = p.map((image) => (image === a ? b : image === b ? a : image));
      if (cycleCount(swapped) === cycleCount(p) + 1) total += monotoneFactorizations(swapped, steps - 1, b + 1);
    }
  return total;
};
/** C(n) by C(n+1) = sum of C(i) C(n-i). */
const catalanByRecurrence = (n: number): number => {
  const c = [1];
  for (let m = 1; m <= n; m++) c[m] = sum(Array.from({ length: m }, (_, i) => c[i]! * c[m - 1 - i]!));
  return c[n]!;
};
/** The distinct sub-multisets of the parts that do not dominate their own conjugate, by choosing parts and discarding repeats. */
const nonDominatingSubmultisets = (l: Partition): number => {
  const distinct = new Set<string>();
  for (let mask = 0; mask < 1 << l.length; mask++) distinct.add(l.filter((_, i) => (mask >> i) & 1).join());
  return [...distinct].filter((key) => {
    const mu = key === "" ? [] : key.split(",").map(Number);
    return !dominates(mu, conjugate(mu));
  }).length;
};

/** The smallest descent of a standard tableau (entry i + 1 in a lower row than i), or its size when it has none. */
const firstDescent = (tableau: number[][]): number => {
  const rowOf = new Map(tableau.flatMap((row, r) => row.map((entry) => [entry, r] as const)));
  const size = rowOf.size;
  for (let i = 1; i < size; i++) if (rowOf.get(i + 1)! > rowOf.get(i)!) return i;
  return size;
};
/** The smallest ascent of a standard tableau (entry i + 1 in the same row as i or a higher one), or its size when it has none. */
const firstAscent = (tableau: number[][]): number => {
  const rowOf = new Map(tableau.flatMap((row, r) => row.map((entry) => [entry, r] as const)));
  const size = rowOf.size;
  for (let i = 1; i < size; i++) if (rowOf.get(i + 1)! <= rowOf.get(i)!) return i;
  return size;
};
/** The standard tableaux of the shape with first descent d, by walking every tableau. */
const firstDescentsByTableaux = (l: Partition): number[] => {
  const counts = Array.from({ length: sum(l) + 1 }, () => 0);
  for (const tableau of standardTableauxOf(l)) counts[firstDescent(tableau)]!++;
  return counts;
};
/**
 * The same counts by shapes: the tableaux with 1 .. d in the first row are the tableaux of the shapes left when a horizontal strip of
 * d cells leaves the shape, so they number the sum of those shapes' standard tableaux; the first descent is exactly d when d + 1 is
 * not also in the first row.
 */
const firstDescentsByStrips = (l: Partition): number[] => {
  const n = sum(l);
  const inFirstRow = Array.from({ length: n + 2 }, () => 0);
  const strip = (row: number, left: number[]): void => {
    if (row === l.length) {
      inFirstRow[n - sum(left)]! += standardTableaux(left.filter((p) => p > 0));
      return;
    }
    for (let kept = l[row + 1] ?? 0; kept <= l[row]!; kept++) strip(row + 1, [...left, kept]);
  };
  strip(0, []);
  return Array.from({ length: n + 1 }, (_, d) => (d === n ? inFirstRow[n]! : inFirstRow[d]! - inFirstRow[d + 1]!));
};
/** Standard tableaux of the shape by the parity of the first descent: walked for small shapes, by strips beyond. */
const tableauxByFirstDescentParity = (l: Partition, even: boolean): number =>
  sum((sum(l) <= 8 ? firstDescentsByTableaux(l) : firstDescentsByStrips(l)).filter((_, d) => (d % 2 === 0) === even));

/**
 * The distinct weights of the semistandard tableaux of the shape with entries up to its length, by building the tableaux one
 * entry at a time: removing the horizontal strip of the entries equal to the largest leaves a tableau of an interlacing shape.
 */
const tableauWeights = (l: Partition): number[][] => {
  const memo = new Map<string, number[][]>();
  const go = (shape: number[], entries: number): number[][] => {
    const key = `${shape.join()}|${entries}`;
    const known = memo.get(key);
    if (known) return known;
    let weights: number[][] = [];
    if (entries === 0) weights = shape.length === 0 ? [[]] : [];
    else {
      // Shapes inside `shape` with at most entries - 1 parts, each part between the next part of `shape` and its own.
      const strip = (row: number, inner: number[]): void => {
        if (row === shape.length) {
          const rest = inner.filter((p) => p > 0);
          if (rest.length < entries)
            for (const w of go(rest, entries - 1)) weights.push([...w, sum(shape) - sum(inner)]);
          return;
        }
        for (let kept = shape[row + 1] ?? 0; kept <= shape[row]!; kept++) strip(row + 1, [...inner, kept]);
      };
      strip(0, []);
    }
    memo.set(key, weights);
    return weights;
  };
  return go([...l], l.length);
};
const distinctTableauWeights = (l: Partition): number => new Set(tableauWeights(l).map((w) => w.join())).size;
/** The same count from the compositions of the size into that many parts: positive Kostka number exactly when dominated. */
const dominatedWeightCount = (l: Partition): number => {
  const compositions = (n: number, k: number): number[][] =>
    k === 0
      ? n === 0
        ? [[]]
        : []
      : Array.from({ length: n + 1 }, (_, v) => v).flatMap((v) =>
          compositions(n - v, k - 1).map((rest) => [v, ...rest]),
        );
  return compositions(sum(l), l.length).filter((w) =>
    dominates(
      l,
      w.toSorted((a, b) => b - a),
    ),
  ).length;
};

/** The most cells of the diagram with at most j in every row and every column: a maximum flow from the rows to the columns, by shortest augmenting paths. */
const cellsWithDegreesAtMost = (l: Partition, j: number): number => {
  const rows = l.length;
  const nodes = rows + (l[0] ?? 0) + 2;
  const [source, sink] = [nodes - 2, nodes - 1];
  const capacity = Array.from({ length: nodes }, () => Array.from({ length: nodes }, () => 0));
  l.forEach((part, r) => {
    capacity[source]![r] = j;
    for (let c = 0; c < part; c++) capacity[r]![rows + c] = 1;
  });
  for (let c = 0; c < (l[0] ?? 0); c++) capacity[rows + c]![sink] = j;
  let flow = 0;
  for (;;) {
    const parent = Array.from({ length: nodes }, () => -1);
    parent[source] = source;
    const queue = [source];
    for (const u of queue)
      for (let v = 0; v < nodes; v++)
        if (parent[v] === -1 && capacity[u]![v]! > 0) {
          parent[v] = u;
          queue.push(v);
        }
    if (parent[sink] === -1) return flow;
    for (let v = sink; v !== source; v = parent[v]!) {
      capacity[parent[v]!]![v]!--;
      capacity[v]![parent[v]!]!++;
    }
    flow++;
  }
};
/** The class-size partitions of the proper colorings with the fewest colours, from the flow: those dominated by the gains in the cells j colours cover. */
const coloringSchemesByFlow = (l: Partition): number => {
  const sides = Math.max(l.length, l[0] ?? 0);
  const covered = Array.from({ length: sides + 1 }, (_, j) => cellsWithDegreesAtMost(l, j));
  const profile = Array.from({ length: sides }, (_, j) => covered[j + 1]! - covered[j]!);
  return partitionsOf(sum(l)).filter((nu) => nu.length <= sides && dominates(profile, nu)).length;
};
/** The same by trying every coloring with at most that many colours: cells coloured in turn with a colour unused in their row and column, colours opened in order. */
const coloringSchemesByColorings = (l: Partition): number => {
  const sides = Math.max(l.length, l[0] ?? 0);
  const cellsList = l.flatMap((part, r) => Array.from({ length: part }, (_, c) => [r, c] as const));
  const schemes = new Set<string>();
  const colour = (index: number, classes: (readonly [number, number][])[]): void => {
    if (index === cellsList.length) {
      schemes.add(
        classes
          .map((cl) => cl.length)
          .toSorted((a, b) => b - a)
          .join(),
      );
      return;
    }
    const [r, c] = cellsList[index]!;
    for (let k = 0; k <= classes.length && k < sides; k++) {
      if (k < classes.length && classes[k]!.some(([r2, c2]) => r2 === r || c2 === c)) continue;
      colour(
        index + 1,
        k < classes.length ? classes.map((cl, i) => (i === k ? [...cl, [r, c] as const] : cl)) : [...classes, [[r, c]]],
      );
    }
  };
  colour(0, []);
  return schemes.size;
};

/** The set partitions of 0..n-1 as lists of blocks, in restricted growth order. */
const setPartitionsOf = (n: number): number[][][] => {
  const out: number[][][] = [];
  const go = (index: number, blocks: number[][]): void => {
    if (index === n) {
      out.push(blocks.map((block) => [...block]));
      return;
    }
    for (const block of blocks) {
      block.push(index);
      go(index + 1, blocks);
      block.pop();
    }
    blocks.push([index]);
    go(index + 1, blocks);
    blocks.pop();
  };
  go(0, []);
  return out;
};
/** The letter of each of the n elements when the parts are the multiplicities of the letters 0, 1, 2, ... */
const lettersOf = (l: Partition): number[] => l.flatMap((part, letter) => Array.from({ length: part }, () => letter));

/** The multiset partitions of the multiset with these multiplicities, by the set partitions of its elements that are equal as multisets of blocks. */
const multisetPartitionsByBlocks = (l: Partition): number => {
  const letters = lettersOf(l);
  const seen = new Set<string>();
  for (const blocks of setPartitionsOf(letters.length))
    seen.add(
      blocks
        .map((block) => block.map((i) => letters[i]).join(","))
        .toSorted()
        .join("|"),
    );
  return seen.size;
};
/**
 * The multiset partitions by choosing the blocks one at a time in decreasing order, each a nonzero vector of letter counts at most the one
 * before in the lexicographic order and within what is left.
 */
const multisetPartitionsByVectors = (l: Partition): number => {
  const memo = new Map<string, number>();
  const go = (rest: number[], limit: number[] | undefined): number => {
    if (rest.every((r) => r === 0)) return 1;
    const key = `${rest.join()}|${limit?.join() ?? ""}`;
    const known = memo.get(key);
    if (known !== undefined) return known;
    let total = 0;
    const choose = (index: number, block: number[]): void => {
      if (index === rest.length) {
        if (block.every((b) => b === 0)) return;
        if (limit !== undefined) {
          for (let i = 0; i < block.length; i++) {
            if (block[i]! < limit[i]!) break;
            if (block[i]! > limit[i]!) return;
          }
        }
        total += go(
          rest.map((r, i) => r - block[i]!),
          block,
        );
        return;
      }
      for (let take = 0; take <= rest[index]!; take++) choose(index + 1, [...block, take]);
    };
    choose(0, []);
    memo.set(key, total);
    return total;
  };
  return go([...l], undefined);
};

/** The class sizes times the statistic, over every choice of a cycle type for each color of a Young subgroup: its Burnside average over the group. */
const youngSubgroupAverage = (l: Partition, fixed: (cycleLengths: number[]) => number): number => {
  const order = product(l.map((part) => bigFactorial(part)).map(Number));
  let total = 0n;
  const go = (index: number, lengths: number[], classSize: bigint): void => {
    if (index === l.length) {
      total += classSize * BigInt(fixed(lengths));
      return;
    }
    for (const type of partitionsOf(l[index]!))
      go(index + 1, [...lengths, ...type], classSize * (bigFactorial(l[index]!) / BigInt(centralizerOf(type))));
  };
  go(0, [], 1n);
  return Number(total / BigInt(order));
};
/** The multisets of cycles on colored points, up to the points of one color changing places: the orbits of the Young subgroup on the permutations by conjugation, each fixed by its centralizer. */
const cycleMultisetsByBurnside = (l: Partition): number => youngSubgroupAverage(l, centralizerOf);
/** The same orbits found by conjugating every permutation by every element of the subgroup, for small sizes. */
const cycleMultisetsByOrbits = (l: Partition): number => {
  const n = sum(l);
  const letters = lettersOf(l);
  // The elements of the Young subgroup: the permutations that keep each point's letter.
  const subgroup = allPermutations(n).filter((g) => g.every((image, i) => letters[image] === letters[i]));
  const seen = new Set<string>();
  for (const pi of allPermutations(n)) {
    let canonical: string | undefined;
    for (const g of subgroup) {
      // g pi g^-1: the point g(i) goes to g(pi(i)).
      const conjugated = Array.from({ length: n }, () => 0);
      for (let i = 0; i < n; i++) conjugated[g[i]!] = g[pi[i]!]!;
      const text = conjugated.join();
      if (canonical === undefined || text < canonical) canonical = text;
    }
    seen.add(canonical!);
  }
  return seen.size;
};
/** The endofunctions on colored points up to the points of one color changing places, by Burnside: a map commuting with a permutation sends each cycle to a cycle whose length divides its own, in as many ways as it has points. */
const endofunctionsByBurnside = (l: Partition): number =>
  youngSubgroupAverage(l, (lengths) => {
    const cycles = (e: number) => lengths.filter((d) => d === e).length;
    return product(
      lengths.map((d) =>
        Array.from({ length: d }, (_, k) => k + 1)
          .filter((e) => d % e === 0)
          .reduce((total, e) => total + e * cycles(e), 0),
      ),
    );
  });

/** A colored rooted tree: the color of its root and its subtrees, written canonically as `color(child child ...)` with the children sorted. */
interface ColoredTree {
  readonly color: number;
  readonly children: readonly ColoredTree[];
  readonly text: string;
}
const coloredTree = (color: number, children: readonly ColoredTree[]): ColoredTree => {
  const sorted = children.toSorted((a, b) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
  return { color, children: sorted, text: `${color}(${sorted.map((child) => child.text).join(" ")})` };
};
/** Every colored rooted tree whose vertices have the given color counts, up to swapping vertices of one color: all of them, by the root's color and the forest left. */
const coloredRootedTrees = (counts: readonly number[]): ColoredTree[] => {
  const treesMemo = new Map<string, ColoredTree[]>();
  const forestsMemo = new Map<string, ColoredTree[][]>();
  const trees = (c: readonly number[]): ColoredTree[] => {
    const key = c.join();
    const known = treesMemo.get(key);
    if (known) return known;
    const out = new Map<string, ColoredTree>();
    c.forEach((have, color) => {
      if (have === 0) return;
      const rest = c.map((v, i) => (i === color ? v - 1 : v));
      for (const forest of forests(rest)) {
        const tree = coloredTree(color, forest);
        out.set(tree.text, tree);
      }
    });
    const list = [...out.values()];
    treesMemo.set(key, list);
    return list;
  };
  /** The multisets of trees whose vertices make up exactly these counts: the tree holding the first remaining color, then a multiset of the rest. */
  const forests = (c: readonly number[]): ColoredTree[][] => {
    const key = c.join();
    const known = forestsMemo.get(key);
    if (known) return known;
    const first = c.findIndex((v) => v > 0);
    const out = new Map<string, ColoredTree[]>();
    if (first === -1) out.set("", []);
    else {
      const sub = (index: number, take: number[]): void => {
        if (index === c.length) {
          if (take[first] === 0) return;
          for (const tree of trees(take))
            for (const rest of forests(c.map((v, i) => v - take[i]!))) {
              const forest = [...rest, tree].toSorted((a, b) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
              out.set(forest.map((t) => t.text).join(" "), forest);
            }
          return;
        }
        for (let t = 0; t <= c[index]!; t++) sub(index + 1, [...take, t]);
      };
      sub(0, []);
    }
    const list = [...out.values()];
    forestsMemo.set(key, list);
    return list;
  };
  return trees(counts);
};
/** The free trees among them: the rooted trees that are the same tree rooted elsewhere are one. */
const coloredFreeTreeCount = (counts: readonly number[]): number => {
  const seen = new Set<string>();
  for (const tree of coloredRootedTrees(counts)) {
    // Flatten to an adjacency structure, then write the tree canonically from every vertex and keep the least.
    const colors: number[] = [];
    const adjacent: number[][] = [];
    const add = (node: ColoredTree, parent: number | undefined): number => {
      const id = colors.length;
      colors.push(node.color);
      adjacent.push([]);
      if (parent !== undefined) {
        adjacent[id]!.push(parent);
        adjacent[parent]!.push(id);
      }
      for (const child of node.children) add(child, id);
      return id;
    };
    add(tree, undefined);
    const written = (v: number, from: number): ColoredTree =>
      coloredTree(
        colors[v]!,
        adjacent[v]!.filter((w) => w !== from).map((w) => written(w, v)),
      );
    seen.add(colors.map((_, root) => written(root, -1).text).toSorted()[0]!);
  }
  return seen.size;
};
/** The symmetric matrices of nonnegative integers with these row sums, found as the shapes of the tableaux of this content (Pieri: each letter adds a horizontal strip), summed. */
const tableauxOfContent = (l: Partition): number => {
  let shapes = new Map<string, number>([["", 1]]);
  for (const multiplicity of l) {
    const next = new Map<string, number>();
    for (const [text, ways] of shapes) {
      const shape = text === "" ? [] : text.split(",").map(Number);
      // Add a horizontal strip of `multiplicity` cells: row r grows to at most the old row r - 1 (any length in the first row).
      const grow = (row: number, left: number, built: number[]): void => {
        if (row === shape.length + 1) {
          if (left === 0) {
            const key = built.filter((p) => p > 0).join();
            next.set(key, (next.get(key) ?? 0) + ways);
          }
          return;
        }
        const old = shape[row] ?? 0;
        const room = row === 0 ? left : Math.min(left, shape[row - 1]! - old);
        for (let add = 0; add <= room; add++) grow(row + 1, left - add, [...built, old + add]);
      };
      grow(0, multiplicity, []);
    }
    shapes = next;
  }
  return [...shapes.values()].reduce((a, b) => a + b, 0);
};
/** The set partitions of 0..n-1 that the permutation maps to themselves, by trying each. */
const invariantSetPartitionsByTrial = (l: Partition): number => {
  const alpha = permutationOfCycleType(l);
  return setPartitionsOf(sum(l)).filter((blocks) => {
    const label = Array.from({ length: alpha.length }, () => 0);
    blocks.forEach((block, b) => block.forEach((i) => (label[i] = b)));
    // Each block must go into a single block.
    return blocks.every((block) => new Set(block.map((i) => label[alpha[i]!])).size === 1);
  }).length;
};
/** The words with these letter multiplicities, one letter at a time, that never read three increasing letters in a row. */
const wordsAvoidingIncreasingTriple = (l: Partition): number => {
  const memo = new Map<string, number>();
  const go = (left: number[], last: number, second: number): number => {
    if (left.every((v) => v === 0)) return 1;
    const key = `${left.join()}|${last}|${second}`;
    const known = memo.get(key);
    if (known !== undefined) return known;
    let total = 0;
    left.forEach((have, letter) => {
      if (have === 0) return;
      if (second !== -1 && second < last && last < letter) return;
      total += go(
        left.map((v, i) => (i === letter ? v - 1 : v)),
        letter,
        last,
      );
    });
    memo.set(key, total);
    return total;
  };
  return go([...l], -1, -1);
};
/**
 * The matrices with the parts as row sums and no empty column whose column sums weakly decrease, by choosing the columns one at a time:
 * each is a vector of entries at most the row sums left (and at most 1 when `zeroOne`), nonzero, its sum at most the column before.
 */
const matricesWithDecreasingColumns = (l: Partition, zeroOne: boolean): number => {
  const memo = new Map<string, number>();
  const go = (left: number[], limit: number): number => {
    if (left.every((v) => v === 0)) return 1;
    const key = `${left.join()}|${limit}`;
    const known = memo.get(key);
    if (known !== undefined) return known;
    let total = 0;
    const column = (row: number, taken: number[], size: number): void => {
      if (size > limit) return;
      if (row === left.length) {
        if (size > 0)
          total += go(
            left.map((v, i) => v - taken[i]!),
            size,
          );
        return;
      }
      for (let entry = 0; entry <= (zeroOne ? Math.min(1, left[row]!) : left[row]!); entry++)
        column(row + 1, [...taken, entry], size + entry);
    };
    column(0, [], 0);
    memo.set(key, total);
    return total;
  };
  return go([...l], sum(l));
};
/** The ordered lists of blocks of the parts, told apart by position, whose sums weakly decrease: a set partition has each order of blocks of equal sum. */
const orderedSetPartitionsWithDecreasingSums = (l: Partition): number =>
  setPartitionsOf(l.length).reduce((total, blocks) => {
    const sums = blocks.map((block) => sum(block.map((i) => l[i]!)));
    return total + product([...new Set(sums)].map((s) => factorial(sums.filter((t) => t === s).length)));
  }, 0);

/** Every rooted tree on the vertices 0..n-1, as the parent of each vertex (undefined for the root): each Prüfer sequence gives a tree, rooted at each vertex. */
const rootedLabeledTrees = (n: number): (number | undefined)[][] => {
  if (n === 0) return [];
  if (n === 1) return [[undefined]];
  const out: (number | undefined)[][] = [];
  const sequences = (length: number): number[][] =>
    length === 0 ? [[]] : sequences(length - 1).flatMap((rest) => Array.from({ length: n }, (_, v) => [...rest, v]));
  for (const sequence of sequences(n - 2)) {
    const degree = Array.from({ length: n }, () => 1);
    for (const v of sequence) degree[v]!++;
    const adjacent: number[][] = Array.from({ length: n }, () => []);
    const link = (a: number, b: number): void => {
      adjacent[a]!.push(b);
      adjacent[b]!.push(a);
    };
    for (const v of sequence) {
      const leaf = degree.findIndex((d) => d === 1);
      link(leaf, v);
      degree[leaf] = 0;
      degree[v]!--;
    }
    const [a, b] = degree.flatMap((d, v) => (d === 1 ? [v] : []));
    link(a!, b!);
    for (let root = 0; root < n; root++) {
      const parent: (number | undefined)[] = Array.from({ length: n }, () => undefined);
      const seen = new Set([root]);
      const stack = [root];
      while (stack.length > 0) {
        const u = stack.pop()!;
        for (const v of adjacent[u]!)
          if (!seen.has(v)) {
            seen.add(v);
            parent[v] = u;
            stack.push(v);
          }
      }
      out.push(parent);
    }
  }
  return out;
};
/** The vertices of a rooted tree with no children. */
const leavesOf = (parent: readonly (number | undefined)[]): boolean[] => {
  const hasChild = parent.map(() => false);
  for (const p of parent) if (p !== undefined) hasChild[p] = true;
  return hasChild.map((c) => !c);
};
/** The rooted labeled trees on the colored vertices (colors in blocks, as many of each as the part) with no leaf of its parent's color. */
const rootedTreesWithNoLeafOfParentsColor = (l: Partition): number => {
  const color = lettersOf(l);
  return rootedLabeledTrees(color.length).filter((parent) => {
    const leaf = leavesOf(parent);
    return parent.every((p, v) => p === undefined || !leaf[v] || color[p] !== color[v]);
  }).length;
};
/** The increasing trees on 1..n (each vertex's parent is smaller), colored in blocks, with no leaf of its parent's color. */
const increasingTreesWithNoLeafOfParentsColor = (l: Partition): number => {
  const color = lettersOf(l);
  const n = color.length;
  if (n === 0) return 0;
  let count = 0;
  const parent: number[] = [];
  const go = (v: number): void => {
    if (v === n) {
      const leaf = leavesOf([undefined, ...parent]);
      if (parent.every((p, i) => !leaf[i + 1] || color[p] !== color[i + 1])) count++;
      return;
    }
    for (let p = 0; p < v; p++) {
      parent.push(p);
      go(v + 1);
      parent.pop();
    }
  };
  go(1);
  return count;
};
/**
 * The trees whose leaves are the colored vertices and whose internal vertices have children without order, at least two (exactly two when
 * `binary`), in which no internal vertex has only leaves of one color as its children (twin leaves). Over the subsets of leaves, a tree is a
 * set partition of the leaves into at least two subtrees; the one into single leaves is a star, which is bad when the leaves are of one color.
 */
const leafLabeledTreesWithNoTwinLeavesOfOneColor = (l: Partition, binary: boolean): number => {
  const color = lettersOf(l);
  const n = color.length;
  if (n === 0) return 0;
  const trees = new Map<number, number>();
  const single = (set: number): boolean => (set & (set - 1)) === 0;
  const oneColor = (set: number): boolean =>
    color.every((c, i) => !(set & (1 << i)) || c === color[Math.log2(set & -set)]);
  const treesOn = (set: number): number => {
    const known = trees.get(set);
    if (known !== undefined) return known;
    let total = 0;
    if (single(set)) total = 1;
    else {
      const low = set & -set;
      if (binary) {
        // An unordered split holds the lowest leaf in its first part.
        for (let first = (set - 1) & set; first > 0; first = (first - 1) & set) {
          if ((first & low) === 0) continue;
          const second = set & ~first;
          if (single(first) && single(second) && color[Math.log2(first)] === color[Math.log2(second)]) continue;
          total += treesOn(first) * treesOn(second);
        }
      } else {
        // The ways to split the rest into any blocks, each a subtree.
        const partitionsInto = (rest: number): number => {
          if (rest === 0) return 1;
          const lowest = rest & -rest;
          let ways = 0;
          for (let block = rest; block > 0; block = (block - 1) & rest)
            if (block & lowest) ways += treesOn(block) * partitionsInto(rest & ~block);
          return ways;
        };
        for (let block = (set - 1) & set; block > 0; block = (block - 1) & set)
          if (block & low) total += treesOn(block) * partitionsInto(set & ~block);
        // The star of single leaves is among them, bad when its leaves are all of one color.
        if (oneColor(set)) total--;
      }
    }
    trees.set(set, total);
    return total;
  };
  return treesOn((1 << n) - 1);
};

/** The standard tableaux of the shape in which no row holds i and i + 1, by walking every tableau. */
const tableauxWithoutRowRunsByWalking = (l: Partition): number =>
  standardTableauxOf(l).filter((tableau) => !tableau.some((row) => row.some((entry, k) => row[k + 1] === entry + 1)))
    .length;
const lehmerDistributions = new Map<number, Map<string, number>>();
/** The Lehmer codes of permutations (entry i at most n - i) whose values have the parts, sorted, as the multiplicities of the values taken: every code of the size tried once. */
const lehmerCodesWithMultiplicities = (l: Partition): number => {
  const n = sum(l);
  let distribution = lehmerDistributions.get(n);
  if (!distribution) {
    distribution = new Map();
    const code: number[] = [];
    const go = (i: number): void => {
      if (i === n) {
        const multiplicities = new Map<number, number>();
        for (const c of code) multiplicities.set(c, (multiplicities.get(c) ?? 0) + 1);
        const key = [...multiplicities.values()].toSorted((a, b) => b - a).join();
        distribution!.set(key, (distribution!.get(key) ?? 0) + 1);
        return;
      }
      for (let c = 0; c <= n - 1 - i; c++) {
        code.push(c);
        go(i + 1);
        code.pop();
      }
    };
    go(0);
    lehmerDistributions.set(n, distribution);
  }
  return distribution.get(l.join()) ?? 0;
};
/** FindStat's recursion for the linear extensions of Speyer's poset on a partition, verbatim: the last cell on the longest antidiagonal splits it. */
const speyerPosetLinearExtensions = (l: Partition): number => {
  if (l.length === 0) return 1;
  const cellsInOrder = l.flatMap((part, i) => Array.from({ length: part }, (_, j) => [i, j] as const));
  const longest = Math.max(...cellsInOrder.map(([i, j]) => i + j));
  const [i, j] = cellsInOrder.filter(([a, b]) => a + b === longest).at(-1)!;
  const below = l.slice(i + 1);
  const right = conjugate(conjugate(l).slice(j + 1));
  return binomial(i + j + 2, i + 1) * speyerPosetLinearExtensions(below) * speyerPosetLinearExtensions(right);
};
/** The Grundy value of a position of a game on partitions, the least value missing among those of the positions one move away. */
const grundyValue = (l: Partition, moves: (position: Partition) => Partition[], memo: Map<string, number>): number => {
  const key = l.join();
  const known = memo.get(key);
  if (known !== undefined) return known;
  const options = new Set(moves(l).map((next) => grundyValue(next, moves, memo)));
  let value = 0;
  while (options.has(value)) value++;
  memo.set(key, value);
  return value;
};
/** Chomp: choose a cell other than the first and cut it and every cell below and to its right. */
const chompMoves = (l: Partition): Partition[] =>
  l.flatMap((part, row) =>
    Array.from({ length: part }, (_, column) => column)
      .filter((column) => row !== 0 || column !== 0)
      .map((column) => [...l.slice(0, row), ...l.slice(row).map((p) => Math.min(p, column))].filter((p) => p > 0)),
  );
const chompMemo = new Map<string, number>();
/** Remove one cell, or a 2 x 2 square of cells, so that the rest is still a partition. */
const squareGameMoves = (l: Partition): Partition[] => {
  const isPartition = (p: readonly number[]): boolean => p.every((part, i) => part >= (p[i + 1] ?? 0));
  const out: Partition[] = [];
  l.forEach((_, i) => {
    const single = l.map((p, k) => (k === i ? p - 1 : p));
    if (isPartition(single)) out.push(single.filter((p) => p > 0));
    if (i + 1 < l.length && l[i] === l[i + 1] && l[i]! >= 2) {
      const square = l.map((p, k) => (k === i || k === i + 1 ? p - 2 : p));
      if (isPartition(square)) out.push(square.filter((p) => p > 0));
    }
  });
  return out;
};
const squareGameMemo = new Map<string, number>();
/** The fewest cells to remove so that what is left has an odd number of standard tableaux: the partitions inside, one removal at a time. */
const oddRestrictionDepth = (l: Partition): number => {
  let level = new Map<string, Partition>([[l.join(), l]]);
  for (let depth = 0; depth <= sum(l); depth++) {
    if ([...level.values()].some((p) => standardTableaux(p) % 2 === 1)) return depth;
    const next = new Map<string, Partition>();
    for (const p of level.values())
      p.forEach((_, i) => {
        const smaller = p.map((q, k) => (k === i ? q - 1 : q));
        if (smaller.every((q, k) => q >= (smaller[k + 1] ?? 0))) {
          const trimmed = smaller.filter((q) => q > 0);
          next.set(trimmed.join(), trimmed);
        }
      });
    level = next;
  }
  return sum(l);
};
/** The tilings of the diagram by single cells and dominoes, covering the first free cell in reading order each time. */
const dominoTilings = (l: Partition): number => {
  const memo = new Map<string, number>();
  const covered = l.map((part) => Array.from({ length: part }, () => false));
  const go = (): number => {
    const key = covered.map((row) => row.map((c) => (c ? 1 : 0)).join("")).join("/");
    const known = memo.get(key);
    if (known !== undefined) return known;
    const row = covered.findIndex((cells) => cells.some((c) => !c));
    if (row === -1) return 1;
    const column = covered[row]!.indexOf(false);
    covered[row]![column] = true;
    let total = go();
    if (column + 1 < covered[row]!.length && !covered[row]![column + 1]) {
      covered[row]![column + 1] = true;
      total += go();
      covered[row]![column + 1] = false;
    }
    if (row + 1 < covered.length && column < covered[row + 1]!.length && !covered[row + 1]![column]) {
      covered[row + 1]![column] = true;
      total += go();
      covered[row + 1]![column] = false;
    }
    covered[row]![column] = false;
    memo.set(key, total);
    return total;
  };
  return go();
};

/** The endofunctions on colored points up to the points of one color changing places, by conjugating every function by every element of the subgroup. */
const endofunctionsByOrbits = (l: Partition): number => {
  const n = sum(l);
  const letters = lettersOf(l);
  const subgroup = allPermutations(n).filter((g) => g.every((image, i) => letters[image] === letters[i]));
  const seen = new Set<string>();
  const functions = (length: number): number[][] =>
    length === 0 ? [[]] : functions(length - 1).flatMap((rest) => Array.from({ length: n }, (_, v) => [...rest, v]));
  for (const f of functions(n)) {
    let canonical: string | undefined;
    for (const g of subgroup) {
      const conjugated = Array.from({ length: n }, () => 0);
      for (let i = 0; i < n; i++) conjugated[g[i]!] = g[f[i]!]!;
      const text = conjugated.join();
      if (canonical === undefined || text < canonical) canonical = text;
    }
    seen.add(canonical!);
  }
  return seen.size;
};

export const PARTITION_READINGS: Record<string, (l: Partition) => number> = {
  PartRange: (l) => (l.length === 0 ? 0 : l[0]! - l.at(-1)!),
  ContainingRectangleShortSide: (l) => (l.length === 0 ? 0 : Math.min(l[0]!, l.length)),
  MaximalRectangleHalfPerimeter: (l) => Math.max(0, ...l.map((p, i) => p + i + 1)),
  LargestShiftedPart: (l) => Math.max(0, ...l.map((p, i) => p + i)),
  RemovableHorizontalDominoes: (l) => l.filter((p, i) => p - 2 >= (l[i + 1] ?? 0)).length,
  CellsOutsideFirstRow: (l) => (l.length === 0 ? 0 : sum(l) - l[0]!),
  CellsOutsideFirstHook: (l) => (l.length === 0 ? 0 : sum(l) - (l[0]! + l.length - 1)),
  RowCellPairs: (l) => sum(l.map((p) => (p * (p - 1)) / 2)),
  CellsWithZeroLegAndOddArm: (l) => cells(l).filter((cell) => cell.leg === 0 && cell.arm % 2 === 1).length,
  // Corners counted from the bottom row, which is position 1.
  CornerMajorIndex: (l) => sum(l.map((p, i) => (p > (l[i + 1] ?? 0) ? l.length - i + p - 1 : 0))),
  PartProduct: (l) => product(l),
  PartSquareSum: (l) => sum(l.map((p) => p * p)),
  PartFactorialProduct: (l) => product(l.map(factorial)),
  MultiplicityFactorialProduct: (l) =>
    product([...new Set(l)].map((part) => factorial(l.filter((p) => p === part).length))),
  SumOfEvenParts: (l) => sum(l.filter((p) => p % 2 === 0)),
  SumOfOddParts: (l) => sum(l.filter((p) => p % 2 === 1)),
  SumOfPartsAtLeastTwo: (l) => sum(l.filter((p) => p >= 2)),
  GreatestCommonDivisorOfParts: (l) => l.reduce(gcd, 0),
  LeastCommonMultipleOfParts: (l) => l.reduce(lcm, 1),
  PairwiseGreatestCommonDivisorSum: (l) => sum(l.flatMap((p, i) => l.slice(i + 1).map((q) => gcd(p, q)))),
  LargestEvenPart: largestEven,
  EvenOddCrank: (l) => largestEven(l) - l.filter((p) => p % 2 === 1).length,
  OddPartsBelowLargestEvenPart: (l) => l.filter((p) => p % 2 === 1 && p < largestEven(l)).length,
  DistinctEvenParts: (l) => new Set(l.filter((p) => p % 2 === 0)).size,
  // Row 0 counts +, row 1 counts -, and so on: a checkerboard filling summed over the diagram.
  BerkovichGarvanRank: (l) => sum(l.map((p, i) => (i % 2 === 0 ? 1 : -1) * (p % 2))),
  PartsEqualToNextPart: (l) => l.length - new Set(l).size,
  LargestMissingPart: (l) => {
    if (l.length === 0) return 0;
    let k = l[0]! - 1;
    while (l.includes(k)) k--;
    return k;
  },
  SmallestNonRepeatedInteger: (l) => {
    let k = 1;
    while (l.filter((p) => p === k).length >= 2) k++;
    return k;
  },
  DistinctSubsetSums: (l) => subsetSums(l).size,
  DistinctEvenSubsetSums: (l) => [...subsetSums(l)].filter((s) => s % 2 === 0).length,
  DistinctOddSubsetSums: (l) => [...subsetSums(l)].filter((s) => s % 2 === 1).length,
  PartsNotCongruentToTwoModuloThree: (l) => l.filter((p) => p % 3 !== 2).length,
  PartsNotCongruentToZeroModuloThree: (l) => l.filter((p) => p % 3 !== 0).length,
  PartsNotCongruentToOneModuloThree: (l) => l.filter((p) => p % 3 !== 1).length,
  PartsEqualTwo: (l) => l.filter((p) => p === 2).length,
  HalfSumOfEvenParts: (l) => sum(l.filter((p) => p % 2 === 0)) / 2,
  HalfLargestEvenPart: (l) => largestEven(l) / 2,
  DistinctOddPartsBelowLargestEvenPart: (l) => new Set(l.filter((p) => p % 2 === 1 && p < largestEven(l))).size,
  PartSquareProduct: (l) => product(l.map((p) => p * p)),
  // Choose the parts one after another from what is left of the size.
  MultinomialOfParts: (l) => orderedBlocks(l),
  ExponensConsonantiae: (l) => (l.length === 0 ? 0 : l.reduce(lcm, 1) / l.reduce(gcd, 0)),
  CyclicSievingPolynomialDegree: (l) => (l.length === 0 ? 0 : l.reduce(lcm, 1) - l.reduce(lcm, 1) / l[0]!),
  GiniIndex: (l) => binomial(sum(l) + 1, 2) - sum(conjugate(l).map((c) => binomial(c + 1, 2))),
  InterlacingPartitionCount: (l) => interlacing(l),
  MinimalSubpartitionSizeDifference: (l) => Math.min(...splitDifferences(l)),
  // `+ 0` turns a -0 from a negative factor times 0 into 0.
  AlladiWeight: (l) => (l.length === 0 ? 0 : l.at(-1)! * product(l.slice(0, -1).map((p, i) => p - l[i + 1]! - 1))) + 0,
  SecondAlladiWeight: (l) => {
    if (l.length === 0) return 0;
    const delta = (p: number) => (p % 2 === 0 ? 1 : 0);
    const last = l.at(-1)!;
    return (
      ((last + 1 - delta(last)) / 2) *
        product(l.slice(0, -1).map((p, i) => (p - l[i + 1]! - delta(p) - delta(l[i + 1]!)) / 2)) +
      0
    );
  },
  // z = the product over part sizes j of j^m_j m_j!.
  CentralizerSize: (l) =>
    product(
      [...new Set(l)].map((j) => j ** l.filter((p) => p === j).length * factorial(l.filter((p) => p === j).length)),
    ),
  // n! over z, the size of the conjugacy class of the cycle type.
  ConjugacyClassSize: (l) => factorial(sum(l)) / PARTITION_READINGS.CentralizerSize!(l),
  SetPartitionsWithBlockSizesCount: (l) => orderedBlocks(l) / product(multiplicities(l).map(factorial)),
  // FindStat's formula: the multinomial (n + 1 - k; m_1, ..., m_n) over n + 1.
  KrewerasNumber: (l) => {
    const n = sum(l);
    return factorial(n + 1) / (factorial(n + 1 - l.length) * product(multiplicities(l).map(factorial)) * (n + 1));
  },
  InvariantSubsetCount: (l) => invariantSubsets(l),
  InvariantTwoElementSubsetCount: (l) => invariantSubsets(l, 2),
  InvariantThreeElementSubsetCount: (l) => invariantSubsets(l, 3),
  // Union the edges a permutation of this cycle type carries onto one another.
  EdgeOrbitCount: (l) => {
    const p = permutationOfCycleType(l);
    const n = p.length;
    const seen = new Set<number>();
    let orbits = 0;
    for (let a = 0; a < n; a++)
      for (let b = a + 1; b < n; b++) {
        if (seen.has(a * n + b)) continue;
        orbits++;
        let [u, v] = [a, b];
        while (!seen.has(Math.min(u, v) * n + Math.max(u, v))) {
          seen.add(Math.min(u, v) * n + Math.max(u, v));
          [u, v] = [p[u]!, p[v]!];
        }
      }
    return orbits;
  },
  ElementarySymmetricFunctionAtOne: (l) => product(l.map((p) => elementaryAtOnes(l.length, p))),
  SubsetGreatestCommonDivisorSum: (l) =>
    l.length === 0 ? 0 : sum(subsetMasks(l.length).map((mask) => l.filter((_, i) => (mask >> i) & 1).reduce(gcd, 0))),

  // ── Fourth round ───────────────────────────────────────────────────────────────────────
  SemistandardTableauCountWithEntriesUpToTwo: (l) => weylDimension(l, 2),
  SemistandardTableauCountWithEntriesUpToThree: (l) => weylDimension(l, 3),
  SemistandardTableauCountWithEntriesUpToFour: (l) => weylDimension(l, 4),
  SemistandardTableauCountWithEntriesUpToLength: (l) => weylDimension(l, l.length),
  SemistandardTableauCountWithEntriesUpToSize: (l) => weylDimension(l, sum(l)),
  StandardTableauCount: standardTableaux,
  PlancherelCount: (l) => standardTableaux(l) ** 2,
  CubedStandardTableauCount: (l) => standardTableaux(l) ** 3,
  ShiftedStandardTableauCount: shiftedStandardTableaux,
  TwiceMeanMajorIndexOfStandardTableaux: (l) => {
    const { count, sum: total } = majorIndexMoments(l);
    return Number((2n * total) / count);
  },
  TwelveTimesMajorIndexVarianceOfStandardTableaux: (l) => {
    const { count, sum: total, squares } = majorIndexMoments(l);
    return Number((12n * (squares * count - total * total)) / (count * count));
  },
  PairsOfDistinctParts: stretchedDegree,
  // The spin: the crossings of each border strip, as FindStat sums them (the differences of its parts with a 1 on the end).
  DiagonalArmSum: (l) =>
    sum(
      borderStrips(l).map((strip) => {
        const padded = [...strip, 1];
        return sum(padded.slice(1).map((p, i) => padded[i]! - p));
      }),
    ),
  RimHooksRemovedToTwoCore: (l) => rimHooksToCore(l, 2),
  RimHooksRemovedToThreeCore: (l) => rimHooksToCore(l, 3),
  MultipartitionCount: (l) => product(l.map((p) => partitionCount(p))),
  // The chain of binomials that deals the points into blocks in order, over the arrangements of the equal ones.
  PartRearrangementCount: (l) => {
    let [left, ways] = [l.length, 1];
    for (const m of multiplicities(l)) {
      ways *= binomial(left, m);
      left -= m;
    }
    return ways;
  },
  // The coefficient reads as the set partitions of the block sizes arranged in a cycle: (length - 1)! of them each.
  LogarithmicDerivativeCoefficient: (l) =>
    l.length === 0 ? 1 : (orderedBlocks(l) / product(multiplicities(l).map(factorial))) * factorial(l.length - 1),
  LagrangeInversionCoefficient: (l) =>
    l.length === 0
      ? 1
      : Number(bigFactorial(sum(l) + l.length - 2) / bigFactorial(sum(l) - 1)) /
        product(multiplicities(l).map(factorial)),
  StarTranspositionFactorizationCount: (l) => {
    const [n, r] = [sum(l), sum(l) + l.length - 2];
    if (l.length === 0) return 1;
    return n <= BRUTE_FORCE_SIZE
      ? starFactorizations(l, r)
      : Number((bigFactorial(r) * BigInt(product(l))) / bigFactorial(n));
  },
  TransitiveMonotoneFactorizationCount: (l) =>
    l.length === 0
      ? 1
      : sum(l) <= BRUTE_FORCE_SIZE
        ? transitiveMonotoneFactorizations(l, sum(l) + l.length - 2)
        : monotoneHurwitz(l),
  SymplecticDimensionRankTwo: (l) => symplecticDimension(l, COROOTS_C2),
  SymplecticDimensionRankThree: (l) => symplecticDimension(l, COROOTS_C3),
  BorderSkewStandardTableauCount: borderSkewTableaux,
  SubpartitionCount: (l) => subpartitions(l).length,
  SameLengthSubpartitionCount: (l) => subpartitions(l).filter((mu) => mu.length === l.length).length,
  // A covering relation is a partition and one of its corners removed: the corners are the distinct nonzero parts.
  YoungLatticeCoveringRelationCount: (l) => sum(subpartitions(l).map((mu) => new Set(mu).size)),

  // The fifth batch.
  PartCount: (l) => l.length,
  LengthCrank: (l) => {
    const ones = l.filter((p) => p === 1).length;
    return ones === 0 ? l.length : l.filter((p) => p > ones).length - ones;
  },

  // The sixth batch.
  SeaweedAlgebraDimension: (l) => (sum(l.map((p) => p * p)) + sum(l) ** 2) / 2,
  CartanDeterminant: (l) => {
    const distinct = [...new Set(l)];
    return Number(determinant(distinct.map((p) => distinct.map((q) => Math.min(p, q)))));
  },
  RookPlacementCount: (l) => sum(rookVector(l)),
  MaximalRookPlacementCount: (l) => rookVector(l).findLast((v) => v > 0)!,
  ShorterSideRookPlacementCount: (l) => rookVector(l)[Math.min(l.length, l[0] ?? 0)] ?? 0,
  NecklaceCount: (l) => (l.length === 0 ? 0 : cycleColoringOrbits(l, false)),
  BraceletCount: (l) => (l.length === 0 ? 0 : cycleColoringOrbits(l, true)),
  // Tried against every n-cycle for small sizes. Beyond that, by counting the pairs (n-cycle, power of it of this type): such a power
  // exists only for equal parts d, m of them, and there are totient(d) generating powers of each n-cycle among the n!/(d^m m!) permutations of the type.
  InvariantOrientedCycleCount: (l) => {
    if (l.length === 0) return 0;
    if (sum(l) <= 7) return commutingCycles(l);
    if (new Set(l).size > 1) return 0;
    const [d, m] = [l[0]!, l.length];
    const phi = Array.from({ length: d }, (_, k) => k + 1).filter((k) => gcd(k, d) === 1).length;
    return Number(
      (bigFactorial(sum(l) - 1) * BigInt(phi) * BigInt(d) ** BigInt(m) * bigFactorial(m)) / bigFactorial(sum(l)),
    );
  },
  SmirnovWordCount: smirnovWords,
  StandardTableauCountWithMajorIndexCongruentToOneModuloSize: (l) =>
    l.length === 0 ? 0 : tableauxWithMajorIndexRemainder(l, 1),
  UpperCoverCountInDominanceOrder: (l) => (l.length === 0 ? 0 : upperCovers(l)),
  LowerCoverCountInDominanceOrder: (l) => (l.length === 0 ? 0 : upperCovers(conjugate(l))),
  BulgarianSolitairePreimageCount: (l) =>
    partitionsOf(sum(l)).filter((mu) => bulgarianMove(mu).join() === l.join()).length,

  // The seventh batch.
  InvariantGraphCount: (l) => 2 ** PARTITION_READINGS.EdgeOrbitCount!(l),
  CompleteHomogeneousSymmetricFunctionAtOne: (l) => product(l.map((p) => binomial(l.length + p - 1, p))),
  PowerSumSymmetricFunctionAtOne: (l) => product(l.map(() => l.length)),
  CubeRootCount: cubeRoots,
  DominatedPartitionCount: (l) => {
    const partial = (mu: Partition, k: number) => sum(mu.slice(0, k));
    return partitionsOf(sum(l)).filter(
      (mu) =>
        l.every((_, k) => partial(mu, k + 1) <= partial(l, k + 1)) &&
        mu.every((_, k) => partial(mu, k + 1) <= partial(l, k + 1)),
    ).length;
  },
  BulgarianSolitaireOrbitSize: (l) => {
    const { preperiod, period } = solitaireOrbit(l);
    return preperiod + period;
  },
  BulgarianSolitairePreperiod: (l) => solitaireOrbit(l).preperiod,

  // The eighth batch.
  PartitionSize: (l) => sum(l),
  CouplesAreForeverGrundyValue: (l) => l.reduce((nim, p) => nim ^ couplesValue(p), 0),
  RowRemovalGrundyValue: rowRemovalValue,
  OrderedRefinementCount: (l) =>
    partitionsOf(sum(l)).filter((mu) => {
      let at = 0;
      return (
        l.every((part) => {
          let block = 0;
          while (block < part && at < mu.length) block += mu[at++]!;
          return block === part;
        }) && at === mu.length
      );
    }).length,
  RefinementCount: (l) => reachedBy(l, splitsOf),
  CoarseningCount: (l) => reachedBy(l, mergesOf),
  SingletonRefinementCount: splitChains,

  // The ninth batch.
  HurwitzNumber: (l) => (l.length === 0 ? 0 : hurwitzNumber(l)),
  MonotoneHurwitzNumber: (l) => {
    // By counting every factorization for small sizes; beyond, the cycles factor alone, a p-cycle in C(p-1) ways.
    if (sum(l) <= 8) {
      const p = permutationOfCycleType(l);
      return monotoneFactorizations(p, p.length - l.length, p.length);
    }
    return product(l.map((p) => catalanByRecurrence(p - 1)));
  },
  NonDominatingSubmultisetCount: nonDominatingSubmultisets,

  // The tenth batch.
  CharacterPolynomialConstantTerm: (l) => (l.every((p) => p === 1) ? 1 : 0),
  // Tried against every permutation for small sizes.
  InverseByConjugationCount: (l) => (sum(l) <= 7 ? permutationsInvertedByConjugation(l) : rootsOfSquare(l)),
  StandardTableauCountWithMajorIndexDivisibleBySize: (l) =>
    l.length === 0 ? 0 : tableauxWithMajorIndexRemainder(l, 0),
  // Evacuation applied to every tableau for small sizes.
  SelfEvacuatingTableauCount: (l) =>
    l.length === 0
      ? 0
      : sum(l) <= 8
        ? standardTableauxOf(l).filter((t) => JSON.stringify(evacuation(t)) === JSON.stringify(t)).length
        : dominoTableaux(l),

  // The eleventh batch.
  // Tried against every permutation for small sizes.
  SquareRootCount: (l) => (sum(l) <= 7 ? squareRootsByTrial(l) : permutationsSquaringTo(l)),
  // The empty tableau has no descent, so its first descent is its size 0, which is even.
  StandardTableauCountWithEvenFirstDescent: (l) => tableauxByFirstDescentParity(l, true),
  StandardTableauCountWithOddFirstDescent: (l) => tableauxByFirstDescentParity(l, false),
  // Walked for small shapes; beyond, the first ascent of a tableau is the first descent of its transpose.
  DesarrangementTableauCount: (l) =>
    sum(l) <= 8
      ? standardTableauxOf(l).filter((tableau) => firstAscent(tableau) % 2 === 0).length
      : tableauxByFirstDescentParity(conjugate(l), true),

  // The twelfth batch.
  // The weights of the tableaux themselves for small shapes; beyond, the compositions the shape dominates.
  SemistandardTableauWeightCountWithEntriesUpToLength: (l) =>
    sum(l) <= 9 ? distinctTableauWeights(l) : dominatedWeightCount(l),
  // Every coloring tried for small shapes; beyond, the flow.
  ProperColoringSchemeCount: (l) => (sum(l) <= 9 ? coloringSchemesByColorings(l) : coloringSchemesByFlow(l)),

  // The multiset partitions: every set partition of the elements, equal ones merged, for small sizes; beyond, by vectors.
  MultisetPartitionCount: (l) => (sum(l) <= 8 ? multisetPartitionsByBlocks(l) : multisetPartitionsByVectors(l)),
  // Every permutation conjugated by every element of the subgroup for small sizes; beyond, Burnside over the cycle types.
  ColoredCycleMultisetCount: (l) => (sum(l) <= 5 ? cycleMultisetsByOrbits(l) : cycleMultisetsByBurnside(l)),
  ColoredRootedTreeCount: (l) => coloredRootedTrees(l).length,
  ColoredTreeCount: coloredFreeTreeCount,
  SemistandardTableauCountWithContent: tableauxOfContent,
  InvariantSetPartitionCount: invariantSetPartitionsByTrial,
  ColoredEndofunctionCount: (l) => (sum(l) <= 4 ? endofunctionsByOrbits(l) : endofunctionsByBurnside(l)),
  WordCountWithoutThreeConsecutiveIncreasingLetters: wordsAvoidingIncreasingTriple,
  NonnegativeIntegerMatrixCountWithDecreasingColumnSums: (l) => matricesWithDecreasingColumns(l, false),
  ZeroOneMatrixCountWithDecreasingColumnSums: (l) => matricesWithDecreasingColumns(l, true),
  OrderedSetPartitionCountWithDecreasingBlockSums: orderedSetPartitionsWithDecreasingSums,
  RootedTreeCountWithNoLeafOfItsParentsColor: rootedTreesWithNoLeafOfParentsColor,
  IncreasingTreeCountWithNoLeafOfItsParentsColor: increasingTreesWithNoLeafOfParentsColor,
  BinaryTreeCountWithNoTwinLeavesOfOneColor: (l) => leafLabeledTreesWithNoTwinLeavesOfOneColor(l, true),
  LeafLabeledTreeCountWithNoTwinLeavesOfOneColor: (l) => leafLabeledTreesWithNoTwinLeavesOfOneColor(l, false),
  StandardTableauCountWithNoConsecutiveEntriesInOneRow: tableauxWithoutRowRunsByWalking,
  LehmerCodeMultiplicityPermutationCount: lehmerCodesWithMultiplicities,
  DiagramPosetLinearExtensionCount: speyerPosetLinearExtensions,
  ChompGrundyValue: (l) => grundyValue(l, chompMoves, chompMemo),
  SquareRemovalGrundyValue: (l) => grundyValue(l, squareGameMoves, squareGameMemo),
  SmallestOddRestrictionDepth: oddRestrictionDepth,
  DominoTilingCount: dominoTilings,
};

/**
 * The largest size the nightly sweep over every partition tries a head to: the readings that walk every object, and the tables over
 * the vectors below the parts, stop where they take minutes.
 */
export const DEEP_MAXIMUM_SIZE: Record<string, number> = {
  SemistandardTableauWeightCountWithEntriesUpToLength: 11,
  MultisetPartitionCount: 11,
  ColoredCycleMultisetCount: 12,
  ColoredRootedTreeCount: 7,
  ColoredTreeCount: 7,
  InvariantSetPartitionCount: 10,
  ColoredEndofunctionCount: 12,
  WordCountWithoutThreeConsecutiveIncreasingLetters: 12,
  NonnegativeIntegerMatrixCountWithDecreasingColumnSums: 10,
  ZeroOneMatrixCountWithDecreasingColumnSums: 10,
  OrderedSetPartitionCountWithDecreasingBlockSums: 10,
  RootedTreeCountWithNoLeafOfItsParentsColor: 7,
  IncreasingTreeCountWithNoLeafOfItsParentsColor: 9,
  BinaryTreeCountWithNoTwinLeavesOfOneColor: 12,
  LeafLabeledTreeCountWithNoTwinLeavesOfOneColor: 8,
  LehmerCodeMultiplicityPermutationCount: 10,
  SemistandardTableauCountWithContent: 12,
  SmallestOddRestrictionDepth: 12,
  ChompGrundyValue: 12,
  SquareRemovalGrundyValue: 12,
  DominoTilingCount: 12,
};
