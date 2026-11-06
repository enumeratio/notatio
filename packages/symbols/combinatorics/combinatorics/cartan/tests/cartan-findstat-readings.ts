// Independent readings of the Cartan type statistics adopted from FindStat, written against the root system
// the Cartan matrix generates (not against the degrees the definitions use). A type is [letter, rank].
//
//   - the roots are the orbit of the simple roots under the simple reflections, as coefficient vectors;
//   - the Weyl group is the group of permutations of the roots those reflections generate (small ranks);
//   - a representation's dimension is Weyl's product over the positive coroots;
//   - rowmotion runs on the order ideals of the root poset.

export type CartanType = readonly [letter: string, rank: number];
export type Matrix = number[][];

/** The Cartan matrix, a[i][j] = <alpha_i, alpha_j^vee>, in Bourbaki's numbering. */
export function cartanMatrix([letter, n]: CartanType): Matrix {
  const a: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 2 : 0)));
  const link = (i: number, j: number): void => {
    a[i]![j] = -1;
    a[j]![i] = -1;
  };
  if (letter === "E") {
    for (const [i, j] of [
      [0, 2],
      [2, 3],
      [3, 4],
      [1, 3],
      ...Array.from({ length: n - 5 }, (_, k) => [4 + k, 5 + k]),
    ] as const)
      link(i, j);
    return a;
  }
  if (letter === "D") {
    for (let i = 0; i < n - 2; i++) link(i, i + 1);
    link(n - 3, n - 1);
    return a;
  }
  for (let i = 0; i < n - 1; i++) link(i, i + 1);
  if (letter === "B") a[n - 2]![n - 1] = -2;
  if (letter === "C") a[n - 1]![n - 2] = -2;
  if (letter === "F") a[1]![2] = -2;
  if (letter === "G") a[1]![0] = -3;
  return a;
}

/** Every root as a coefficient vector in the simple roots: the orbit of the simple roots under the reflections. */
export function roots(a: Matrix): number[][] {
  const n = a.length;
  const key = (v: readonly number[]): string => v.join(",");
  const found = new Map<string, number[]>();
  const queue: number[][] = [];
  for (let i = 0; i < n; i++) {
    const simple = Array.from({ length: n }, (_, k) => (k === i ? 1 : 0));
    found.set(key(simple), simple);
    queue.push(simple);
  }
  while (queue.length > 0) {
    const beta = queue.pop()!;
    for (let j = 0; j < n; j++) {
      const pairing = beta.reduce((sum, b, i) => sum + b * a[i]![j]!, 0);
      const image = beta.map((b, i) => (i === j ? b - pairing : b));
      if (!found.has(key(image))) {
        found.set(key(image), image);
        queue.push(image);
      }
    }
  }
  return [...found.values()];
}

export const positiveRoots = (a: Matrix): number[][] =>
  roots(a)
    .filter((root) => root.every((c) => c >= 0))
    .toSorted((x, y) => x.reduce((p, q) => p + q, 0) - y.reduce((p, q) => p + q, 0) || (x.join() < y.join() ? -1 : 1));

const sumOf = (v: readonly number[]): number => v.reduce((p, q) => p + q, 0);
export const heightOf = sumOf;

/** The highest root: the positive root of greatest height. */
export const highestRoot = (a: Matrix): number[] => positiveRoots(a).at(-1)!;

/** Squared lengths of the simple roots, scaled so the shortest root has squared length 2: d_i a_ij = d_j a_ji. */
export function squaredLengths(a: Matrix): number[] {
  const n = a.length;
  const d: (number | undefined)[] = Array.from({ length: n }, () => undefined);
  d[0] = 1;
  const queue = [0];
  while (queue.length > 0) {
    const i = queue.pop()!;
    for (let j = 0; j < n; j++)
      if (i !== j && a[i]![j] !== 0 && d[j] === undefined) {
        // (alpha_i, alpha_j) = a_ij d_j / 2 = a_ji d_i / 2
        d[j] = (a[j]![i]! * d[i]!) / a[i]![j]!;
        queue.push(j);
      }
  }
  const least = Math.min(...(d as number[]));
  return (d as number[]).map((x) => (2 * x) / least);
}

