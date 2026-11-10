import { complexGLSL } from "./shader-complex.ts";

// A GLSL ES 3.00 (WebGL2) port of the Hurwitz / generalized-zeta kernel, for GPU evaluation of a
// whole a-grid in parallel (domain coloring, surface plots, an interactive Manipulate). Import
// `zetaGLSL`, prepend it to a fragment shader that supplies a uniform s and a `main`, and call
// `hurwitz(s, a)` or `zetaGen(s, a)` per fragment. Functions whose magnitude can leave f32 range
// come in a `…Log` variant returning (direction, ln|value|) — the pair domain coloring actually
// consumes.
//
// This mirrors the CPU kernel in `hurwitz-zeta.ts` (which stays the source of
// truth). Differences to keep in mind:
//   • f32, with the Euler–Maclaurin sum redone in double-float (df64, an f32 pair) where f32
//     cancels it (below the real axis each term carries exp(Im(s)·arg z) and the sum is far
//     smaller than they are), and `uncertain` set where even that cannot vouch for it. Fine for
//     a phase portrait (~5–6 digits); use the CPU/mpmath path for real accuracy.
//   • Fewer Euler–Maclaurin pairs (8) — later pairs fall below f32 epsilon anyway.
//   • Left of Re(s) = 0 `hurwitz` takes the CPU's Taylor series in a over reflected Riemann
//     zetas, stopping at f32 epsilon; off the real axis (|Im a| past ~½) the direct sum
//     still cancels there, and far worse in f32.
//   • GLSL ES 3.00 gotchas learned here: a function is declared before its first call (the pruner,
//     `shader-prune.ts`, orders the library so); an int never converts to a float implicitly; `%` is
//     undefined on a negative operand (`& 1` takes a parity); there is no `fma`; `input`, `output`
//     and `filter` are reserved words; a dynamically indexed array must be a local `var`, not a `const`.
//
// A minimal host fragment shader looks like:
//   #version 300 es
//   precision highp float;
//   uniform vec2 u_s;
//   out vec4 fragColor;
//   <zetaGLSL>
//   void main() { … hurwitz(u_s, a) … }

// A double as a GLSL double-float (df64) literal: an f32 pair whose sum is the double to 48 bits.
const f32Literal = (x: number): string => x.toPrecision(9);
const dfLiteral = (x: number): string => {
  const hi = Math.fround(x);
  return `vec2(${f32Literal(hi)}, ${f32Literal(Math.fround(x - hi))})`;
};
const dfArray = (name: string, xs: readonly number[]): string =>
  `vec2 ${name}[${xs.length}] = vec2[${xs.length}](${xs.map(dfLiteral).join(", ")});`;
const factorial = (n: number): number => (n < 2 ? 1 : n * factorial(n - 1));
// 1/n!, the Taylor coefficients of exp.
const EXP_TAYLOR = Array.from({ length: 14 }, (_, n) => 1 / factorial(n));
// (−1)ⁱ/(2i+1)! and (−1)ⁱ/(2i)!, those of sin x/x and cos x in x².
const SIN_TAYLOR = Array.from({ length: 9 }, (_, i) => (-1) ** i / factorial(2 * i + 1));
const COS_TAYLOR = Array.from({ length: 9 }, (_, i) => (-1) ** i / factorial(2 * i));
// B₂ₖ/(2k)! for k = 0…8, the Euler–Maclaurin coefficients (k = 0 unused).
const EM_COEFFICIENTS = [
  0,
  1 / 12,
  -1 / 720,
  1 / 30240,
  -1 / 1209600,
  1 / 47900160,
  -691 / 1307674368000,
  1 / 74724249600,
  -3617 / 10670622842880000,
];

export const DF_PLAIN_GLSL = "float dfOpq(float x) { return x; }";
/**
 * dfOpq for a device that folds the two-sums. Fast-math reassociates float arithmetic, so (a + b) - a folds
 * to b, even through a multiply by a runtime 1.0 (Metal, measured); it does not look through integer bits, so
 * x goes through an xor with a 0 the compiler cannot see. Swapped in as text, not branched on a const.
 */
export const DF_OPAQUE_GLSL =
  "float dfOpq(float x) { return uintBitsToFloat(floatBitsToUint(x) ^ (floatBitsToUint(dfOne) ^ 0x3f800000u)); }";

