import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";
import { emitComplexGLSL, type Json, MAX_SLOTS } from "@notatio/ce-patches";
import { complexGLSL } from "../src/shader-complex.ts";
import { zetaGLSL } from "../src/shader.ts";

test("the real Lerch wrapper in the shader returns NaN where Φ is complex", () => {
  expect(zetaGLSL).toContain("float lerchPhiReal(");
});

test("the shader has no const-evaluable NaN (a constant NaN is undefined in GLSL ES 3.00 and some compilers reject it)", () => {
  const src = zetaGLSL.replace(/\/\/.*$/gm, "");
  expect(src).not.toMatch(/uintBitsToFloat\(\s*0x7f[89a-f][0-9a-f]{5}u\s*\)/i);
  expect(src).not.toMatch(/0\.0\s*\/\s*0\.0/);
});

const ce = createEngine(declareAnalytic);

/** Canonical MathJSON for a boxed expression, the emitter's input shape. */
const canon = (expr: unknown): Json => ce.box(expr as Parameters<typeof ce.box>[0]).json as unknown as Json;

const emit = (expr: unknown) => emitComplexGLSL(canon(expr));

test("the variable passes through and literals become uniform slots", () => {
  const r = emit(["PolyLog", 2.5, "z"]);
  expect(r?.code).toBe("polyLog(prm.p[0].xy, z)");
  expect(r?.literals).toEqual([[2.5, 0]]);
});

test("a complex literal takes one slot, carrying both parts", () => {
  const r = emit(["HurwitzZeta", ["Complex", 0.5, 8], "z"]);
  expect(r?.literals).toEqual([[0.5, 8]]);
  expect(r?.code).toBe("hurwitz(prm.p[0].xy, z)");
});

test("arithmetic lowers to the complex helpers, not the scalar operators", () => {
  expect(emit(["Divide", ["Add", "z", -1], ["Add", "z", 1]])?.code).toBe("cdiv((z + prm.p[0].xy), (z + prm.p[1].xy))");
  expect(emit(["Multiply", "z", "z", "z"])?.code).toBe("cmul(cmul(z, z), z)");
  expect(emit(["Sqrt", "z"])?.code).toBe("csqrt(z)");
});

test("a small integer power becomes repeated multiplication, avoiding cpow's cut", () => {
  expect(emit(["Power", "z", 3])?.code).toBe("cmul(cmul(z, z), z)");
  expect(emit(["Power", "z", 3])?.literals).toEqual([]); // the exponent is baked in
  // A non-integer or large exponent still goes through cpow, as a slot.
  expect(emit(["Power", "z", 2.5])?.code).toBe("cpow(z, prm.p[0].xy)");
});

test("Zeta takes the Riemann kernel at one argument and the generalized one at two", () => {
  expect(emit(["Zeta", "z"])?.code).toBe("hurwitz(z, vec2(1.0, 0.0))");
  expect(emit(["Zeta", 2, "z"])?.code).toBe("zetaGen(prm.p[0].xy, z)");
});

test("every special-function head reaches its kernel", () => {
  expect(emit(["HurwitzZeta", 2, "z"])?.code).toContain("hurwitz(");
  expect(emit(["LerchPhi", "z", 2, 1])?.code).toContain("lerchPhi(");
  expect(emit(["PolyLog", 2, "z"])?.code).toContain("polyLog(");
  expect(emit(["PolyGamma", 1, "z"])?.code).toContain("polygamma(");
});

// --- the widened heads (BL-335) -----------------------------------------------------