/** The bilinear form on coefficient vectors, with the shortest roots of squared length 2. */
export function form(a: Matrix): (x: readonly number[], y: readonly number[]) => number {
  const d = squaredLengths(a);
  return (x, y) =>
    x.reduce((sum, xi, i) => sum + y.reduce((inner, yj, j) => inner + (xi * yj * (a[i]![j]! * d[j]!)) / 2, 0) * 1, 0);
}

// ─── the Weyl group, as permutations of the roots ───────────────────────────────────────────────

export interface Group {
  /** Every element as a permutation of the root indices. */
  readonly elements: readonly Uint16Array[];
  readonly lengths: readonly number[];
  readonly generators: readonly Uint16Array[];
  /** The reflection in each positive root, as a permutation of the root indices. */
  readonly reflections: readonly Uint16Array[];
}

const compose = (p: Uint16Array, q: Uint16Array): Uint16Array => p.map((_, i) => p[q[i]!]!);
const sameAs = (p: Uint16Array, q: Uint16Array): boolean => p.every((v, i) => v === q[i]);

export function weylGroup(a: Matrix): Group {
  const all = roots(a);
  const dot = form(a);
  const index = new Map(all.map((r, i) => [r.join(","), i]));
  /** The reflection in the root beta: gamma -> gamma - <gamma, beta^vee> beta. */
  const reflectionIn = (beta: readonly number[]): Uint16Array =>
    Uint16Array.from(
      all.map((gamma) => {
        const pairing = (2 * dot(gamma, beta)) / dot(beta, beta);
        return index.get(gamma.map((g, i) => g - pairing * beta[i]!).join(","))!;
      }),
    );
  const generators = a.map((_, j) => reflectionIn(all[j]!));
  const reflections = all.filter((r) => r.every((c) => c >= 0)).map(reflectionIn);
  const identity = Uint16Array.from(all.map((_, i) => i));
  const seen = new Set<string>([identity.join()]);
  const elements: Uint16Array[] = [identity];
  const lengths: number[] = [0];
  for (let at = 0; at < elements.length; at++)
    for (const s of generators) {
      const next = compose(elements[at]!, s);
      if (!seen.has(next.join())) {
        seen.add(next.join());
        elements.push(next);
        lengths.push(lengths[at]! + 1);
      }
    }
  return { elements, lengths, generators, reflections };
}

const orderOf = (p: Uint16Array): number => {
  let power = p;
  let order = 1;
  while (!sameAs(power, Uint16Array.from(p.keys()))) {
    power = compose(power, p);
    order++;
  }
  return order;
};
const coxeterElementOf = (g: Group): Uint16Array => g.generators.reduce((product, s) => compose(product, s));

/** |W|: the size of the group the simple reflections generate. */
export const groupOrder = (a: Matrix): number => weylGroup(a).elements.length;
/** The order of the product of the simple reflections. */
export const coxeterNumberOf = (a: Matrix): number => orderOf(coxeterElementOf(weylGroup(a)));
/** The elements commuting with every simple reflection. */
export const centerSize = (a: Matrix): number => {
  const g = weylGroup(a);
  return g.elements.filter((w) => g.generators.every((s) => sameAs(compose(w, s), compose(s, w)))).length;
};
/** The conjugates of the Coxeter element: its orbit under conjugation by the simple reflections. */
export function coxeterClassSize(a: Matrix): number {
  const g = weylGroup(a);
  const start = coxeterElementOf(g);
  const seen = new Set<string>([start.join()]);
  const queue = [start];
  while (queue.length > 0) {
    const c = queue.pop()!;
    for (const s of g.generators) {
      const conjugate = compose(compose(s, c), s);
      if (!seen.has(conjugate.join())) {
        seen.add(conjugate.join());
        queue.push(conjugate);
      }
    }
  }
  return seen.size;
}
/** The coefficients of the sum of q^length(w) over the group. */
export function poincareCoefficients(a: Matrix): number[] {
  const out: number[] = [];
  for (const length of weylGroup(a).lengths) out[length] = (out[length] ?? 0) + 1;
  return out;
}
/** The ways to write the Coxeter element as a product of `rank` reflections, counted by walking the products. */
export function factorizationCount(a: Matrix): number {
  const g = weylGroup(a);
  const target = coxeterElementOf(g).join();
  let ways = new Map<string, { element: Uint16Array; count: number }>();
  const identity = g.elements[0]!;
  ways.set(identity.join(), { element: identity, count: 1 });
  for (let step = 0; step < a.length; step++) {
    const next = new Map<string, { element: Uint16Array; count: number }>();
    for (const { element, count } of ways.values())
      for (const t of g.reflections) {
        const product = compose(element, t);
        const entry = next.get(product.join());
        if (entry) entry.count += count;
        else next.set(product.join(), { element: product, count });
      }
    ways = next;
  }
  return ways.get(target)?.count ?? 0;
}

