import { CancellationError, ComputeEngine } from "@cortex-js/compute-engine";
import { compile } from "@cortex-js/compute-engine/compile";
import { describe, expect, test } from "vite-plus/test";
import { algebraicNumbers } from "../src/patches/algebraic-numbers.ts";
import {
  coordinates,
  element,
  generatesPrime,
  isIrreducible,
  isqrt,
  maximalOrder,
  norm,
  orderDiscriminant,
  orderIndex,
  realRootCount,
} from "../src/compute-engine/numerics/number-field.ts";
import { orderedRoots, refineRoot } from "../src/compute-engine/numerics/polynomial-roots.ts";
import sage from "./number-fields.sage.json" with { type: "json" };

// The kernel against Sage (scripts/collect-number-fields-sage.py): each field's discriminant,
// its ring of integers as a lattice, its signature, and which small elements generate primes.
// The standard run checks every element of the fields up to degree 4 and a stride through the
// rest; `DEEP_TESTS=1` checks every one (ζ₇'s field alone has thousands).

const deep = process.env.DEEP_TESTS === "1";
/** Elements checked per field outside a deep run. */
const SAMPLE = 400;
/** A deep run's per-field time, past the default: ζ₇'s 15 625 elements take seconds on a runner. */
const DEEP_BUDGET_MS = deep ? 120_000 : undefined;

const fraction = (text: string): { num: bigint; den: bigint } => {
  const [num, den = "1"] = text.split("/");
  return { num: BigInt(num!), den: BigInt(den) };
};

describe.each(sage.fields.map((f) => [f.f.join(" "), f] as const))("ℚ[x]/(%s)", (_, field) => {
  const f = field.f.map(BigInt);
  const n = f.length - 1;
  const o = maximalOrder(f)!;

  test("is irreducible, with Sage's discriminant, index and signature", () => {
    expect(isIrreducible(f)).toBe(true);
    expect(o).toBeDefined();
    expect(orderDiscriminant(o).toString()).toBe(field.discriminant);
    expect(orderIndex(o).toString()).toBe(field.index);
    const r1 = realRootCount(f);
    expect([r1, (n - r1) / 2]).toEqual(field.signature);
  });

  test("its ring of integers is Sage's: the same index, and Sage's basis inside it", () => {
    for (const b of field.basis) {
      const cs = b.map(fraction);
      const den = cs.reduce((l, c) => (l * c.den) / gcdOf(l, c.den), 1n);
      const x = element(
        cs.map((c) => (c.num * den) / c.den),
        den,
      );
      expect(coordinates(o, x), b.join(" ")).toBeDefined();
    }
  });

  test(
    "an element generates a prime ideal exactly when Sage says so",
    () => {
      const primes = new Set(field.primes.split(" ").filter(Boolean));
      const [lo, hi] = sage.coefficients;
      const wrong: string[] = [];
      const total = (hi! - lo! + 1) ** n;
      const stride = deep || total <= SAMPLE ? 1 : Math.ceil(total / SAMPLE);
      let seen = 0;
      const visit = (prefix: bigint[]): void => {
        if (prefix.length === n) {
          if (seen++ % stride !== 0) return;
          const x = element(prefix);
          const N = norm(f, x).num;
          if (N === 0n || N === 1n || N === -1n || (N < 0n ? -N : N) > BigInt(sage.normLimit)) return;
          const key = prefix.join(",");
          if (generatesPrime(o, x) !== primes.has(key)) wrong.push(key);
          return;
        }
        for (let c = lo!; c <= hi!; c++) visit([...prefix, BigInt(c)]);
      };
      visit([]);
      expect(wrong).toEqual([]);
    },
    DEEP_BUDGET_MS,
  );
});

const gcdOf = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcdOf(b, a % b));

test("a polynomial no prime certifies is left undecided, and a reducible one is reducible", () => {
  // x⁴ + 1 splits mod every prime; x⁴ − 10x² + 1 (√2 + √3) too.
  expect(isIrreducible([1n, 0n, 0n, 0n, 1n])).toBeUndefined();
  expect(isIrreducible([1n, 0n, -10n, 0n, 1n])).toBeUndefined();
  expect(isIrreducible([-6n, 1n, 1n])).toBe(false);
  expect(maximalOrder([-6n, 1n, 1n])).toBeDefined();
});