/** Every head the emitter lowers beyond the first set, as the page writes it, with the kernel it should reach. */
const WIDENED: [unknown, string][] = [
  [["Log", "z"], "clog10("],
  [["Log", "z", 2], "clogBase("],
  [["Tan", "z"], "ctan("],
  [["Tanh", "z"], "ctanh("],
  [["Sinc", "z"], "csinc("],
  [["Re", "z"], "cre("],
  [["Im", "z"], "cim("],
  [["Real", "z"], "cre("],
  [["Imaginary", "z"], "cim("],
  [["Arg", "z"], "carg("],
  [["Argument", "z"], "carg("],
  [["Abs", "z"], "cabs("],
  [["LogGamma", "z"], "cloggamma("],
  [["GammaLn", "z"], "cgammaln("],
  [["Digamma", "z"], "cdigamma("],
  [["Trigamma", "z"], "ctrigamma("],
  [["Pochhammer", 2.5, "z"], "cpochhammer("],
  [["Binomial", 5, "z"], "cbinomial("],
  [["Choose", 5, "z"], "cbinomial("],
  [["DirichletEta", "z"], "cdirichletEta("],
  [["DirichletBeta", "z"], "cdirichletBeta("],
  [["Erf", "z"], "cerf("],
  [["Erfc", "z"], "cerfc("],
  [["Erfi", "z"], "cerfi("],
  [["FresnelS", "z"], "cfresnelS("],
  [["FresnelC", "z"], "cfresnelC("],
  [["SinIntegral", "z"], "csi("],
  [["CosIntegral", "z"], "cci("],
  [["SinhIntegral", "z"], "cshi("],
  [["CoshIntegral", "z"], "cchi("],
  [["ExpIntegralEi", "z"], "cei("],
  [["LogIntegral", "z"], "cli("],
  [["LambertW", "z"], "clambertw("],
  [["EllipticK", "z"], "cellipticK("],
  [["EllipticE", "z"], "cellipticE("],
  [["EllipticF", 0.9, "z"], "cellipticF("],
  [["Hypergeometric1F1", 0.7, 1.9, "z"], "chyp1f1("],
  [["BesselJ", 1, "z"], "cbesselJ("],
  [["BesselI", 1, "z"], "cbesselI("],
  [["AGM", "z"], "cagm1("],
  [["AGM", 2, "z"], "cagm("],
  [["BarnesG", "z"], "cbarnesG("],
  [["LogBarnesG", "z"], "clogBarnesG("],
];

test("each widened head reaches a kernel the shader defines", () => {
  for (const [expr, call] of WIDENED) {
    const code = emit(expr)?.code;
    expect(code, JSON.stringify(expr)).toBeDefined();
    expect(code, JSON.stringify(expr)).toContain(call);
    const fn = call.slice(0, -1);
    expect(zetaGLSL, `${fn} is defined`).toMatch(new RegExp(`^(?:vec[234]|float|void) ${fn}\\(`, "m"));
  }
});

test("Log is base 10, Ln natural, as compute-engine has them; Log2 and Log10 are its two-argument form", () => {
  expect(emit(["Log", "z"])?.code).toBe("clog10(z)");
  expect(emit(["Log2", "z"])?.code).toBe("clogBase(z, prm.p[0].xy)");
  expect(emit(["Log2", "z"])?.literals).toEqual([[2, 0]]);
  expect(emit(["Ln", "z"])?.code).toBe("clog(z)");
});

test("a head whose kernel cannot vouch for its digits stays declined", () => {
  // Airy: its Maclaurin series cancels as e^(2/3 z^3/2) against a result that decays by the same factor, and the
  // asymptotic series needs Stokes sectors. Bessel Y and K: integer orders are limits, the sliders' own default.
  // 2F1 is a disk and its continuation. LambertW with a branch, and the rest, have no kernel.
  for (const head of ["AiryAi", "AiryBi", "AiryAiPrime", "BesselY", "BesselK", "Hypergeometric2F1", "EllipticPi"])
    expect(emit([head, 1, "z"]), head).toBeUndefined();
  expect(emit(["LambertW", "z", 1])).toBeUndefined();
});

test("PolyGamma of order 0 and 1 takes the digamma and trigamma kernels, not the pole of ζ(1, z)", () => {
  const polygamma = /vec2 polygamma\([\s\S]*?\n}\n/.exec(zetaGLSL)![0];
  expect(polygamma).toContain("cdigamma(z)");
  expect(polygamma).toContain("ctrigamma(z)");
});

// --- the property the pipeline cache rests on -------------------------------------

test("changing only a literal keeps the shape and the code, moving just the slots", () => {
  const a = emit(["PolyLog", 2.5, "z"]);
  const b = emit(["PolyLog", 2.75, "z"]);
  expect(b?.shape).toBe(a?.shape); // same cache key -> pipeline is reused
  expect(b?.code).toBe(a?.code);
  expect(b?.literals).not.toEqual(a?.literals); // only the uniform upload differs
});

test("changing the structure changes the shape, forcing a rebuild", () => {
  const a = emit(["PolyLog", 2, "z"]);
  const b = emit(["PolyGamma", 2, "z"]);
  const c = emit(["Add", ["PolyLog", 2, "z"], 1]);
  expect(b?.shape).not.toBe(a?.shape);
  expect(c?.shape).not.toBe(a?.shape);
});

test("the baked-in integer exponent is part of the shape", () => {
  // z^2 and z^3 emit different code, so they must not share a cache entry.
  expect(emit(["Power", "z", 2])?.shape).not.toBe(emit(["Power", "z", 3])?.shape);
});

// --- rejection ---------------------------------------------------------------------

test("an unbound symbol or unsupported head is rejected, not mis-emitted", () => {
  expect(emit(["PolyLog", 2, "w"])).toBeUndefined(); // w is not the variable
  expect(emit(["AiryAi", "z"])).toBeUndefined();
  expect(emitComplexGLSL(["Hypot", "z"] as Json)).toBeUndefined();
});

