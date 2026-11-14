// Residue arithmetic over bigints. Every function here reduces into [0, m).

/** a mod m, in [0, m). */
export const mod = (a: bigint, m: bigint): bigint => {
  const r = a % m;
  return r < 0n ? r + m : r;
};

/** aᵉ mod m by repeated squaring, for e ≥ 0. */
export function powMod(a: bigint, e: bigint, m: bigint): bigint {
  if (m === 1n) return 0n;
  let result = 1n;
  let base = mod(a, m);
  for (let k = e; k > 0n; k >>= 1n) {
    if (k & 1n) result = (result * base) % m;
    base = (base * base) % m;
  }
  return result;
}

/** How many factors of 2 divide `x` (x ≠ 0). */
const twos = (x: bigint): bigint => {
  let n = 0n;
  while ((x & 1n) === 0n) {
    x >>= 1n;
    n++;
  }
  return n;
};

/**
 * Stein's binary GCD: shifts and subtractions only, no division. Faster than plain Euclid
 * (`x, y = y, x % y`) only above about 4000 bits (10000 bits: 2.6 ms against 6.2 ms), and
 * `lehmerGcd` beats it at every size from 128 bits up; the engine's GCD uses Euclid below
 * 128 bits and `lehmerGcd` above (issue #205).
 */
export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  if (x === 0n) return y;
  if (y === 0n) return x;
  const xTwos = twos(x);
  const yTwos = twos(y);
  x >>= xTwos;
  y >>= yTwos;
  const shift = xTwos < yTwos ? xTwos : yTwos;
  while (x !== y) {
    if (x < y) [x, y] = [y, x];
    x -= y;
    x >>= twos(x);
  }
  return x << shift;
}

// Leading-digit window for Lehmer's algorithm. Cofactors are bigints, so a 60-bit window has
// no float rounding to guard; it measured faster than a 52-bit double window (the widest whose
// sums stay exact) at every size from 128 to 65536 bits.
const LEHMER_WINDOW_BITS = 60;
// At or below this x and y fit a machine word, and a plain bigint `%` is as fast as simulating.
const LEHMER_SMALL = 1n << 64n;
// A Euclidean step shrinks the window by at least log₂ φ ≈ 0.69 bits, so 60 bits take under
// 87 steps; the cap is a backstop, and stopping early leaves a valid matrix.
const LEHMER_INNER_CAP = 128;

/**
 * The bit length of x > 0 given x < 2ⁿ: n walks down in 64-bit chunks while the top chunk is
 * empty, then the top 64 bits give the exact count. The caller carries n from step to step, so
 * a full-width conversion never repeats.
 */
function bitLength(x: bigint, n: number): number {
  while (n > 64 && x >> BigInt(n - 64) === 0n) n -= 64;
  const top = n > 64 ? x >> BigInt(n - 64) : x;
  const high = Number(top >> 32n);
  const topBits = high !== 0 ? 64 - Math.clz32(high) : 32 - Math.clz32(Number(top & 0xffffffffn));
  return (n > 64 ? n - 64 : 0) + topBits;
}

/**
 * Lehmer's GCD (HAC Algorithm 14.4): simulates many Euclidean steps at once over the leading
 * 60 bits of x and y, then applies the accumulated 2×2 cofactor matrix to the full bigints in
 * one shot — trading most of the O(log n) full-width divisions Euclid needs for a few
 * multiplications. The matrix is unimodular, so the GCD is preserved whatever the window
 * decides; a window that cannot pin down a shared quotient (y far smaller than x) makes one
 * ordinary `x mod y` step instead, and the outer loop is capped so a window that stops making
 * progress finishes by plain Euclid (issue #205). Measured against Euclid, Stein's binary
 * `gcd` and a 52-bit double window: faster than all of them from 128 bits up (10000 bits:
 * Euclid 6.2 ms, Stein 2.6 ms, Lehmer 0.42 ms per pair).
 */