describe("the heads", () => {
  const ce = new ComputeEngine();
  algebraicNumbers.apply(ce);
  const run = (json: unknown): unknown => ce.box(json as never).evaluate().json;
  const dedekind = [
    "PolynomialRoot",
    ["Add", ["Power", "x", 3], ["Negate", ["Power", "x", 2]], ["Multiply", -2, "x"], -8],
    1,
  ];

  test("read a generator from a radical, i, the golden ratio or a root", () => {
    expect(run(["MinimalPolynomial", ["Multiply", "ImaginaryUnit", ["Sqrt", 3]], "x"])).toEqual([
      "Add",
      ["Power", "x", 2],
      3,
    ]);
    expect(run(["NumberFieldDiscriminant", "GoldenRatio"])).toBe(5);
    expect(run(["NumberFieldDiscriminant", dedekind])).toBe(-503);
    expect(run(["NumberFieldSignature", ["Root", 2, 5]])).toEqual(["List", 1, 2]);
    // compute-engine writes (−4)^(1/4) as 1 + i, so its field is ℚ(i).
    expect(run(["NumberFieldDiscriminant", ["Power", -4, ["Rational", 1, 4]]])).toBe(-4);
  });

  test("leave what isn't one generator's, or isn't algebraic, unevaluated", () => {
    expect(run(["NumberFieldDiscriminant", ["Add", ["Sqrt", 2], ["Sqrt", 3]]])).toEqual([
      "NumberFieldDiscriminant",
      ["Add", ["Sqrt", 2], ["Sqrt", 3]],
    ]);
    expect(run(["AlgebraicIntegerQ", "y"])).toEqual(["AlgebraicIntegerQ", "y"]);
    expect(run(["MinimalPolynomial", "Pi", "x"])).toEqual(["MinimalPolynomial", "Pi", "x"]);
  });

  test("norm and trace agree with the minimal polynomial's coefficients", () => {
    expect(run(["AlgebraicNumberNorm", ["Add", 1, ["Root", 2, 3]]])).toBe(3);
    expect(run(["AlgebraicNumberTrace", ["Add", 1, ["Root", 2, 3]]])).toBe(3);
  });
});

test("isqrt is exact on bigints past the doubles' range", () => {
  for (const n of [
    0n,
    1n,
    2n,
    3n,
    4n,
    99n,
    100n,
    2n ** 64n - 1n,
    10n ** 400n,
    10n ** 400n - 1n,
    3n * 10n ** 801n + 7n,
  ]) {
    const r = isqrt(n);
    expect(r * r <= n && (r + 1n) * (r + 1n) > n, String(n).slice(0, 20)).toBe(true);
  }
});

describe("the ring of integers", () => {
  const binomial = (n: number, c: bigint): bigint[] => [-c, ...Array.from({ length: n - 1 }, () => 0n), 1n];

  test("of x^8 − 7 and x^12 − 3 comes from Eisenstein and Round 2, not a search", () => {
    // 2^24·7^7 (Eisenstein at 7, 2-maximal by Dedekind) and 12^12·3^11, each in well under a second.
    const t = Date.now();
    expect(orderDiscriminant(maximalOrder(binomial(8, 7n))!)).toBe(-(2n ** 24n) * 7n ** 7n);
    expect(orderDiscriminant(maximalOrder(binomial(12, 3n))!)).toBe(-(12n ** 12n) * 3n ** 11n);
    expect(Date.now() - t).toBeLessThan(2000);
  });

  test("is cut off by the engine's time limit", () => {
    const ce = new ComputeEngine();
    algebraicNumbers.apply(ce);
    const arg = ["NumberFieldDiscriminant", ["Root", 12, 12]];
    expect(() => ce.withTimeLimit(0, () => ce.box(arg as never).evaluate())).toThrow(CancellationError);
    // Without a limit it answers.
    expect(ce.box(arg as never).evaluate().json).not.toEqual(arg);
  });
});

describe("the roots of a polynomial", () => {
  const show = (f: bigint[]) => orderedRoots(f)?.map((z) => [Number(z.re.toFixed(6)), Number(z.im.toFixed(6))]);

  test("come real first and increasing, then complex by real part and imaginary part", () => {
    expect(show([1n, -3n, 0n, 1n])).toEqual([
      [-1.879385, 0],
      [0.347296, 0],
      [1.532089, 0],
    ]);
    expect(show([-2n, 0n, 0n, 1n])).toEqual([
      [1.259921, 0],
      [-0.629961, -1.091124],
      [-0.629961, 1.091124],
    ]);
    // Real parts equal in pairs: the lower imaginary part first.
    expect(show([1n, 0n, 0n, 0n, 1n])).toEqual([
      [-0.707107, -0.707107],
      [-0.707107, 0.707107],
      [0.707107, -0.707107],
      [0.707107, 0.707107],
    ]);
  });

  test("are declined for a repeated root, and refined to the digits asked", () => {
    expect(orderedRoots([1n, 2n, 1n])).toBeUndefined();
    const [root] = orderedRoots([-2n, 0n, 0n, 1n])!;
    expect(refineRoot([-2n, 0n, 0n, 1n], root!, 30)?.re).toBe("125992104989487316476721060728e-29");
  });
});