test("more literals than slots is rejected rather than overflowing the uniform", () => {
  let expr: unknown = "z";
  for (let k = 0; k <= MAX_SLOTS; k++) expr = ["Add", expr, k + 0.5];
  expect(emit(expr)).toBeUndefined();
});

test("named constants lower to literal slots", () => {
  const r = emit(["Multiply", "Pi", "z"]);
  expect(r?.literals[0]?.[0]).toBeCloseTo(Math.PI, 12);
  expect(emit(["Power", "ExponentialE", "z"])?.literals[0]?.[0]).toBeCloseTo(Math.E, 12);
});

// --- literal forms an exact result actually produces --------------------------------

test("a rational literal is a slot, not a call", () => {
  // ζ(0, z) is 1/2 - z, and every ζ(-n, z) is a Bernoulli polynomial full of these.
  // Treating Rational as a function made all of them undrawable.
  const r = emit(["Add", ["Negate", "z"], ["Rational", 1, 2]]);
  expect(r?.code).toBe("(cneg(z) + prm.p[0].xy)");
  expect(r?.literals).toEqual([[0.5, 0]]);
});

test("the closed forms a slider actually lands on all lower", () => {
  // Sweeping s across the integers walks HurwitzZeta through these.
  for (const s of [0, -1, -2, -3, -6]) {
    const closed = ce.box(["HurwitzZeta", s, "z"]).evaluate().json;
    expect(emitComplexGLSL(closed as Json)).toBeDefined();
  }
});

test("a lowercase head from the Epsil round trip still resolves", () => {
  // `PolyLog(1, z)` evaluates to -ln(1 - z), and the round trip through Epsil hands
  // back `ln`, not `Ln`.
  expect(emitComplexGLSL(["Negate", ["ln", ["Subtract", 1, "z"]]] as Json)?.code).toBe("cneg(clog((prm.p[0].xy - z)))");
  expect(emitComplexGLSL(["sin", "z"] as Json)?.code).toBe("csin(z)");
});

test("digit separators in a number literal are read, not rejected", () => {
  expect(emitComplexGLSL(["Multiply", { num: "1_000.5" }, "z"] as Json)?.literals).toEqual([[1000.5, 0]]);
});

test("Gamma and Factorial lower to cgamma, Factorial as Γ(z + 1)", () => {
  expect(emit(["Gamma", "z"])?.code).toBe("cgamma(z)");
  expect(emitComplexGLSL(["gamma", "z"] as Json)?.code).toBe("cgamma(z)");
  expect(emit(["Factorial", "z"])?.code).toBe("cgamma((z + vec2(1.0, 0.0)))");
});

// --- cgamma, numerically ------------------------------------------------------------
// No GLSL runtime here, so this is a line-for-line f32 port of cgamma/clgamma/clogSin
// (Math.fround on every op), checked against our Gamma head. A string check ties the
// port to the shader's constants.

test("the shader's cgamma has the constants the port below uses", () => {
  expect(zetaGLSL).toContain("vec2 cgamma(");
  expect(zetaGLSL).toContain("1.1447299");
  expect(zetaGLSL).toContain("min(lg.x, 80.0)");
});

const f = Math.fround;
type C = [number, number];
const cmul = (a: C, b: C): C => [f(f(a[0] * b[0]) - f(a[1] * b[1])), f(f(a[0] * b[1]) + f(a[1] * b[0]))];
const cdiv = (a: C, b: C): C => {
  const d = f(f(b[0] * b[0]) + f(b[1] * b[1]));
  return [f(f(f(a[0] * b[0]) + f(a[1] * b[1])) / d), f(f(f(a[1] * b[0]) - f(a[0] * b[1])) / d)];
};
const cexp = (z: C): C => {
  const e = f(Math.exp(z[0]));
  return [f(e * f(Math.cos(z[1]))), f(e * f(Math.sin(z[1])))];
};
const clog = (z: C): C => [f(0.5 * f(Math.log(f(f(z[0] * z[0]) + f(z[1] * z[1]))))), f(Math.atan2(z[1], z[0]))];
const add = (a: C, b: C): C => [f(a[0] + b[0]), f(a[1] + b[1])];
const sub = (a: C, b: C): C => [f(a[0] - b[0]), f(a[1] - b[1])];