// ─── statistics of the root system ──────────────────────────────────────────────────────────────

/** The positive roots whose coefficients are all positive. */
export const fullSupportRoots = (a: Matrix): number => positiveRoots(a).filter((r) => r.every((c) => c > 0)).length;
/** The simple roots appearing once in the highest root. */
export const minusculeCount = (a: Matrix): number => highestRoot(a).filter((c) => c === 1).length;
/** The pairing of the highest root with half the sum of the positive roots. */
export function highestRootPairing(a: Matrix): number {
  const dot = form(a);
  const twoRho = positiveRoots(a).reduce(
    (sum, r) => sum.map((s, i) => s + r[i]!),
    a.map(() => 0),
  );
  return dot(highestRoot(a), twoRho) / 2;
}
/** The sum of the heights of the positive roots. */
export const heightSum = (a: Matrix): number => positiveRoots(a).reduce((sum, r) => sum + heightOf(r), 0);

/** The positive roots whose upper ideal in the root poset is abelian (no two of its roots add to a root). */
export function commutativeRoots(a: Matrix): number {
  const positive = positiveRoots(a);
  const isRoot = new Set(positive.map((r) => r.join(",")));
  const above = (beta: readonly number[]): number[][] => positive.filter((r) => r.every((c, i) => c >= beta[i]!));
  return positive.filter((beta) => {
    const ideal = above(beta);
    return ideal.every((x) => ideal.every((y) => !isRoot.has(x.map((c, i) => c + y[i]!).join(","))));
  }).length;
}

// ─── representations, by Weyl's dimension formula ───────────────────────────────────────────────

/** The dimension of the representation with highest weight sum c_i omega_i: the product over the positive coroots. */
export function dimension(a: Matrix, c: readonly number[]): number {
  // The coroots of the type are the roots of its transpose, in the simple coroots.
  const transpose = a.map((_, i) => a.map((row) => row[i]!));
  let numerator = 1n;
  let denominator = 1n;
  for (const k of positiveRoots(transpose)) {
    numerator *= BigInt(k.reduce((sum, ki, i) => sum + ki * (c[i]! + 1), 0));
    denominator *= BigInt(sumOf(k));
  }
  return Number(numerator / denominator);
}
const fundamental = (n: number, i: number): number[] => Array.from({ length: n }, (_, k) => (k === i ? 1 : 0));
/** The weight of a root in the fundamental weights: its pairings with the simple coroots. */
const weightOf = (a: Matrix, root: readonly number[]): number[] =>
  a.map((_, j) => root.reduce((sum, r, i) => sum + r * a[i]![j]!, 0));

export const firstFundamentalDimension = (a: Matrix): number => dimension(a, fundamental(a.length, 0));
export const adjointDimension = (a: Matrix): number => dimension(a, weightOf(a, highestRoot(a)));
/** The dimension at the highest short root: the dominant root of least length. */
export function quasiMinusculeDimension(a: Matrix): number {
  const dot = form(a);
  const all = roots(a);
  const shortest = Math.min(...all.map((r) => dot(r, r)));
  const dominant = all.filter((r) => dot(r, r) === shortest && weightOf(a, r).every((w) => w >= 0));
  return dimension(a, weightOf(a, dominant[0]!));
}
/** Any nontrivial representation of a simple Lie algebra is faithful, and the least is a fundamental one. */
export const minimalFaithfulDimension = (a: Matrix): number =>
  Math.min(...a.map((_, i) => dimension(a, fundamental(a.length, i))));
