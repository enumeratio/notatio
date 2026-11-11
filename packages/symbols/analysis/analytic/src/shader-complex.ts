// Complex GLSL kernels for the expression emitter (`glsl-complex.ts`), appended to `zetaGLSL`:
// the elementary functions the first set left out, the gamma family, and the Dirichlet series
// built on the zeta kernel. All f32, and each declines (sets `uncertain`, which a portrait
// hatches) where it cannot vouch for its digits instead of painting them.
//
// Every principal branch follows compute-engine's: cuts on (−∞, 0], the upper side taken on the
// cut itself (atan(+0, x<0) = +π), so `Log(−2)` is ln 2 / ln 10 + iπ / ln 10 on both.

export const complexGLSL = /* glsl */ `
const float LN10_INV = 0.43429448;

// Logarithms: Log is base 10 (compute-engine's default), Ln natural.
vec2 clog10(vec2 z) { return clog(z) * LN10_INV; }
vec2 clogBase(vec2 z, vec2 b) { return cdiv(clog(z), clog(b)); }

vec2 cre(vec2 z) { return vec2(z.x, 0.0); }
vec2 cim(vec2 z) { return vec2(z.y, 0.0); }
vec2 carg(vec2 z) { return vec2(argOf(z), 0.0); }
vec2 cabs(vec2 z) { return vec2(length(z), 0.0); }

// tan z = (sin x cos x + i sinh y cosh y) / (cos²x + sinh²y): no difference of nearly equal terms
// near the poles at π/2 + kπ. Past |y| = 20 it is ±i to f32 (error e^-40).
vec2 ctan(vec2 z) {
  if (abs(z.y) > 20.0) { return vec2(0.0, (z.y > 0.0 ? 1.0 : -1.0)); }
  float c = cos(z.x);
  float sh = sinh(z.y);
  return vec2(sin(z.x) * c, sh * cosh(z.y)) / (c * c + sh * sh);
}

// tanh z = (sinh x cosh x + i sin y cos y) / (sinh²x + cos²y).
vec2 ctanh(vec2 z) {
  if (abs(z.x) > 20.0) { return vec2((z.x > 0.0 ? 1.0 : -1.0), 0.0); }
  float c = cos(z.y);
  float sh = sinh(z.x);
  return vec2(sh * cosh(z.x), sin(z.y) * c) / (sh * sh + c * c);
}

// cot z = (sin x cos x − i sinh y cosh y) / (sin²x + sinh²y), the same guard as ctan.
vec2 ccot(vec2 z) {
  if (abs(z.y) > 20.0) { return vec2(0.0, (z.y > 0.0 ? -1.0 : 1.0)); }
  float s = sin(z.x);
  float sh = sinh(z.y);
  return vec2(s * cos(z.x), -sh * cosh(z.y)) / (s * s + sh * sh);
}

// sin z / z. Below |z| = 1e-3 the series 1 − z²/6 (error 1e-12); sin overflows f32 past |y| = 88.
vec2 csinc(vec2 z) {
  if (dot(z, z) < 1e-6) { return vec2(1.0, 0.0) - cmul(z, z) / 6.0; }
  if (abs(z.y) > 80.0) { uncertain = 1.0; }
  return cdiv(csin(z), z);
}

// Most steps a shift by one takes before a gamma-family kernel declines; reaches Re z = -40.
const int GAMMA_SHIFTS = 40;

// ln Γ(z) on the branch analytic off the negative real axis (Wolfram LogGamma, mpmath loggamma):
// ln Γ(z) = ln Γ(z + n) − Σ ln(z + k), each ln principal, which is continuous across the left half
// plane because every z + k stays off the cut together with z.
vec2 cloggamma(vec2 z0) {
  vec2 z = z0;
  vec2 shift = vec2(0.0);
  for (int k = 0; k < GAMMA_SHIFTS && z.x < 0.5; k++) {
    shift = shift + clog(z);
    z = z + vec2(1.0, 0.0);
  }
  if (z.x < 0.5) { uncertain = 1.0; }
  return clgamma(z) - shift;
}

// ln of Γ(z) itself, the principal logarithm of the value (compute-engine GammaLn): the imaginary
// part wrapped into (−π, π]. f32 holds the wrap to 1e-4 up to |Im ln Γ| of 1000.
vec2 cgammaln(vec2 z) {
  vec2 l = cloggamma(z);
  if (abs(l.y) > 1000.0) { uncertain = 1.0; }
  return vec2(l.x, l.y - 6.2831853 * round(l.y / 6.2831853));
}

// e^l with a result past e^80 clamped, as cgamma reads a pole: a huge value, white in a portrait.
vec2 cexpClamped(vec2 l) { return cexp(vec2(min(l.x, 80.0), l.y)); }

// ψ(z) for Re z ≥ ½: ψ(z) = ψ(z + n) − Σ 1/(z + k), then ln w − 1/2w − 1/12w² + 1/120w⁴ − 1/252w⁶
// at Re w ≥ 8, whose next term is under 1e-9.
vec2 cdigammaRight(vec2 z0) {
  vec2 z = z0;
  vec2 shift = vec2(0.0);
  for (int k = 0; k < 12 && z.x < 8.0; k++) {
    shift = shift + cdiv(vec2(1.0, 0.0), z);
    z = z + vec2(1.0, 0.0);
  }
  vec2 iz = cdiv(vec2(1.0, 0.0), z);
  vec2 iz2 = cmul(iz, iz);
  vec2 ser = cmul(iz2, vec2(-0.083333333, 0.0) + cmul(iz2, vec2(0.0083333333, 0.0) + iz2 * -0.0039682540));
  return clog(z) - 0.5 * iz + ser - shift;
}

// ψ(z); Re z < ½ by the reflection ψ(z) = ψ(1 − z) − π cot πz.
vec2 cdigamma(vec2 z) {
  if (z.x >= 0.5) { return cdigammaRight(z); }
  return cdigammaRight(vec2(1.0 - z.x, -z.y)) - 3.1415927 * ccot(3.1415927 * z);
}

// ψ'(z) for Re z ≥ ½: ψ'(z) = ψ'(z + n) + Σ 1/(z + k)², then 1/w + 1/2w² + 1/6w³ − 1/30w⁵ + 1/42w⁷
// − 1/30w⁹ at Re w ≥ 8.
vec2 ctrigammaRight(vec2 z0) {
  vec2 z = z0;
  vec2 shift = vec2(0.0);
  for (int k = 0; k < 12 && z.x < 8.0; k++) {
    vec2 i = cdiv(vec2(1.0, 0.0), z);
    shift = shift + cmul(i, i);
    z = z + vec2(1.0, 0.0);
  }
  vec2 iz = cdiv(vec2(1.0, 0.0), z);
  vec2 iz2 = cmul(iz, iz);
  // 1/w · (1 + 1/2w + 1/6w² − 1/30w⁴ + 1/42w⁶ − 1/30w⁸)
  return cmul(iz, vec2(1.0, 0.0) + 0.5 * iz + cmul(iz2, vec2(0.16666667, 0.0)
    + cmul(iz2, vec2(-0.033333333, 0.0) + cmul(iz2, vec2(0.023809524, 0.0) - 0.033333333 * iz2)))) + shift;
}

// ψ'(z); Re z < ½ by ψ'(z) = π² / sin² πz − ψ'(1 − z). The first term is e^(-2π|y|) small past |y| = 4.
vec2 ctrigamma(vec2 z) {
  if (z.x >= 0.5) { return ctrigammaRight(z); }
  vec2 refl = vec2(0.0);
  if (abs(z.y) < 6.0) {
    vec2 s = csin(3.1415927 * z);
    refl = cdiv(vec2(9.8696044, 0.0), cmul(s, s));
  }
  return refl - ctrigammaRight(vec2(1.0 - z.x, -z.y));
}

// (a)_z = Γ(a + z) / Γ(a), as the exponential of a difference of ln Γ.
vec2 cpochhammer(vec2 a, vec2 z) {
  return cexpClamped(cloggamma(a + z) - cloggamma(a));
}

// C(n, k) = Γ(n + 1) / (Γ(k + 1) Γ(n − k + 1)). A negative integer n is a pole of Γ(n + 1) the
// generic formula cannot take a limit of, so it declines.
vec2 cbinomial(vec2 n, vec2 k) {
  if (n.y == 0.0 && n.x < 0.0 && n.x == floor(n.x)) { uncertain = 1.0; }
  vec2 one = vec2(1.0, 0.0);
  return cexpClamped(cloggamma(n + one) - cloggamma(k + one) - cloggamma(n - k + one));
}

// e^w − 1 without the cancellation near w = 0: the series below |w| = ½ (8 terms, error 1e-10).
vec2 cexpm1(vec2 w) {
  if (dot(w, w) >= 0.25) { return cexp(w) - vec2(1.0, 0.0); }
  vec2 t = vec2(1.0, 0.0);
  for (int k = 8; k >= 2; k--) { t = vec2(1.0, 0.0) + cmul(w, t) / float(k); }
  return cmul(w, t);
}

// ζ(s) within ½ of its pole: 1/δ + Σ (−1)ⁿ γₙ δⁿ / n!, δ = s − 1, with the Stieltjes constants γₙ
// (n ≤ 7, the next term is under 1e-10 at |δ| = ½). The Euler–Maclaurin sum loses the pole's digits.
vec2 czetaLaurent(vec2 d) {
  vec2 t = vec2(1.0462095e-7, 0.0);
  t = cmul(d, t) + vec2(-3.3162409e-7, 0.0);
  t = cmul(d, t) + vec2(-6.6110318e-6, 0.0);
  t = cmul(d, t) + vec2(9.689042e-5, 0.0);
  t = cmul(d, t) + vec2(-3.4230574e-4, 0.0);
  t = cmul(d, t) + vec2(-4.8451816e-3, 0.0);
  t = cmul(d, t) + vec2(0.072815845, 0.0);
  t = cmul(d, t) + vec2(0.57721566, 0.0);
  return cdiv(vec2(1.0, 0.0), d) + t;
}

vec2 czeta(vec2 s) {
  vec2 d = s - vec2(1.0, 0.0);
  if (dot(d, d) < 0.25) { return czetaLaurent(d); }
  return riemannZeta(s);
}

// η(s) = (1 − 2^(1−s)) ζ(s) = −expm1((1 − s) ln 2) ζ(s): the zero of the first factor cancels ζ's pole.
vec2 cdirichletEta(vec2 s) {
  vec2 w = 0.69314718 * vec2(1.0 - s.x, -s.y);
  return -cmul(cexpm1(w), czeta(s));
}

// β(s) = 4^(−s) (ζ(s, ¼) − ζ(s, ¾)).
vec2 cdirichletBeta(vec2 s) {
  vec2 d = hurwitz(s, vec2(0.25, 0.0)) - hurwitz(s, vec2(0.75, 0.0));
  return cmul(cexp(-1.3862944 * s), d);
}

// --- the error function, by the Faddeeva function ---------------------------------------------
// w(z) = e^(−z²) erfc(−iz) for Im z ≥ 0 by Weideman's rational approximation (SIAM J. Numer. Anal.
// 31, 1994), N = 20, L = √(N/√2): with Z = (L + iz)/(L − iz), w = 2 p(Z)/(L − iz)² + 1/(√π (L − iz)),
// p the degree-19 polynomial whose coefficients are the FFT of e^(−t²)(L² + t²) sampled at
// t = L tan(θ/2). Relative error 1.4e-8 over the whole upper half plane (f64, against scipy's
// wofz), so in f32 the evaluation, not the approximation, sets the digits. No series cancels, and
// no loop: the cost does not grow with |z|.
vec2 cwUpper(vec2 z) {
  float a[20] = float[20](
    -1.474273119e-08, -1.487191316e-07, 7.423415996e-08, 9.520915118e-07, -6.512434156e-08,
    -6.451117612e-06, -5.111169445e-06, 4.145751721e-05, 9.814581811e-05, -1.611300969e-04,
    -1.192821015e-03, -1.730724097e-03, 6.026110195e-03, 4.298428388e-02, 1.457515759e-01,
    3.570412560e-01, 7.008013310e-01, 1.152063412e+00, 1.623208133e+00, 1.985300977e+00);
  float L = 3.7606031;
  vec2 d = vec2(L + z.y, -z.x);
  vec2 big = cdiv(vec2(L - z.y, z.x), d);
  vec2 p = vec2(a[0], 0.0);
  for (int i = 1; i < 20; i++) { p = cmul(p, big) + vec2(a[i], 0.0); }
  return cdiv(2.0 * p, cmul(d, d)) + cdiv(vec2(0.56418958, 0.0), d);
}

// e^(−z²), declining where it leaves f32 (the value itself would, past e^88).
vec2 cexpNegSquare(vec2 z) {
  float e = z.y * z.y - z.x * z.x;
  if (e > 80.0) { uncertain = 1.0; }
  return cexp(vec2(e, -2.0 * z.x * z.y));
}

// erfc z = e^(−z²) w(iz) for Re z ≥ 0; erfc z = 2 − erfc(−z) left of it.
vec2 cerfcRight(vec2 z) { return cmul(cexpNegSquare(z), cwUpper(vec2(-z.y, z.x))); }

vec2 cerfc(vec2 z) {
  if (z.x >= 0.0) { return cerfcRight(z); }
  return vec2(2.0, 0.0) - cerfcRight(-z);
}

// erf z = (2/√π) z Σ (−z²)ⁿ / (n! (2n+1)) below |z| = 1, where 1 − erfc would lose the digits of a
// small value; 1 − erfc(z) for Re z ≥ 0 beyond it; odd, so Re z < 0 reflects.
vec2 cerf(vec2 z0) {
  bool flip = z0.x < 0.0;
  vec2 z = (flip ? -z0 : z0);
  vec2 r;
  if (dot(z, z) < 1.0) {
    vec2 u = -cmul(z, z);
    vec2 term = vec2(1.0, 0.0);
    vec2 sum = vec2(1.0, 0.0);
    for (int n = 1; n < 14; n++) {
      term = cmul(term, u) / float(n);
      sum = sum + term / float(2 * n + 1);
    }
    r = 1.1283792 * cmul(z, sum);
  } else {
    r = vec2(1.0, 0.0) - cerfcRight(z);
  }
  return (flip ? -r : r);
}

// erfi z = −i erf(iz).
vec2 cerfi(vec2 z) {
  vec2 a = cerf(vec2(-z.y, z.x));
  return vec2(a.y, -a.x);
}

// Fresnel integrals, C(z) = (1−i)/4 (erf(az) + i erf(āz)), S(z) = (1+i)/4 (erf(az) − i erf(āz)),
// a = (1+i)√π/2; below |z| = 1 their Maclaurin series, because S's erf terms cancel to order z³.
vec2 cfresnelC(vec2 z) {
  if (dot(z, z) < 1.0) {
    vec2 u = -2.4674011 * cmul(cmul(z, z), cmul(z, z)); // −(π/2)² z⁴
    vec2 term = vec2(1.0, 0.0);
    vec2 sum = vec2(1.0, 0.0);
    for (int n = 1; n < 10; n++) {
      term = cmul(term, u) / float((2 * n - 1) * (2 * n));
      sum = sum + term / float(4 * n + 1);
    }
    return cmul(z, sum);
  }
  vec2 e = cerf(0.88622693 * cmul(vec2(1.0, 1.0), z));
  vec2 f = cerf(0.88622693 * cmul(vec2(1.0, -1.0), z));
  return cmul(vec2(0.25, -0.25), e + vec2(-f.y, f.x));
}

vec2 cfresnelS(vec2 z) {
  if (dot(z, z) < 1.0) {
    vec2 u = -2.4674011 * cmul(cmul(z, z), cmul(z, z));
    vec2 term = vec2(1.0, 0.0);
    vec2 sum = vec2(1.0 / 3.0, 0.0);
    for (int n = 1; n < 10; n++) {
      term = cmul(term, u) / float((2 * n) * (2 * n + 1));
      sum = sum + term / float(4 * n + 3);
    }
    return 1.5707963 * cmul(cmul(z, cmul(z, z)), sum);
  }
  vec2 e = cerf(0.88622693 * cmul(vec2(1.0, 1.0), z));
  vec2 f = cerf(0.88622693 * cmul(vec2(1.0, -1.0), z));
  return cmul(vec2(0.25, 0.25), e - vec2(-f.y, f.x));
}

// --- the exponential integral E1 and what is built on it --------------------------------------
const float EULER_GAMMA = 0.5772157;

// E1(z) = −γ − ln z − Σ (−z)ᵏ / (k·k!). Short of |z| = 2.5 it cancels mildly; in the wedge left of
// the imaginary axis (Re z < −0.6|z|) its terms all point one way and nothing cancels. Declines at
// its cap or where the terms outweigh the sum (vouch).
vec2 cE1Series(vec2 z) {
  vec2 base = -clog(z) - vec2(EULER_GAMMA, 0.0);
  vec2 mz = -z;
  vec2 term = vec2(1.0, 0.0);
  vec2 sum = base;
  float largest = length(base);
  int small = 0;
  bool converged = false;
  for (int k = 1; k <= 100; k++) {
    term = cmul(term, mz) / float(k);
    vec2 t = term / float(k);
    sum = sum - t;
    largest = max(largest, length(t));
    if (length(t) <= 1e-8 * largest) {
      small = small + 1;
      if (small == 2) { converged = true; break; }
    } else { small = 0; }
  }
  if (!converged) { uncertain = 1.0; }
  vouch(largest, sum);
  return sum;
}

// E1(z) = e^(−z) / (z + 1 − 1²/(z + 3 − 2²/(z + 5 − …))), modified Lentz; converges for |arg z| < π,
// fast away from the negative axis. Declines at 100 steps.
vec2 cE1Fraction(vec2 z) {
  vec2 b = z + vec2(1.0, 0.0);
  vec2 c = vec2(1e30, 0.0);
  vec2 d = cdiv(vec2(1.0, 0.0), b);
  vec2 h = d;
  bool converged = false;
  for (int i = 1; i <= 100; i++) {
    float an = -float(i * i);
    b = b + vec2(2.0, 0.0);
    d = cdiv(vec2(1.0, 0.0), an * d + b);
    c = b + an * cdiv(vec2(1.0, 0.0), c);
    vec2 del = cmul(c, d);
    h = cmul(h, del);
    if (length(del - vec2(1.0, 0.0)) < 3e-7) { converged = true; break; }
  }
  if (!converged) { uncertain = 1.0; }
  return cmul(cexp(-z), h);
}

vec2 cE1(vec2 z) {
  float r = length(z);
  if (r < 2.5 || (z.x < 0.0 && -z.x > 0.6 * r)) { return cE1Series(z); }
  return cE1Fraction(z);
}

// +1 above the real axis and on its negative half (the upper side of the cut), −1 elsewhere.
float upperSide(vec2 z) { return (z.y > 0.0 || (z.y == 0.0 && z.x < 0.0) ? 1.0 : -1.0); }

// Ei(z) = −E1(−z) + iπ·s (compute-engine and mpmath: cut on (−∞, 0], analytic elsewhere).
vec2 cei(vec2 z) { return -cE1(-z) + vec2(0.0, 3.1415927 * upperSide(z)); }

// Shi(z) = Σ z^(2k+1) / ((2k+1)(2k+1)!) below |z| = 3, else (E1(z) − E1(−z))/2 + iπs/2.
vec2 cshi(vec2 z) {
  if (dot(z, z) < 9.0) {
    vec2 z2 = cmul(z, z);
    vec2 term = z;
    vec2 sum = z;
    float largest = length(z);
    for (int k = 1; k < 14; k++) {
      term = cmul(term, z2) / float((2 * k) * (2 * k + 1));
      vec2 t = term / float(2 * k + 1);
      sum = sum + t;
      largest = max(largest, length(t));
    }
    vouch(largest, sum);
    return sum;
  }
  return 0.5 * (cE1(z) - cE1(-z)) + vec2(0.0, 1.5707963 * upperSide(z));
}

// Si(z) = −i Shi(iz).
vec2 csi(vec2 z) {
  vec2 a = cshi(vec2(-z.y, z.x));
  return vec2(a.y, -a.x);
}

// Chi(z) = γ + ln z + Σ z^(2k) / (2k (2k)!) below |z| = 3, else −(E1(z) + E1(−z))/2 + iπs/2.
vec2 cchi(vec2 z) {
  if (dot(z, z) < 9.0) {
    vec2 z2 = cmul(z, z);
    vec2 base = clog(z) + vec2(EULER_GAMMA, 0.0);
    vec2 term = vec2(1.0, 0.0);
    vec2 sum = base;
    float largest = length(base);
    for (int k = 1; k < 14; k++) {
      term = cmul(term, z2) / float((2 * k - 1) * (2 * k));
      vec2 t = term / float(2 * k);
      sum = sum + t;
      largest = max(largest, length(t));
    }
    vouch(largest, sum);
    return sum;
  }
  return -0.5 * (cE1(z) + cE1(-z)) + vec2(0.0, 1.5707963 * upperSide(z));
}

// Ci(z) = Chi(iz) − iπ/2, plus 2πi in the second quadrant where Chi(iz) has crossed its own cut.
vec2 cci(vec2 z) {
  vec2 c = cchi(vec2(-z.y, z.x));
  float shift = (z.x < 0.0 && z.y > 0.0 ? 6.2831853 : 0.0);
  return c + vec2(0.0, shift - 1.5707963);
}

// li(z) = Ei(ln z).
vec2 cli(vec2 z) { return cei(clog(z)); }

// --- Lambert W ---------------------------------------------------------------------------------
// Principal branch (cut (−∞, −1/e], upper side on it). Halley's step on w eʷ = z from a start that
// lands on the principal branch: −π < Im w < π and Re w > −Im w cot(Im w) there. No single start
// does everywhere, so the starts are tried in turn (the branch-point series, ln(1 + z) corrected,
// ln z − ln ln z) and the first converged principal root wins; none declines.
vec3 lambertHalley(vec2 w0, vec2 z) {
  vec2 w = w0;
  for (int i = 0; i < 40; i++) {
    vec2 ew = cexp(w);
    vec2 f = cmul(w, ew) - z;
    vec2 w1 = w + vec2(1.0, 0.0);
    vec2 step = cdiv(f, cmul(ew, w1) - cdiv(cmul(w + vec2(2.0, 0.0), f), 2.0 * w1));
    w = w - step;
    if (length(step) <= 1e-6 * length(w)) {
      bool principal = abs(w.y) < 3.1415927 && (abs(w.y) < 1e-4 || w.x > -w.y / tan(w.y));
      return vec3(w, (principal ? 1.0 : 0.0));
    }
  }
  return vec3(w, 0.0);
}

vec2 clambertw(vec2 z) {
  if (z.x == 0.0 && z.y == 0.0) { return vec2(0.0, 0.0); }
  vec2 e1 = 2.7182818 * z + vec2(1.0, 0.0);
  vec2 p = csqrt(2.0 * e1);
  vec2 branchPoint = vec2(-1.0, 0.0) + p - cmul(p, p) / 3.0 + 0.15277778 * cmul(p, cmul(p, p));
  vec2 l1 = clog(vec2(1.0, 0.0) + z);
  vec2 winitzki = cmul(l1, vec2(1.0, 0.0) - cdiv(clog(vec2(1.0, 0.0) + l1), vec2(2.0, 0.0) + l1));
  vec2 lz = clog(z);
  vec2 asymptotic = lz - clog(lz);
  vec3 r = lambertHalley(branchPoint, z);
  if (r.z < 0.5) { r = lambertHalley(winitzki, z); }
  if (r.z < 0.5) { r = lambertHalley(asymptotic, z); }
  if (r.z < 0.5) { r = lambertHalley(z - cmul(z, z), z); }
  if (r.z < 0.5) { uncertain = 1.0; }
  return r.xy;
}

// --- complete and incomplete elliptic integrals (parameter m = k²) -----------------------------
// AGM(a, b), a₀ = a, g₀ = b, aₙ₊₁ = (aₙ + gₙ)/2, gₙ₊₁ = ±√(aₙgₙ) with the "right choice" of sign (Cox):
// the root with Re(gₙ₊₁ conj aₙ₊₁) ≥ 0, a tie (a root on the imaginary axis of aₙ₊₁, as at AGM(1, b<0) on
// the first step) keeping the principal root, the limit from above the negative reals — Wolfram's value.
// Quadratic convergence: 24 steps; a gap still over 1e-5 of |a| declines.
vec2 cagm(vec2 a0, vec2 g0) {
  vec2 a = a0;
  vec2 g = g0;
  for (int i = 0; i < 24; i++) {
    vec2 next = 0.5 * (a + g);
    vec2 root = csqrt(cmul(a, g));
    if (root.x * next.x + root.y * next.y < 0.0) { root = -root; }
    a = next;
    g = root;
  }
  if (length(a - g) > 1e-5 * length(a)) { uncertain = 1.0; }
  return 0.5 * (a + g);
}

// AGM(1, b), the one-argument AGM.
vec2 cagm1(vec2 b) { return cagm(vec2(1.0, 0.0), b); }

// K(m) = π / (2 AGM(1, √(1−m))), analytic off [1, ∞).
vec2 cellipticK(vec2 m) {
  return cdiv(vec2(1.5707963, 0.0), cagm(vec2(1.0, 0.0), csqrt(vec2(1.0, 0.0) - m)));
}

// E(m) = K(m) (1 − Σ 2ⁿ⁻¹ cₙ²), c₀² = m, cₙ₊₁ = (aₙ − bₙ)/2.
vec2 cellipticE(vec2 m) {
  vec2 a = vec2(1.0, 0.0);
  vec2 b = csqrt(vec2(1.0, 0.0) - m);
  vec2 sum = 0.5 * m;
  float pow2 = 1.0;
  for (int i = 0; i < 16; i++) {
    vec2 c = 0.5 * (a - b);
    vec2 next = 0.5 * (a + b);
    b = csqrt(cmul(a, b));
    a = next;
    sum = sum + pow2 * cmul(c, c);
    pow2 = pow2 * 2.0;
  }
  return cmul(cdiv(vec2(1.5707963, 0.0), a), vec2(1.0, 0.0) - sum);
}

// Carlson R_F(x, y, z) by duplication until the three agree to 1e-2, then the fifth-order series.
vec2 crf(vec2 x0, vec2 y0, vec2 z0) {
  vec2 x = x0;
  vec2 y = y0;
  vec2 z = z0;
  bool converged = false;
  for (int i = 0; i < 30; i++) {
    vec2 sx = csqrt(x);
    vec2 sy = csqrt(y);
    vec2 sz = csqrt(z);
    vec2 lam = cmul(sx, sy) + cmul(sy, sz) + cmul(sz, sx);
    x = 0.25 * (x + lam);
    y = 0.25 * (y + lam);
    z = 0.25 * (z + lam);
    vec2 mu = (x + y + z) / 3.0;
    vec2 dx = vec2(1.0, 0.0) - cdiv(x, mu);
    vec2 dy = vec2(1.0, 0.0) - cdiv(y, mu);
    vec2 dz = vec2(1.0, 0.0) - cdiv(z, mu);
    if (max(length(dx), max(length(dy), length(dz))) < 1e-2) {
      converged = true;
      vec2 e2 = cmul(dx, dy) - cmul(dz, dz);
      vec2 e3 = cmul(cmul(dx, dy), dz);
      vec2 poly = vec2(1.0, 0.0) + cmul(e2 * (1.0 / 24.0) - vec2(0.1, 0.0) - e3 * (3.0 / 44.0), e2) + e3 * (1.0 / 14.0);
      return cdiv(poly, csqrt(mu));
    }
  }
  uncertain = 1.0;
  return vec2(0.0, 0.0);
}

// F(φ | m) = sin φ R_F(cos² φ, 1 − m sin² φ, 1) for real |φ| ≤ π/2, then F(φ + kπ) = F(φ) + 2kK(m).
// A complex amplitude declines.
vec2 cellipticF(vec2 phi, vec2 m) {
  if (phi.y != 0.0) { uncertain = 1.0; }
  float k = round(phi.x / 3.1415927);
  float p = phi.x - k * 3.1415927;
  float s = sin(p);
  float c = cos(p);
  vec2 f = s * crf(vec2(c * c, 0.0), vec2(1.0, 0.0) - m * (s * s), vec2(1.0, 0.0));
  if (k == 0.0) { return f; }
  return f + 2.0 * k * cellipticK(m);
}

// --- hypergeometric 1F1 and Bessel J, I by their series -----------------------------------------
// ₁F₁(a; b; z) = Σ (a)ₖ zᵏ / ((b)ₖ k!), Kummer's e^z ₁F₁(b − a; b; −z) left of the imaginary axis so
// the terms do not alternate. A pole of b declines, as does a sum its terms outweigh (vouch) or one
// unconverged at 150 terms.
vec2 chyp1f1Series(vec2 a, vec2 b, vec2 z) {
  vec2 term = vec2(1.0, 0.0);
  vec2 sum = vec2(1.0, 0.0);
  float largest = 1.0;
  int small = 0;
  bool converged = false;
  for (int k = 0; k < 150; k++) {
    float fk = float(k);
    term = cmul(cdiv(cmul(term, a + vec2(fk, 0.0)), b + vec2(fk, 0.0)), z) / (fk + 1.0);
    sum = sum + term;
    largest = max(largest, length(term));
    if (length(term) <= 1e-8 * largest) {
      small = small + 1;
      if (small == 2) { converged = true; break; }
    } else { small = 0; }
  }
  if (!converged) { uncertain = 1.0; }
  vouch(largest, sum);
  return sum;
}

vec2 chyp1f1(vec2 a, vec2 b, vec2 z) {
  if (b.y == 0.0 && b.x <= 0.0 && b.x == floor(b.x)) { uncertain = 1.0; }
  if (z.x >= 0.0) { return chyp1f1Series(a, b, z); }
  return cmul(cexp(z), chyp1f1Series(b - a, b, -z));
}

// 1/Γ(w), zero at the poles of Γ.
vec2 crgamma(vec2 w) {
  if (w.y == 0.0 && w.x <= 0.0 && w.x == floor(w.x)) { return vec2(0.0, 0.0); }
  return cexpClamped(-cloggamma(w));
}

// (z/2)^ν Σ (∓z²/4)ᵏ / (k! Γ(ν + k + 1)): minus for J, plus for I. A negative integer order
// is (−1)^ν times the positive one.
vec2 cbesselSeries(vec2 nu0, vec2 z, float sgn) {
  vec2 nu = nu0;
  float parity = 1.0;
  if (nu.y == 0.0 && nu.x < 0.0 && nu.x == floor(nu.x)) {
    nu = -nu;
    parity = ((int(nu.x) & 1) == 1 && sgn < 0.0 ? -1.0 : 1.0);
  }
  vec2 q = sgn * 0.25 * cmul(z, z);
  vec2 term = crgamma(nu + vec2(1.0, 0.0));
  vec2 sum = term;
  float largest = length(term);
  int small = 0;
  bool converged = false;
  for (int k = 1; k < 120; k++) {
    float fk = float(k);
    term = cdiv(cmul(term, q), (fk) * (nu + vec2(fk, 0.0)));
    sum = sum + term;
    largest = max(largest, length(term));
    if (length(term) <= 1e-8 * largest) {
      small = small + 1;
      if (small == 2) { converged = true; break; }
    } else { small = 0; }
  }
  if (!converged) { uncertain = 1.0; }
  vouch(largest, sum);
  vec2 pre = vec2(1.0, 0.0);
  if (nu.x != 0.0 || nu.y != 0.0) { pre = cpow(0.5 * z, nu); }
  return parity * cmul(pre, sum);
}

vec2 cbesselJ(vec2 nu, vec2 z) { return cbesselSeries(nu, z, -1.0); }
vec2 cbesselI(vec2 nu, vec2 z) { return cbesselSeries(nu, z, 1.0); }

// --- Barnes G ----------------------------------------------------------------------------------
// ln G(1 + w) ~ w²/2 ln w − 3w²/4 + w/2 ln 2π − ln w /12 + ζ'(−1) − 1/(240w²) + 1/(1008w⁴) − 1/(1440w⁶)
// at Re w ≥ 8 (next term under 1e-8), carried down by G(z + 1) = Γ(z) G(z):
// ln G(z) = ln G(z + n) − Σ ln Γ(z + k), the sum by ln Γ(z + k + 1) = ln Γ(z + k) + ln(z + k).
vec2 clogBarnesG(vec2 z0) {
  vec2 z = z0;
  vec2 lg = cloggamma(z0);
  vec2 sumLg = vec2(0.0, 0.0);
  int n = 0;
  for (; n < GAMMA_SHIFTS && z.x < 8.0; n++) {
    sumLg = sumLg + lg;
    lg = lg + clog(z);
    z = z + vec2(1.0, 0.0);
  }
  if (z.x < 8.0) { uncertain = 1.0; }
  vec2 w = z - vec2(1.0, 0.0);
  vec2 iw2 = cdiv(vec2(1.0, 0.0), cmul(w, w));
  vec2 lw = clog(w);
  vec2 w2 = cmul(w, w);
  vec2 ser = cmul(iw2, vec2(-0.0041666667, 0.0) + cmul(iw2, vec2(0.00099206349, 0.0) + iw2 * -0.00069444444));
  vec2 top = 0.5 * cmul(w2, lw) - 0.75 * w2 + 0.91893853 * w - lw / 12.0 + vec2(-0.16542114, 0.0) + ser;
  return top - sumLg;
}

vec2 cbarnesG(vec2 z) { return cexpClamped(clogBarnesG(z)); }
`;