function clgamma(z0: C): C {
  let z = z0;
  let shift: C = [0, 0];
  for (let k = 0; k < 8 && z[0] < 8; k++) {
    shift = add(shift, clog(z));
    z = [f(z[0] + 1), z[1]];
  }
  const iz = cdiv([1, 0], z);
  const iz2 = cmul(iz, iz);
  const inner = add([-0.0027777778, 0], [f(iz2[0] * 0.00079365079), f(iz2[1] * 0.00079365079)]);
  const ser = cmul(iz, add([0.083333333, 0], cmul(iz2, inner)));
  return sub(add(sub(cmul([f(z[0] - 0.5), z[1]], clog(z)), z), add([0.9189385, 0], ser)), shift);
}

function clogSin(w0: C): C {
  const flip = w0[1] < 0;
  const w: C = flip ? [w0[0], -w0[1]] : w0;
  const u = cexp([f(-2 * w[1]), f(2 * w[0])]);
  const l = add(clog([f(1 - u[0]), -u[1]]), [f(w[1] - 0.6931472), f(1.5707963 - w[0])]);
  return flip ? [l[0], -l[1]] : l;
}

function cgamma(z: C): C {
  if (z[1] === 0 && z[0] <= 0 && z[0] === Math.floor(z[0])) return [1e30, 0];
  const lg =
    z[0] < 0.5
      ? sub(sub([1.1447299, 0], clogSin([f(3.1415927 * z[0]), f(3.1415927 * z[1])])), clgamma([f(1 - z[0]), -z[1]]))
      : clgamma(z);
  return cexp([Math.min(lg[0], 80), lg[1]]);
}

// Reference: our own Gamma head (complex, double precision).
const ref = (re: number, im: number): C => {
  const v = ce.box(["Gamma", ["Complex", re, im]]).N().json as unknown;
  if (typeof v === "number") return [v, 0];
  const a = (Array.isArray(v) ? v : []) as unknown[];
  return [Number(a[1]), Number(a[2])];
};

test("cgamma agrees with the Gamma head across the plane to f32 accuracy", () => {
  let worst = 0;
  for (let re = -6.3; re <= 6.3; re += 0.9) {
    for (let im = -4.1; im <= 4.1; im += 0.7) {
      const [er, ei] = ref(re, im);
      const [gr, gi] = cgamma([f(re), f(im)]);
      worst = Math.max(worst, Math.hypot(gr - er, gi - ei) / Math.hypot(er, ei));
    }
  }
  expect(worst).toBeLessThan(5e-4);
});

test("poles come out huge and finite, never NaN", () => {
  for (const n of [0, -1, -2, -7]) {
    const [r, i] = cgamma([n, 0]);
    expect(Number.isFinite(r) && Number.isFinite(i)).toBe(true);
    expect(Math.abs(r)).toBeGreaterThan(1e10);
  }
  // beside a pole, and with a large imaginary part
  for (const z of [
    [-3.0001, 0.0001],
    [-2, 1e-3],
    [-4.5, 40],
    [3, -60],
  ] as C[]) {
    const [r, i] = cgamma(z);
    expect(Number.isNaN(r) || Number.isNaN(i)).toBe(false);
  }
});

test("the Hurwitz kernels flag a sum whose terms dwarf it, for a host to hatch (S#5)", () => {
  expect(zetaGLSL).toContain("float uncertain = 0.0;");
  // The Taylor sum vouches for itself in f32; the Euler–Maclaurin sum, where f32 cancels it, is redone
  // in df64 and that vouches.
  const hurwitz = zetaGLSL.replace(complexGLSL, "");
  expect(hurwitz.match(/vouch\(largest, /g)?.length).toBe(3);
  expect(hurwitz).toContain("if (DF64 && largest > SUM_COND_LIMIT * length(sum)) { return hurwitzEMDf(s, a, largest);");
  expect(hurwitz.match(/vouchDf\(largest, /g)?.length).toBe(1);
});

test("the df64 constants are pairs of f32 that sum to the double they stand for", () => {
  // Euler–Maclaurin's B₂ₖ/(2k)!, written as vec2(hi, lo): hi + lo is the double to well under df64's 2⁻⁴⁸.
  const row = /vec2 em\[9\] = vec2\[9\]\((.*)\);/.exec(zetaGLSL)![1]!;
  const pairs = [...row.matchAll(/vec2\(([^,]+), ([^)]+)\)/g)].map(
    (m) => [Math.fround(Number(m[1])), Math.fround(Number(m[2]))] as const,
  );
  const exact = [0, 1 / 12, -1 / 720, 1 / 30240, -1 / 1209600, 1 / 47900160, -691 / 1307674368000];
  expect(pairs).toHaveLength(9);
  for (const [i, x] of exact.entries()) {
    const [hi, lo] = pairs[i]!;
    expect(Math.abs(hi + lo - x)).toBeLessThanOrEqual(Math.abs(x) * 2 ** -48);
  }
});