/** Dynkin's index of the representation, with the long roots of squared length 2: dim * (l, l + 2 rho) / dim(g). */
function representationIndex(a: Matrix, c: readonly number[]): number {
  const dot = form(a);
  const n = a.length;
  // The weight c in the simple roots: solve c = A^T x column by column is avoided by using the inverse Cartan matrix via the pairing
  // (omega_i, alpha_j) = delta_ij d_j / 2.
  const d = squaredLengths(a);
  const lambdaDotAlpha = (j: number): number => (c[j]! * d[j]!) / 2;
  const rhoDotAlpha = (j: number): number => d[j]! / 2;
  // (l, l + 2 rho): write l + 2 rho in the simple roots with the inverse Gram matrix; instead pair coordinates in the weight basis through the
  // Gram matrix of the simple roots G: (x, y) = u^T G^-1 v for u_j = (x, alpha_j).
  const gram = a.map((row, i) => row.map((_, j) => dot(unit(n, i), unit(n, j))));
  const inverse = invert(gram);
  const u = Array.from({ length: n }, (_, j) => lambdaDotAlpha(j));
  const v = Array.from({ length: n }, (_, j) => lambdaDotAlpha(j) + 2 * rhoDotAlpha(j));
  // The index is normalized so that the long roots have squared length 2.
  const scale = 2 / Math.max(...d);
  const pairing =
    scale * u.reduce((sum, uj, i) => sum + uj * inverse[i]!.reduce((inner, m, j) => inner + m * v[j]!, 0), 0);
  const dimG = n + 2 * positiveRoots(a).length;
  return (dimension(a, c) * pairing) / dimG;
}
const unit = (n: number, i: number): number[] => Array.from({ length: n }, (_, k) => (k === i ? 1 : 0));
function invert(m: Matrix): Matrix {
  const n = m.length;
  const aug = m.map((row, i) => [...row, ...unit(n, i)]);
  for (let col = 0; col < n; col++) {
    const pivot = aug.findIndex((row, r) => r >= col && Math.abs(row[col]!) > 1e-12);
    [aug[col], aug[pivot]] = [aug[pivot]!, aug[col]!];
    const scale = aug[col]![col]!;
    aug[col] = aug[col]!.map((x) => x / scale);
    for (let r = 0; r < n; r++)
      if (r !== col) {
        const factor = aug[r]![col]!;
        aug[r] = aug[r]!.map((x, k) => x - factor * aug[col]![k]!);
      }
  }
  return aug.map((row) => row.slice(n));
}
const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
/** The gcd of the indices of the representations with highest weight omega_i or omega_i + omega_j. */
export function dynkinIndex(a: Matrix): number {
  const n = a.length;
  const weights: number[][] = [];
  for (let i = 0; i < n; i++)
    for (let j = i; j < n; j++) weights.push(fundamental(n, i).map((x, k) => x + (k === j ? 1 : 0)));
  for (let i = 0; i < n; i++) weights.push(fundamental(n, i));
  return weights
    .filter((w) => dimension(a, w) < 1e9)
    .map((w) => Math.round(representationIndex(a, w)))
    .reduce(gcd, 0);
}

// ─── the root poset ─────────────────────────────────────────────────────────────────────────────

