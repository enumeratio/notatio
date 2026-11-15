// GCD for real bigints, tracked at https://github.com/enumeratio/notatio/issues/205:
// compute-engine's native GCD folds a plain Euclidean algorithm (`x, y = y, x % y`) over its
// operands. `declare-gaussian.ts` already carries GCD into ℤ[i] when an operand is genuinely
// complex, but a call where every operand is a real integer — the common case, and the
// bench's 10000-bit pair — still falls through to that native Euclid. Below
// `LEHMER_THRESHOLD_BITS` this runs Euclid with bigint `%`; at and above it, Lehmer's
// algorithm (HAC 14.4) from @notatio/residues.
import { bigIntegerAt, wrapOperator, type Engine, type Expr } from "@notatio/engine";
import { lehmerGcd } from "@notatio/residues";

// Measured per pair on random balanced operands, with and without a shared factor of half the
// width: Lehmer ties Euclid near 64-96 bits and is ahead from 128 (128 bits: 0.002 ms against
// 0.005 ms; 1024: 0.02 against 0.06; 10000: 0.42 against 6.2). Stein's binary GCD loses to
// both until about 4000 bits and to Lehmer at every size, so it is not used here.
const LEHMER_THRESHOLD_BITS = 128n;
const LEHMER_THRESHOLD = 1n << (LEHMER_THRESHOLD_BITS - 1n);

function euclidGcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y > 0n) [x, y] = [y, x % y];
  return x;
}

function hybridGcd(a: bigint, b: bigint): bigint {
  // The larger operand has at least LEHMER_THRESHOLD_BITS bits when it reaches 2^(bits - 1).
  const big = (a < 0n ? -a : a) >= LEHMER_THRESHOLD || (b < 0n ? -b : b) >= LEHMER_THRESHOLD;
  return big ? lehmerGcd(a, b) : euclidGcd(a, b);
}

export function declareFastGcd(ce: Engine): void {
  /** Every operand a plain real bigint (so genuinely-Gaussian calls fall through to
   *  declare-gaussian.ts's wrapper, attached ahead of this one). */
  const allRealIntegers = (ops: readonly Expr[]): bigint[] | undefined => {
    const values: bigint[] = [];
    for (const op of ops) {
      const n = bigIntegerAt(op);
      if (n === undefined) return undefined;
      values.push(n);
    }
    return values;
  };

  // compile builtin: the same gcd, computed faster for big integers
  wrapOperator(
    ce,
    ["GCD", 100000, 100000],
    (ops) => allRealIntegers(ops) !== undefined,
    // Folds from 0n (gcd(0, x) = |x|), so a single operand or an empty call both take the
    // same path as two-or-more, rather than needing a special case for either.
    () => (ops) => ce.number(allRealIntegers(ops)!.reduce((a, b) => hybridGcd(a, b), 0n)),
    { compile: "builtin" },
  );
}