describe("the heads on every route", () => {
  const ce = new ComputeEngine();
  algebraicNumbers.apply(ce);
  const cubic = ["Add", ["Power", "x", 3], -2];
  const root = (k: unknown): unknown[] => ["PolynomialRoot", cubic, k];
  const run = (json: unknown): unknown => ce.box(json as never).evaluate().json;

  test("different roots of one polynomial are different generators", () => {
    const call = ["MinimalPolynomial", ["Subtract", root(1), root(2)], "x"];
    // Not "x" (the difference read as 0), and not an answer either.
    expect((run(call) as unknown[])[0]).toBe("MinimalPolynomial");
    expect((run(["MinimalPolynomial", ["Add", root(1), root(2)], "x"]) as unknown[])[0]).toBe("MinimalPolynomial");
    expect(run(["MinimalPolynomial", root(2), "x"])).toEqual(cubic);
  });

  test("an index outside the degree declines, with the operands evaluated", () => {
    expect(run(root(7))).toEqual(root(7));
    expect(run(["NumberFieldDiscriminant", root(7)])).toEqual(["NumberFieldDiscriminant", root(7)]);
    ce.assign("y", 5);
    expect(run(["AlgebraicIntegerQ", ["Add", "y", ["Sqrt", "z"]]])).toEqual([
      "AlgebraicIntegerQ",
      ["Add", ["Sqrt", "z"], 5],
    ]);
    ce.assign("y", ce.symbol("y"));
  });

  test("a radical of a negative base is the number compute-engine means", () => {
    expect(run(["MinimalPolynomial", ["Root", -2, 3], "x"])).toEqual(["Add", ["Power", "x", 3], 2]);
    const mixed = ["MinimalPolynomial", ["Add", ["Root", -2, 6], ["Root", -2, 3]], "x"];
    expect((run(mixed) as unknown[])[0]).toBe("MinimalPolynomial");
    // (−1)^(3/2) = −i, which is not i: this cancels.
    expect(run(["MinimalPolynomial", ["Add", ["Power", -1, ["Rational", 3, 2]], "ImaginaryUnit"], "x"])).toBe("x");
  });

  test("a huge radical index or a degree past the cap declines at once", () => {
    const t = Date.now();
    for (const j of [
      ["MinimalPolynomial", ["Root", ["Rational", 1, 2], 10 ** 12], "x"],
      ["NumberFieldDiscriminant", ["Root", 2, 13]],
      ["NumberFieldDiscriminant", ["PolynomialRoot", ["Add", ["Power", "x", 13], -2], 1]],
    ]) {
      expect((run(j) as unknown[])[0]).toBe((j as unknown[])[0]);
    }
    expect(Date.now() - t).toBeLessThan(2000);
  });

  test("a subfield's generator gives the subfield's invariants", () => {
    const sqrt2 = ["Power", ["PolynomialRoot", ["Add", ["Power", "x", 4], -2], 1], 2];
    expect(run(["NumberFieldDiscriminant", sqrt2])).toBe(8);
    expect(run(["NumberFieldSignature", sqrt2])).toEqual(["List", 2, 0]);
    expect(run(["NumberFieldIntegralBasis", 3])).toEqual(["List", 1]);
  });

  test("N of a root is a number in the documented order, evaluate keeps the name", () => {
    const n = (k: number) => ce.box(root(k) as never).N();
    expect(ce.box(root(1) as never).evaluate().json).toEqual(root(1));
    expect(n(1).re).toBeCloseTo(2 ** (1 / 3), 14);
    expect([n(2).re, n(2).im]).toEqual([
      expect.closeTo(-(2 ** (1 / 3)) / 2, 14),
      expect.closeTo(-1.0911236359717214, 14),
    ]);
    expect(n(3).im).toBeGreaterThan(0);
    // A quadratic's root is a number too, not √2.
    expect(ce.box(["PolynomialRoot", ["Add", ["Power", "x", 2], -2], 2] as never).N().re).toBeCloseTo(Math.SQRT2, 14);
  });

  test("N doesn't turn a head's argument into a float", () => {
    const n = ce.box(["MinimalPolynomial", ["Root", -2, 3], "x"] as never).N();
    expect(n.json).toEqual(["Add", ["Power", "x", 3], 2]);
  });

  test("compile declines, and the fallback agrees with N", () => {
    const expr = ce.box(root(1) as never);
    const compiled = compile(expr, { to: "javascript" });
    expect(compiled.success).toBe(false);
    expect(compiled.run?.()).toBeCloseTo(expr.N().re, 12);
  });
});