/** The order of rowmotion on the order ideals of the root poset (positive roots, ordered coefficient-wise). */
export function rowmotionOrder(a: Matrix): number {
  const positive = positiveRoots(a);
  const m = positive.length;
  const below = positive.map((x) => positive.map((y) => y.every((c, i) => c <= x[i]!)));
  // The roots are in order of height, so everything below a root comes before it: an ideal takes a root only once all of those are in.
  const ideals: bigint[] = [];
  const walk = (i: number, set: bigint): void => {
    if (i === m) {
      ideals.push(set);
      return;
    }
    walk(i + 1, set);
    if (positive.every((_, j) => j >= i || !below[i]![j] || (set >> BigInt(j)) & 1n))
      walk(i + 1, set | (1n << BigInt(i)));
  };
  walk(0, 0n);
  const rowmotion = (set: bigint): bigint => {
    const rest = positive.map((_, i) => i).filter((i) => !((set >> BigInt(i)) & 1n));
    const minimal = rest.filter((i) => rest.every((j) => j === i || !below[i]![j]));
    return minimal.reduce(
      (ideal, i) => positive.reduce((acc, _, j) => (below[i]![j] ? acc | (1n << BigInt(j)) : acc), ideal),
      0n,
    );
  };
  const next = new Map(ideals.map((ideal) => [ideal, rowmotion(ideal)]));
  const lcm = (x: number, y: number): number => (x / gcd(x, y)) * y;
  const done = new Set<bigint>();
  let order = 1;
  for (const start of ideals) {
    if (done.has(start)) continue;
    let length = 0;
    for (let at = start; !done.has(at); at = next.get(at)!) {
      done.add(at);
      length++;
    }
    order = lcm(order, length);
  }
  return order;
}

// ─── fully commutative elements ─────────────────────────────────────────────────────────────────

/** The fully commutative elements: those whose reduced words never reach a braid factor by commutations. */
export function fullyCommutativeCount(a: Matrix): number {
  const g = weylGroup(a);
  const n = a.length;
  const braid = (i: number, j: number): number => ({ 0: 2, 1: 3, 2: 4, 3: 6 })[a[i]![j]! * a[j]![i]!] ?? 2;
  // A reduced word for each element, from the breadth-first order of the group.
  const words = new Map<string, number[]>([[g.elements[0]!.join(), []]]);
  for (let at = 0; at < g.elements.length; at++)
    for (let s = 0; s < n; s++) {
      const next = compose(g.elements[at]!, g.generators[s]!);
      if (!words.has(next.join())) words.set(next.join(), [...words.get(g.elements[at]!.join())!, s]);
    }
  const hasBraid = (word: readonly number[]): boolean => {
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const m = braid(i, j);
        if (m < 3) continue;
        for (let start = 0; start + m <= word.length; start++) {
          const first = word[start]!;
          if (first !== i && first !== j) continue;
          const other = first === i ? j : i;
          if (Array.from({ length: m }, (_, k) => word[start + k] === (k % 2 === 0 ? first : other)).every(Boolean))
            return true;
        }
      }
    return false;
  };
  const commute = (i: number, j: number): boolean => braid(i, j) === 2;
  return [...words.values()].filter((word) => {
    const seen = new Set<string>([word.join()]);
    const queue = [word];
    while (queue.length > 0) {
      const w = queue.pop()!;
      if (hasBraid(w)) return false;
      for (let k = 0; k + 1 < w.length; k++)
        if (commute(w[k]!, w[k + 1]!)) {
          const swapped = [...w];
          [swapped[k], swapped[k + 1]] = [swapped[k + 1]!, swapped[k]!];
          if (!seen.has(swapped.join())) {
            seen.add(swapped.join());
            queue.push(swapped);
          }
        }
    }
    return true;
  }).length;
}

// ─── classical closed forms, for the Catalan numbers (Armstrong, Generalized noncrossing partitions, table in section 5.3) ───

const binomial = (n: number, k: number): number => {
  let out = 1n;
  for (let i = 1; i <= k; i++) out = (out * BigInt(n - k + i)) / BigInt(i);
  return Number(out);
};

/** The Catalan number of a type from the classical formulas (E, F, G from the table of exceptional values). */
export function classicalCatalan([letter, n]: CartanType): number {
  if (letter === "A") return binomial(2 * n + 2, n + 1) / (n + 2);
  if (letter === "B" || letter === "C") return binomial(2 * n, n);
  if (letter === "D") return ((3 * n - 2) * binomial(2 * n - 2, n - 1)) / n;
  return ({ E6: 833, E7: 4160, E8: 25080, F4: 105, G2: 8 } as Record<string, number>)[`${letter}${n}`]!;
}
/** The positive Catalan number from the classical formulas, the exceptional values from the same table. */
export function classicalPositiveCatalan([letter, n]: CartanType): number {
  if (letter === "A") return binomial(2 * n, n) / (n + 1);
  if (letter === "B" || letter === "C") return binomial(2 * n - 1, n - 1);
  if (letter === "D") return ((3 * n - 4) * binomial(2 * n - 3, n - 2)) / n;
  return ({ E6: 418, E7: 2431, E8: 17342, F4: 66, G2: 5 } as Record<string, number>)[`${letter}${n}`]!;
}