export const zetaGLSL = /* glsl */ `
const int EM_PAIRS = 8;

vec2 cmul(vec2 a, vec2 b) { return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }
vec2 cdiv(vec2 a, vec2 b) {
  float d = dot(b, b);
  return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y) / d;
}
vec2 cexp(vec2 z) {
  float e = exp(z.x);
  return vec2(e*cos(z.y), e*sin(z.y));
}
// arg z in (−π, π], the cut's upper side on the negative real axis. A −0 imaginary part (a conjugate or a
// product with 0, or sin of a multiple of π) reads as +0: SwiftShader's atan(−0, x > 0) is π, a whole
// half turn off on the positive reals.
float argOf(vec2 z) { return atan((z.y == 0.0 ? 0.0 : z.y), z.x); }
vec2 clog(vec2 z) { return vec2(0.5*log(dot(z, z)), argOf(z)); }
vec2 cpow(vec2 z, vec2 w) { return cexp(cmul(w, clog(z))); }

// The rest of the elementary complex functions, for the expression emitter (see
// glsl-complex.ts) — a portrait may colour any expression, not just a special
// function. Principal branches throughout, matching clog's cut on (-∞, 0].
vec2 cneg(vec2 z) { return -z; }
vec2 cconj(vec2 z) { return vec2(z.x, -z.y); }
vec2 csqrt(vec2 z) {
  float r = length(z);
  if (r == 0.0) { return vec2(0.0, 0.0); }
  // The half-angle formulas, with no sin or cos in them: the root of the larger part first, the
  // other from y / 2·root, so neither subtracts nearly equal numbers. The cut's upper side at y = 0.
  if (z.x >= 0.0) {
    float a = sqrt(0.5 * (r + z.x));
    return vec2(a, z.y / (2.0 * a));
  }
  float b = sqrt(0.5 * (r - z.x));
  float s = (z.y >= 0.0 ? 1.0 : -1.0);
  return vec2(abs(z.y) / (2.0 * b), s * b);
}
vec2 csin(vec2 z) { return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y)); }
vec2 ccos(vec2 z) { return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y)); }
vec2 csinh(vec2 z) { return vec2(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y)); }
vec2 ccosh(vec2 z) { return vec2(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y)); }

// Set to 1 by a kernel whose sum is not worth drawing: its terms are far larger than the sum
// itself, so the rounding in them is not small beside it. A host resets it before an expression and
// reads it after (a portrait hatches the pixel); a compute pass may ignore it. Below the real axis
// ζ(s, a) is e^(-Im(s)·|arg a|) times smaller than its terms: f32 gives up at a ratio of 100, df64 at 1e9.
float uncertain = 0.0;

// The largest ratio of an f32 sum's biggest term to the sum still drawn. Measured on the GPU (swiftshader
// f32) against mpmath, ζ(s, a) for s = 1.5 + 4i, 12i, 24i and 0.5 + 8i, a over [-6, 6] × [-6, 6]: a
// point drawn at 100 has relative error 1.2e-4 at the median and 2.6e-2 at most (0.03 rad of phase),
// where the error was about 1.5e-4 times the ratio, so 1e3 would have drawn errors of 0.2 and more.
// Past it hurwitzEM sums again in df64 (where f32 would have hatched 40% of the half plane below the axis
// at s = 1.5 + 4i and 70% at 12i, above it none).
const float SUM_COND_LIMIT = 100.0;

void vouch(float largest, vec2 sum) {
  if (largest > SUM_COND_LIMIT * length(sum)) { uncertain = 1.0; }
}

// The same ratio for the df64 sum. Measured on the GPU (swiftshader) against the double kernel, itself
// checked against mpmath, ζ(s, a) for s = 1.5 + 4i and 12i, a over [-58, 58] × [-32, 0] (the portrait's
// whole zoom range): the relative error of a df64 sum is at most 5.2e-13 times the ratio, so a point
// drawn at 1e9 is good to 5e-4 (3e-4 measured). Past it the sum has under three digits and is hatched:
// at 12i that is where e^(−12·|arg a|) is below 1e-9, a quarter of the lower half at that range.
const float DF_COND_LIMIT = 1e9;

void vouchDf(float largest, vec4 sum) {
  if (largest > DF_COND_LIMIT * length(vec2(sum.x, sum.z))) { uncertain = 1.0; }
}

// ζ(s, a). Euler–Maclaurin, except left of Re(s) = 0 near the real axis short of where its
// direct terms end, which there cancel catastrophically: a shifts by an integer to 1 + h and
// ζ(s, 1 + h) = Σₖ C(−s, k) hᵏ ζ(s + k), with ζ(s + k) from the functional equation left of
// the strip. Mirrors hurwitzZeta in hurwitz-zeta.ts. (n+a)=0 terms are dropped (Wolfram
// HurwitzZeta).
vec2 hurwitz(vec2 s, vec2 a) {
  // ζ(0, a) = 1/2 − a, the (n+a)=0 term kept (hurwitzAtZero in hurwitz-zeta.ts).
  if (s.x == 0.0 && s.y == 0.0) { return vec2(0.5, 0.0) - a; }
  float m = floor(a.x - 0.5);
  vec2 h = vec2(a.x - m - 1.0, a.y);
  if (s.x >= 0.0 || a.x >= 4.0 * emEdge(s) || abs(m) > 96.0 || length(h) > 0.75) { return hurwitzEM(s, a); }
  vec2 z = zetaNearOne(s, h);
  for (int j = 0; j < int(abs(m)); j++) {
    if (m > 0.0) {
      z = z - cpow(vec2(h.x + 1.0 + float(j), a.y), -s);
    } else {
      vec2 b = vec2(a.x + float(j), a.y);
      if (!(b.x == 0.0 && b.y == 0.0)) { z = z + cpow(b, -s); }
    }
  }
  return z;
}

// How far short of emEdge the Euler–Maclaurin tail may start. Measured with the df64 emulation against
// mpmath, ζ(s, a) for s = 1.5 + 4i, 12i, 24i, a over [-30, 10] × [-20, 20]: starting at 0.6 of emEdge the
// sum is good to 2e-4 wherever df64 vouches for it (1e-5 at emEdge itself), at 0.5 to 4e-2 (24i).
const float TAIL_START = 0.75;

float emEdge(vec2 s) { return max(10.0, ceil(abs(s.x) + abs(s.y)) + 5.0); }

// ζ(s, 1 + h) = Σₖ C(−s, k) hᵏ ζ(s + k), |h| < 1; see hurwitzZeta in hurwitz-zeta.ts.
vec2 zetaNearOne(vec2 s, vec2 h) {
  vec2 sum = riemannZeta(s);
  vec2 c = vec2(1.0, 0.0);
  vec2 hk = vec2(1.0, 0.0);
  float largest = length(sum);
  int small = 0;
  for (int k = 1; k < 96; k++) {
    hk = cmul(hk, h);
    if (hk.x == 0.0 && hk.y == 0.0) { break; }
    vec2 f = vec2(-s.x - float(k) + 1.0, -s.y);
    // s = 1 − k, an integer: C(−s, k)·ζ(s + k) → −C(−s, k−1)/k, and the series ends.
    if (f.x == 0.0 && f.y == 0.0) {
      vec2 done = sum - cmul(c, hk) / float(k);
      vouch(largest, done);
      return done;
    }
    c = cmul(c, f) / float(k);
    vec2 t = cmul(cmul(c, hk), riemannZeta(vec2(s.x + float(k), s.y)));
    sum = sum + t;
    largest = max(largest, length(t));
    if (length(t) <= 1e-8 * largest) {
      small = small + 1;
      if (small == 2) { break; }
    } else { small = 0; }
  }
  vouch(largest, sum);
  return sum;
}

vec2 riemannZeta(vec2 s) {
  if (s.x < 0.0) { return reflectedZeta(s); }
  return hurwitzEM(s, vec2(1.0, 0.0));
}

// ζ(s) = 2ˢ πˢ⁻¹ sin(πs/2) Γ(1−s) ζ(1−s) for Re(s) < 0, the factors but ζ(1−s) summed as logs.
vec2 reflectedZeta(vec2 s) {
  vec2 r = vec2(1.0 - s.x, -s.y);
  vec2 lg = 0.6931472 * s + 1.1447299 * vec2(s.x - 1.0, s.y) + clgamma(r) + clogSin(1.5707963 * s);
  return cmul(cexp(lg), hurwitzEM(r, vec2(1.0, 0.0)));
}

// ln sin w up to 2πi, overflow-free: sin w = (i/2)·e^(−iw)·(1 − e^(2iw)) for Im w ≥ 0.
vec2 clogSin(vec2 w0) {
  bool flip = w0.y < 0.0;
  vec2 w = (flip ? cconj(w0) : w0);
  vec2 u = cexp(vec2(-2.0 * w.y, 2.0 * w.x));
  vec2 l = clog(vec2(1.0 - u.x, -u.y)) + vec2(w.y - 0.6931472, 1.5707963 - w.x);
  return (flip ? cconj(l) : l);
}

// lnΓ(z) up to 2πi, for Re(z) > 0: shift to Re ≥ 8, then Stirling to z⁻⁵.
vec2 clgamma(vec2 z0) {
  vec2 z = z0;
  vec2 shift = vec2(0.0);
  for (int k = 0; k < 8 && z.x < 8.0; k++) {
    shift = shift + clog(z);
    z = z + vec2(1.0, 0.0);
  }
  vec2 iz = cdiv(vec2(1.0, 0.0), z);
  vec2 iz2 = cmul(iz, iz);
  vec2 ser = cmul(iz, vec2(0.083333333, 0.0) + cmul(iz2, vec2(-0.0027777778, 0.0) + iz2 * 0.00079365079));
  return cmul(z - vec2(0.5, 0.0), clog(z)) - z + vec2(0.9189385, 0.0) + ser - shift;
}

// Γ(z) for any z. Re(z) < ½ goes through the reflection Γ(z)Γ(1−z) = π / sin(πz), all in
// logs so neither the poles' neighbors nor Γ(1−z) overflow mid-way; the result is clamped
// to e^80, so a pole reads as a huge value (white) rather than NaN. clgamma (shift +
// Stirling) stands in for Lanczos: it is already here and holds ~1e-6 in f32.
vec2 cgamma(vec2 z) {
  if (z.y == 0.0 && z.x <= 0.0 && z.x == floor(z.x)) { return vec2(1e30, 0.0); }
  vec2 lg;
  if (z.x < 0.5) {
    lg = vec2(1.1447299, 0.0) - clogSin(3.1415927 * z) - clgamma(vec2(1.0 - z.x, -z.y));
  } else {
    lg = clgamma(z);
  }
  return cexp(vec2(min(lg.x, 80.0), lg.y));
}

// ζ(s, a) via Euler–Maclaurin.
vec2 hurwitzEM(vec2 s, vec2 a) {
  float em[9] = float[9](
    0.0, 0.08333333, -0.0013888889, 0.000033068783, -0.00000082671958,
    0.000000020876757, -0.00000000052841901, 0.000000000013382537, -0.00000000000033896803);
  int N = int(clamp(ceil(emEdge(s) - a.x), 6.0, 96.0));
  // Far left of the axis the cap of 96 terms ends the direct sum short of where the tail converges: the
  // kernel declines there (see TAIL_START).
  if (a.x + float(N) < TAIL_START * emEdge(s)) { uncertain = 1.0; }
  vec2 negS = -s;
  vec2 sum = vec2(0.0);
  float largest = 0.0;
  for (int k = 0; k < N; k++) {
    vec2 b = vec2(a.x + float(k), a.y);
    if (!(b.x == 0.0 && b.y == 0.0)) {
      vec2 t = cpow(b, negS);
      sum = sum + t;
      largest = max(largest, length(t));
    }
  }
  vec2 z = vec2(a.x + float(N), a.y);
  vec2 zNegS = cpow(z, negS);
  vec2 integral = cdiv(cpow(z, vec2(1.0 - s.x, -s.y)), vec2(s.x - 1.0, s.y));
  largest = max(largest, length(integral));
  sum = sum + integral;
  sum = sum + 0.5 * zNegS;
  vec2 poch = s;
  vec2 zpow = cdiv(zNegS, z);
  vec2 zinv2 = cpow(z, vec2(-2.0, 0.0));
  for (int k = 1; k <= EM_PAIRS; k++) {
    sum = sum + em[k] * cmul(poch, zpow);
    vec2 f1 = vec2(s.x + float(2*k - 1), s.y);
    vec2 f2 = vec2(s.x + float(2*k), s.y);
    poch = cmul(poch, cmul(f1, f2));
    zpow = cmul(zpow, zinv2);
  }
  // The terms dwarf the sum: f32 has cancelled its digits, so sum again in df64, unless the host found
  // this device's arithmetic does not keep an error-free transform exact (DF64 false): f32 hatches it.
  if (DF64 && largest > SUM_COND_LIMIT * length(sum)) { return hurwitzEMDf(s, a, largest); }
  vouch(largest, sum);
  return sum;
}

// A host whose device failed the df64 self-test (df64-selftest.ts) sets this false, and no df64 value is drawn.
const bool DF64 = true;
// 1.0 that a compiler cannot see. A host sets it from a runtime value (the portrait's uniform).
float dfOne = 1.0;
// x. A host whose device folds the two-sums replaces it with DF_OPAQUE_GLSL.
${DF_PLAIN_GLSL}

// ---- df64: a double-float is an f32 pair (hi, lo), hi + lo to 48 bits. A complex df is a vec4 of
// (re.hi, re.lo, im.hi, im.lo). The error of a sum is Knuth's two-sum; of a product, Dekker's split,
// or fma where the split breaks (DF_FMA).
vec2 dfTwoSum(float a, float b) {
  float s = dfOpq(a + b);
  float v = dfOpq(s - a);
  // Both halves opaque: Metal otherwise regroups their sum to (a + b) - s, which is 0.
  return vec2(s, dfOpq(a - dfOpq(s - v)) + dfOpq(b - v));
}
// |a| >= |b|, or a == 0.
vec2 dfFast(float a, float b) {
  float s = dfOpq(a + b);
  return vec2(s, b - dfOpq(s - a));
}
vec2 dfTwoProd(float a, float b) {
  float p = a * b;
  float ta = 4097.0 * a;
  float ah = ta - (ta - a);
  float al = a - ah;
  float tb = 4097.0 * b;
  float bh = tb - (tb - b);
  float bl = b - bh;
  return vec2(p, ((ah * bh - p) + ah * bl + al * bh) + al * bl);
}
vec2 dfAdd(vec2 a, vec2 b) {
  vec2 s = dfTwoSum(a.x, b.x);
  vec2 t = dfTwoSum(a.y, b.y);
  vec2 u = dfFast(s.x, s.y + t.x);
  return dfFast(u.x, u.y + t.y);
}
vec2 dfSub(vec2 a, vec2 b) { return dfAdd(a, -b); }
vec2 dfMul(vec2 a, vec2 b) {
  vec2 p = dfTwoProd(a.x, b.x);
  return dfFast(p.x, p.y + (a.x * b.y + a.y * b.x));
}
vec2 dfMulF(vec2 a, float b) {
  vec2 p = dfTwoProd(a.x, b);
  return dfFast(p.x, p.y + a.y * b);
}
vec2 dfDiv(vec2 a, vec2 b) {
  float q1 = a.x / b.x;
  vec2 r = dfSub(a, dfMulF(b, q1));
  float q2 = r.x / b.x;
  r = dfSub(r, dfMulF(b, q2));
  return dfAdd(dfFast(q1, q2), vec2(r.x / b.x, 0.0));
}

// x = 2ᵏ·eʳ with |r| <= ln 2 / 2, ln 2 in three f32 so that k·ln 2 is exact for the k that matter;
// eʳ by its Taylor series (r¹⁴/14! < 1e-17). 2ᵏ is built from its bits, exact where exp2 is not.
const float LN2_1 = 0.6931471824645996;
const float LN2_2 = -1.9046542121259336e-09;
const float LN2_3 = -8.78318373858934e-17;
vec2 dfExp(vec2 x) {
  if (x.x < -87.0) { return vec2(0.0); }
  if (x.x > 88.0) { return vec2(3.0e38, 0.0); }
  float k = round(x.x * 1.442695);
  vec2 r = dfSub(x, dfTwoProd(k, LN2_1));
  r = dfSub(r, dfTwoProd(k, LN2_2));
  r = dfSub(r, vec2(k * LN2_3, 0.0));
  ${dfArray("c", EXP_TAYLOR)}
  // Past r⁹/9! (< 3e-10) the series is added in f32: its rounding is below 1e-16.
  float q = c[13].x;
  for (int i = 12; i >= 9; i--) { q = q * r.x + c[i].x; }
  vec2 p = vec2(q, 0.0);
  for (int i = 8; i >= 0; i--) { p = dfAdd(dfMul(p, r), c[i]); }
  return p * uintBitsToFloat(uint(int(k) + 127) << 23u);
}

// ln v for v > 0: one Newton step on eʸ = v from the f32 log, y₁ = y₀ + w − w²/2 for w = v·e^(−y₀) − 1.
vec2 dfLog(vec2 v) {
  float y0 = log(v.x);
  vec2 w = dfSub(dfMul(v, dfExp(vec2(-y0, 0.0))), vec2(1.0, 0.0));
  return dfSub(dfAdd(vec2(y0, 0.0), w), 0.5 * dfMul(w, w));
}

// (sin x, cos x) as a vec4 of pairs: x = j·π/2 + r with |r| <= π/4, π/2 in three f32, then the
// Taylor series of sin and cos in r² (r¹⁷/17! < 1e-16).
const float PIO2_1 = 1.5707963705062866;
const float PIO2_2 = -4.371138828673793e-08;
const float PIO2_3 = -1.7151245100058819e-15;
vec4 dfSinCos(vec2 x) {
  float j = round(x.x * 0.63661975);
  vec2 r = dfSub(x, dfTwoProd(j, PIO2_1));
  r = dfSub(r, dfTwoProd(j, PIO2_2));
  r = dfSub(r, vec2(j * PIO2_3, 0.0));
  vec2 r2 = dfMul(r, r);
  ${dfArray("sc", SIN_TAYLOR)}
  ${dfArray("cc", COS_TAYLOR)}
  // From the r¹³/13! term on (< 1e-11) the series is added in f32.
  float qs = sc[8].x;
  float qc = cc[8].x;
  for (int i = 7; i >= 6; i--) {
    qs = qs * r2.x + sc[i].x;
    qc = qc * r2.x + cc[i].x;
  }
  vec2 ps = vec2(qs, 0.0);
  vec2 pc = vec2(qc, 0.0);
  for (int i = 5; i >= 0; i--) {
    ps = dfAdd(dfMul(ps, r2), sc[i]);
    pc = dfAdd(dfMul(pc, r2), cc[i]);
  }
  vec2 s = dfMul(ps, r);
  switch (int(j) & 3) {
    case 0: { return vec4(s, pc); }
    case 1: { return vec4(pc, -s); }
    case 2: { return vec4(-s, -pc); }
    default: { return vec4(-pc, s); }
  }
}

// arg(x + iy) in (−π, π]: the f32 angle θ₁, then θ = θ₁ + atan(tan(θ − θ₁)) for tan(θ − θ₁) = d from
// (x, y) rotated by θ₁, with atan d = d − d³/3 (d is about 1e-7).
vec2 dfArg(vec2 x, float y) {
  float th1 = atan((y == 0.0 ? 0.0 : y), x.x);
  vec4 sc = dfSinCos(vec2(th1, 0.0));
  vec2 d = dfDiv(dfSub(dfMulF(sc.zw, y), dfMul(x, sc.xy)), dfAdd(dfMul(x, sc.zw), dfMulF(sc.xy, y)));
  return dfSub(dfAdd(vec2(th1, 0.0), d), dfMul(dfMul(d, d), d) / 3.0);
}

vec4 dfcMul(vec4 a, vec4 b) {
  return vec4(
    dfSub(dfMul(a.xy, b.xy), dfMul(a.zw, b.zw)),
    dfAdd(dfMul(a.xy, b.zw), dfMul(a.zw, b.xy)));
}
vec4 dfcAdd(vec4 a, vec4 b) { return vec4(dfAdd(a.xy, b.xy), dfAdd(a.zw, b.zw)); }
vec4 dfcDiv(vec4 a, vec4 b) {
  vec2 d = dfAdd(dfMul(b.xy, b.xy), dfMul(b.zw, b.zw));
  return vec4(
    dfDiv(dfAdd(dfMul(a.xy, b.xy), dfMul(a.zw, b.zw)), d),
    dfDiv(dfSub(dfMul(a.zw, b.xy), dfMul(a.xy, b.zw)), d));
}

// z^w = e^(w·ln z) for z = zr + i·zi (zr a pair, zi an f32, not both 0) and w a complex df.
vec4 dfcPow(vec2 zr, float zi, vec4 w) {
  vec2 re = 0.5 * dfLog(dfAdd(dfMul(zr, zr), dfTwoProd(zi, zi)));
  vec2 im = dfArg(zr, zi);
  vec2 m = dfExp(dfSub(dfMul(w.xy, re), dfMul(w.zw, im)));
  vec4 sc = dfSinCos(dfAdd(dfMul(w.xy, im), dfMul(w.zw, re)));
  return vec4(dfMul(m, sc.zw), dfMul(m, sc.xy));
}

// hurwitzEM again with df64 for a sum f32 has cancelled away, largest0 the f32 pass's biggest term.
// The terms are the same, so is the cut N (a larger one does not help: the sum's digits go to the
// rounding of its terms, not to the Euler–Maclaurin tail). A term under TERM_F32_FRACTION of the
// biggest rounds in f32 below df64's own error and is summed as it is. vouchDf hatches what df64
// cannot vouch for.
const float TERM_F32_FRACTION = 1e-9;
vec2 hurwitzEMDf(vec2 s, vec2 a, float largest0) {
  ${dfArray("em", EM_COEFFICIENTS)}
  int N = int(clamp(ceil(emEdge(s) - a.x), 6.0, 96.0));
  vec4 negS = vec4(-s.x, 0.0, -s.y, 0.0);
  vec4 sum = vec4(0.0);
  float largest = 0.0;
  for (int k = 0; k < N; k++) {
    float bx = a.x + float(k);
    if (bx == 0.0 && a.y == 0.0) { continue; }
    // |b^(−s)| = e^(−σ·ln|b| + t·arg b) for s = σ + it.
    bool small = exp(-0.5 * s.x * log(bx * bx + a.y * a.y) + s.y * argOf(vec2(bx, a.y))) <= TERM_F32_FRACTION * largest0;
    if (small) {
      vec2 t = cpow(vec2(bx, a.y), -s);
      sum = dfcAdd(sum, vec4(t.x, 0.0, t.y, 0.0));
      continue;
    }
    vec4 t = dfcPow(dfTwoSum(a.x, float(k)), a.y, negS);
    sum = dfcAdd(sum, t);
    largest = max(largest, length(vec2(t.x, t.z)));
  }
  vec2 z = dfTwoSum(a.x, float(N));
  vec4 zNegS = dfcPow(z, a.y, negS);
  // z^(1−s) / (s − 1)
  vec2 sm1 = dfTwoSum(s.x, -1.0);
  vec4 integral = dfcDiv(dfcPow(z, a.y, vec4(-sm1, -s.y, 0.0)), vec4(sm1, s.y, 0.0));
  largest = max(largest, length(vec2(integral.x, integral.z)));
  sum = dfcAdd(dfcAdd(sum, integral), 0.5 * zNegS);
  vec2 zn = dfAdd(dfMul(z, z), dfTwoProd(a.y, a.y));
  vec4 zinv = vec4(dfDiv(z, zn), dfDiv(vec2(-a.y, 0.0), zn));
  vec4 zpow = dfcMul(zNegS, zinv);
  vec4 zinv2 = dfcMul(zinv, zinv);
  vec4 poch = vec4(s.x, 0.0, s.y, 0.0);
  // The first pairs are 1e-2 and 1e-4 of z^(−s); from the third (< 1e-6) the tail rounds in f32 below df64's error.
  for (int k = 1; k <= 2; k++) {
    vec4 t = dfcMul(poch, zpow);
    sum = dfcAdd(sum, vec4(dfMul(em[k], t.xy), dfMul(em[k], t.zw)));
    vec4 f1 = vec4(dfTwoSum(s.x, float(2*k - 1)), s.y, 0.0);
    vec4 f2 = vec4(dfTwoSum(s.x, float(2*k)), s.y, 0.0);
    poch = dfcMul(poch, dfcMul(f1, f2));
    zpow = dfcMul(zpow, zinv2);
  }
  vec2 pochF = vec2(poch.x, poch.z);
  vec2 zpowF = vec2(zpow.x, zpow.z);
  vec2 zinv2F = vec2(zinv2.x, zinv2.z);
  vec2 tail = vec2(0.0);
  for (int k = 3; k <= EM_PAIRS; k++) {
    tail = tail + em[k].x * cmul(pochF, zpowF);
    vec2 f1 = vec2(s.x + float(2*k - 1), s.y);
    vec2 f2 = vec2(s.x + float(2*k), s.y);
    pochF = cmul(pochF, cmul(f1, f2));
    zpowF = cmul(zpowF, zinv2F);
  }
  sum = dfcAdd(sum, vec4(tail.x, 0.0, tail.y, 0.0));
  vouchDf(largest, sum);
  return vec2(sum.x, sum.z);
}

// Wolfram generalized zeta: crossed terms ((n+a)^2)^(-s/2), the (n+a)=0 slot dropped
// (finite at a = 0, -1, -2, …, unlike hurwitz).
vec2 zetaGen(vec2 s, vec2 a0) {
  if (s.x == 0.0 && s.y == 0.0) { return hurwitz(s, a0); }
  vec2 a = a0;
  vec2 acc = vec2(0.0);
  int guard = 0;
  for (;;) {
    if (a.x >= 0.0 || guard > 96) { break; }
    acc = acc + cpow(cmul(a, a), -0.5 * s);
    a = a + vec2(1.0, 0.0);
    guard = guard + 1;
  }
  if (a.x == 0.0 && a.y == 0.0) { a = vec2(1.0, 0.0); }
  return acc + hurwitz(s, a);
}

// Lerch transcendent Φ(z, s, a) = Σ zⁿ (n+a)^(−s), direct series. Converges for
// |z| < 1 (bounded iteration count on the GPU); z = 1 falls through to hurwitz.
vec2 lerchPhi(vec2 z, vec2 s, vec2 a) {
  if (z.x == 1.0 && z.y == 0.0) { return hurwitz(s, a); }
  vec2 negS = -s;
  vec2 sum = vec2(0.0);
  vec2 zp = vec2(1.0, 0.0);
  for (int n = 0; n < 4096; n++) {
    vec2 base = vec2(a.x + float(n), a.y);
    if (!(base.x == 0.0 && base.y == 0.0)) { sum = sum + cmul(zp, cpow(base, negS)); }
    zp = cmul(zp, z);
    if (dot(zp, zp) < 1e-30) { break; }
  }
  return sum;
}

// Largest |Im Φ| / |Re Φ| still read as real in f32. Measured by scripts/lerch-real-tol.ts
// (f32 emulation of lerchPhi, mpmath for the true values) on z ∈ {±0.9, ±0.5, 0}, a ∈ [-7.9, 8],
// s ∈ [-12, 16] for the real cases and s ∈ [-6.45, 8] for the complex ones:
//   • noise, the spurious ratio on real Φ (a < 0, integer s; worst at z = -0.9, where Re cancels):
//     max 2.7e-5 with correctly rounded transcendentals, 8.9e-5 at ±2 ulp, 1.6e-4 at ±8 ulp;
//   • signal, the true ratio where Φ is complex (a < 0, non-integer s): as low as 3e-12, since
//     Im comes from the few terms with n + a < 0 while Re sums the whole positive tail.
// They overlap: no threshold separates them, and 8% of the complex grid is under 1e-4. Pick
// above the noise (3.4x the ±2 ulp max) and no higher, so the overlap errs towards NaN, a hole,
// rather than a wrong real. A complex point drawn real is off by < tol in Im/Re (|Φ| vs Re by
// tol²/2), so the overlap is benign; a declined real point is a hole in the plot.
const float LERCH_REAL_TOL = 3e-4;

// Φ for real arguments: the real value, or NaN (no real value) where Φ is complex.
// The NaN is built from w's bits: a literal NaN is const-evaluated, which some compilers reject.
float lerchPhiReal(vec2 z, vec2 s, vec2 a) {
  vec2 w = lerchPhi(z, s, a);
  if (abs(w.y) > LERCH_REAL_TOL * abs(w.x)) { return uintBitsToFloat(floatBitsToUint(w.x) | 0x7fc00000u); }
  return w.x;
}

// Polylogarithm Liₛ(z) = z·Φ(z, s, 1). Same |z| < 1 limit as lerchPhi.
vec2 polyLog(vec2 s, vec2 z) { return cmul(z, lerchPhi(z, s, vec2(1.0, 0.0))); }

// Polygamma ψ⁽ᵐ⁾(z) = (−1)^(m+1) m! ζ(m+1, z), integer m ≥ 2; orders 0 and 1 are the digamma and
// trigamma kernels (ζ(1, z) is a pole), a negative order declines. ψ⁽ᵐ⁾(1) ≈ m!, which
// leaves f32 range past m = 34, so high orders saturate to inf here — that is the
// value itself overflowing, not a loss of precision. Use polygammaLog to plot them.
vec2 polygamma(vec2 m, vec2 z) {
  int n = int(round(m.x));
  if (n < 0 || m.y != 0.0 || m.x != round(m.x)) { uncertain = 1.0; }
  if (n <= 0) { return cdigamma(z); }
  if (n == 1) { return ctrigamma(z); }
  float fact = 1.0;
  for (int k = 2; k <= n; k++) { fact = fact * float(k); }
  float sgn = ((n & 1) == 1 ? 1.0 : -1.0);
  return sgn * fact * hurwitz(vec2(float(n) + 1.0, 0.0), z);
}

// ψ⁽ᵐ⁾(z) split into phase and log-magnitude: xy is the unit direction, z is
// ln|ψ⁽ᵐ⁾(z)|. The m! that overflows above enters additively here as ln(m!), so every
// order stays representable — domain coloring wants exactly this pair (hue from the
// direction, brightness from a compressed log-magnitude), so nothing is lost.
//
// What still bounds a high order is ζ(m+1, z) itself overflowing f32 near a pole
// (|ζ| ~ |z|^-(m+1) there), which reads as a small blown-out disc around each pole
// rather than, as before, a white frame.
vec3 polygammaLog(vec2 m, vec2 z) {
  int n = int(round(m.x));
  float lnFact = 0.0;
  for (int k = 2; k <= n; k++) { lnFact = lnFact + log(float(k)); }
  vec2 h = hurwitz(vec2(float(n) + 1.0, 0.0), z);
  float mag = max(length(h), 1e-30);
  float sgn = ((n & 1) == 1 ? 1.0 : -1.0);
  return vec3(sgn * h / mag, log(mag) + lnFact);
}

// Iterated quadratic maps. Not special functions, and this is not their permanent home
// (graphics objects have no package of their own yet) -- they live here because this is
// the shared GLSL preamble every GPU layer already gets.
//
// Both return the n-th iterate itself rather than an escape count, which is the honest
// complex-valued object: colouring it gives the familiar picture, because the exterior
// blows up (white) while the interior stays bounded (coloured by where it settles).
// n is clamped, since a shader cannot be trusted with an unbounded loop.
vec2 iterateQuadratic(vec2 z0, vec2 c, float n) {
  int steps = int(clamp(round(n), 1.0, 512.0));
  vec2 z = z0;
  for (int i = 0; i < steps; i++) {
    z = cmul(z, z) + c;
    // Once it has escaped it only overflows; stop and let the magnitude speak.
    if (dot(z, z) > 1e12) { break; }
  }
  return z;
}

// Mandelbrot: iterate from 0, and let the *parameter* be the plane.
vec2 mandelbrot(vec2 c, vec2 n) { return iterateQuadratic(vec2(0.0, 0.0), c, n.x); }

// Julia: iterate from the point, holding the parameter fixed.
vec2 julia(vec2 z, vec2 c, vec2 n) { return iterateQuadratic(z, c, n.x); }

// The same (direction, log-magnitude) pair for a value that is already in range —
// so a portrait can colour every function through one path.
// The magnitude is taken off the larger part first: length(v) squares, so it overflows at 1e19 and
// would read a value like G(−5.3 + 4i) = 1e28 as a pole (white).
vec3 clogPolar(vec2 v) {
  float big = max(abs(v.x), abs(v.y));
  if (!(big > 1e-30)) { return vec3(0.0, 0.0, log(1e-30)); }
  vec2 u = v / big;
  float unit = length(u);
  return vec3(u / unit, log(big) + log(unit));
}
${complexGLSL}`;

export { reachableGLSL, withGLSL } from "./shader-prune.ts";