export function lehmerGcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  if (x < y) [x, y] = [y, x];
  let bits = y >= LEHMER_SMALL ? x.toString(2).length : 0;
  // Euclid needs at most about 1.44 steps per bit and a window step does at least as well, so
  // twice the bit length is a cap that only a stalled loop reaches.
  let steps = 2 * bits + 64;
  while (y >= LEHMER_SMALL && steps-- > 0) {
    bits = bitLength(x, bits);
    const shift = BigInt(bits - LEHMER_WINDOW_BITS);
    let xHat = x >> shift;
    let yHat = y >> shift;
    let A = 1n;
    let B = 0n;
    let C = 0n;
    let D = 1n;
    for (let i = 0; i < LEHMER_INNER_CAP; i++) {
      const yC = yHat + C;
      const yD = yHat + D;
      if (yC === 0n || yD === 0n) break;
      const q = (xHat + A) / yC;
      if (q !== (xHat + B) / yD) break;
      [A, B, xHat, C, D, yHat] = [C, D, yHat, A - q * C, B - q * D, xHat - q * yHat];
    }
    if (B === 0n) {
      // No progress from the window: one full-precision step.
      [x, y] = [y, x % y];
    } else {
      const nx = A * x + B * y;
      const ny = C * x + D * y;
      x = nx < 0n ? -nx : nx;
      y = ny < 0n ? -ny : ny;
      if (x < y) [x, y] = [y, x];
    }
  }
  while (y > 0n) [x, y] = [y, x % y];
  return x;
}

/** [g, u, v] with u·a + v·b = g = gcd(a, b). */
export function extendedGcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  let [oldR, r] = [a, b];
  let [oldU, u] = [1n, 0n];
  let [oldV, v] = [0n, 1n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldU, u] = [u, oldU - q * u];
    [oldV, v] = [v, oldV - q * v];
  }
  return oldR < 0n ? [-oldR, -oldU, -oldV] : [oldR, oldU, oldV];
}

/** a⁻¹ mod m, or undefined when gcd(a, m) ≠ 1. */
export function invMod(a: bigint, m: bigint): bigint | undefined {
  if (m === 1n) return 0n;
  const [g, u] = extendedGcd(mod(a, m), m);
  return g === 1n ? mod(u, m) : undefined;
}

/** The residue mod ∏ moduli agreeing with each (residue, modulus); moduli pairwise coprime. */
export function crt(channels: readonly (readonly [bigint, bigint])[]): bigint {
  let result = 0n;
  let combined = 1n;
  for (const [residue, modulus] of channels) {
    const inverse = invMod(combined, modulus) ?? 0n;
    result += combined * mod((residue - result) * inverse, modulus);
    combined *= modulus;
  }
  return result;
}

/**
 * The x mod lcm(mᵢ) agreeing with every (residue, modulus), as [x, lcm], for moduli that need
 * not be coprime — or undefined when two channels disagree on a shared factor.
 */
export function crtSolve(channels: readonly (readonly [bigint, bigint])[]): [bigint, bigint] | undefined {
  let [x, m] = [0n, 1n];
  for (const [residue, modulus] of channels) {
    const g = gcd(m, modulus);
    const gap = residue - x;
    if (mod(gap, g) !== 0n) return undefined;
    const step = modulus / g;
    x = mod(x + m * mod((gap / g) * (invMod(m / g, step) ?? 0n), step), m * step);
    m *= step;
  }
  return [x, m];
}

/** ⌊√n⌋ by Newton's method. */
export function isqrt(n: bigint): bigint {
  if (n < 2n) return n;
  // Start above the root; Newton then decreases monotonically onto ⌊√n⌋.
  let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2));
  for (;;) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
}

/** The exponent of p in n (n ≠ 0), and what is left. */
export function valuation(n: bigint, p: bigint): [number, bigint] {
  let count = 0;
  let rest = n;
  while (rest % p === 0n) {
    rest /= p;
    count++;
  }
  return [count, rest];
}