// ─── exponents and the Coxeter number from the heights of the roots ──────────────────────────────

/** The Coxeter number: one more than the height of the highest root. */
export const coxeterNumberFromRoots = (a: Matrix): number => heightOf(highestRoot(a)) + 1;
/** The exponents (Kostant): the number of positive roots of height k is the number of exponents at least k. */
export function exponentsFromRoots(a: Matrix): number[] {
  const byHeight = new Map<number, number>();
  for (const r of positiveRoots(a)) byHeight.set(heightOf(r), (byHeight.get(heightOf(r)) ?? 0) + 1);
  const top = Math.max(...byHeight.keys());
  // exponent e occurs (count at height e) - (count at height e + 1) times.
  return Array.from({ length: top }, (_, k) => k + 1).flatMap((e) =>
    Array.from({ length: (byHeight.get(e) ?? 0) - (byHeight.get(e + 1) ?? 0) }, () => e),
  );
}
/** The Fuss-Catalan number of order m from the exponents: the product of (m h + e + 1 - shift) / (e + 1). */
export function fussFromRoots(a: Matrix, m: number, shift: number): number {
  const h = BigInt(coxeterNumberFromRoots(a));
  let numerator = 1n;
  let denominator = 1n;
  for (const e of exponentsFromRoots(a)) {
    numerator *= BigInt(m) * h + BigInt(e) + 1n - BigInt(shift);
    denominator *= BigInt(e) + 1n;
  }
  return Number(numerator / denominator);
}
/** The dual Coxeter number: one more than the height of the highest coroot, in the simple coroots. */
export function dualCoxeterFromRoots(a: Matrix): number {
  const theta = highestRoot(a);
  const d = squaredLengths(a);
  const longest = Math.max(...d);
  return 1 + theta.reduce((sum, c, i) => sum + (c * d[i]!) / longest, 0);
}
/** Bourbaki's gamma: k times the dual Coxeter numbers of the type and its dual, k the ratio of the squared lengths of the long and short roots. */
export function gammaFromRoots(a: Matrix): number {
  const d = squaredLengths(a);
  const k = Math.max(...d) / Math.min(...d);
  const transpose = a.map((_, i) => a.map((row) => row[i]!));
  return k * dualCoxeterFromRoots(a) * dualCoxeterFromRoots(transpose);
}
/** The conjugacy classes of reflections: the lengths of the roots. */
export const reflectionOrbitsFromRoots = (a: Matrix): number => new Set(squaredLengths(a).map((x) => x)).size;
/** The determinant, by fraction-free elimination. */
export function determinant(a: Matrix): number {
  const n = a.length;
  const m = a.map((row) => row.map(BigInt));
  let previous = 1n;
  let sign = 1n;
  for (let k = 0; k < n - 1; k++) {
    if (m[k]![k] === 0n) {
      const swap = m.findIndex((row, r) => r > k && row[k] !== 0n);
      [m[k], m[swap]] = [m[swap]!, m[k]!];
      sign = -sign;
    }
    for (let i = k + 1; i < n; i++)
      for (let j = k + 1; j < n; j++) m[i]![j] = (m[i]![j]! * m[k]![k]! - m[i]![k]! * m[k]![j]!) / previous;
    previous = m[k]![k]!;
  }
  return Number(sign * m[n - 1]![n - 1]!);
}

/** The permanent, by summing over every permutation. */
export function permanent(a: Matrix): number {
  const n = a.length;
  const walk = (row: number, used: number): number =>
    row === n
      ? 1
      : a[row]!.reduce(
          (sum, entry, column) =>
            used & (1 << column) || entry === 0 ? sum : sum + entry * walk(row + 1, used | (1 << column)),
          0,
        );
  return walk(0, 0);
}
