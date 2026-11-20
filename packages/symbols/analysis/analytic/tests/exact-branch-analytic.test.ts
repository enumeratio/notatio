// unstable: a bare engine to declare the analytic library against
import { BigDecimal } from "@notatio/engine";
import { ComputeEngine } from "@notatio/engine/unstable";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";
import grid from "./exact-branch-analytic.mpmath.json" with { type: "json" };

// A branch test on an operand's exact value, not its double. A decimal with more digits than a double
// reads as its nearest double: 1 + 1e-20 is 1 (InverseErfc(1 + 1e-20) is −8.9e-21, not 0), and 1e-400 is 0
// (BellY(2, 2, {1e-400}) is 1e-800, not 0). Every route (.N(), N(·, d), evaluate(), the parse route) answers
// with the digits asked for or stays unevaluated, never with the value at the point the double reads as.
// Values are mpmath 1.3.0 at 100 digits or more (scripts/collect-exact-branch-mpmath.py has the full grid).

const ce = new ComputeEngine();
declareAnalytic(ce);
afterEach(() => {
  ce.precision = "machine";
});

type Json = string | number | { num: string } | readonly [string, ...Json[]];

interface Case {
  head: string;
  call: Json;
  /** the parse route's text */
  text: string;
  digits: number;
  /** mpmath's value, or "declines" where no kernel here reads the call to its digits */
  value: string;
}

const num = (s: string): Json => ({ num: s });

const CASES: Case[] = [
  {
    head: "InverseErfc",
    call: ["InverseErfc", num("1.00000000000000000001")],
    text: "\\operatorname{InverseErfc}(1.00000000000000000001)",
    digits: 30,
    value: "-8.862269254527580136490837416705725913988e-21",
  },
  {
    head: "InverseErfc",
    call: ["InverseErfc", num("1.99999999999999999999")],
    text: "\\operatorname{InverseErfc}(1.99999999999999999999)",
    digits: 30,
    value: "-6.601580622355142561516391632418707464858",
  },
  {
    head: "InverseErfc",
    call: ["InverseErfc", num("1e-30")],
    text: "\\operatorname{InverseErfc}(0.000000000000000000000000000001)",
    digits: 30,
    value: "8.148616223169864607384566660648100538313",
  },
  // InverseErfc(1e-400) is 30.28…: ErfInv(1 − 1e-400) needs 400 more working digits, which takes seconds, so the call declines
  {
    head: "InverseErfc",
    call: ["InverseErfc", num("1e-400")],
    text: "\\operatorname{InverseErfc}(1e-400)",
    digits: 30,
    value: "declines",
  },
  {
    head: "ExpIntegralE",
    call: ["ExpIntegralE", 1, num("1e-400")],
    text: "\\operatorname{ExpIntegralE}(1, 1e-400)",
    digits: 30,
    value: "920.4568215327167407465900697836632806094",
  },
  {
    head: "ExpIntegralE",
    call: ["ExpIntegralE", num("1.00000000000000000001"), 0],
    text: "\\operatorname{ExpIntegralE}(1.00000000000000000001, 0)",
    digits: 30,
    value: "1e20",
  },
  {
    head: "ExpIntegralE",
    call: ["ExpIntegralE", num("1.00000000000000000001"), ["Rational", 1, 2]],
    text: "\\operatorname{ExpIntegralE}(1.00000000000000000001, 1/2)",
    digits: 30,
    value: "0.5597735947761608117432131873835620218823",
  },
  {
    head: "BellY",
    call: ["BellY", 2, 2, ["List", num("1e-400")]],
    text: "\\operatorname{BellY}(2, 2, [1e-400])",
    digits: 30,
    value: "1e-800",
  },
  {
    head: "IncompleteEllipticF",
    call: ["IncompleteEllipticF", num("1e-400"), ["Rational", 1, 2]],
    text: "\\operatorname{IncompleteEllipticF}(1e-400, 1/2)",
    digits: 30,
    value: "1e-400",
  },
  {
    head: "IncompleteEllipticE",
    call: ["IncompleteEllipticE", num("1e-400"), ["Rational", 1, 2]],
    text: "\\operatorname{IncompleteEllipticE}(1e-400, 1/2)",
    digits: 30,
    value: "1e-400",
  },
  {
    head: "CarlsonRC",
    call: ["CarlsonRC", 1, num("1e-20")],
    text: "\\operatorname{CarlsonRC}(1, 1e-20)",
    digits: 50,
    value: "23.718998110500402149713241658854320654835368341418637872755008707",
  },
  // RC(1, 1e-400) = ln(4/y)/2 + …: y below the double's range is not the pole (mpmath elliprc)
  {
    head: "CarlsonRC",
    call: ["CarlsonRC", 1, num("1e-400")],
    text: "\\operatorname{CarlsonRC}(1, 1e-400)",
    digits: 50,
    value: "461.2101657793690821130155230583310180882957978601148504607862602",
  },
  // W(−1/e + 5e-54) is −1 + 7e-27: next to the branch point only the exact z decides, so a z whose digits go past a
  // double's, within a double's rounding of −1/e, stays unevaluated (native answers −1)
  {
    head: "LambertW",
    call: ["LambertW", num("-0.36787944117144232159552377016146086744581113103176783")],
    text: "\\operatorname{LambertW}(-0.36787944117144232159552377016146086744581113103176783)",
    digits: 30,
    value: "declines",
  },
  // E_{2+1e-20}(−1/2) is 1.4216113182685413568920321507 − 1.5707963267948966192137926804i; the complex Gamma
  // under it runs in doubles, so past a double's digits the call stays unevaluated (it was NaN)
  {
    head: "ExpIntegralE",
    call: ["ExpIntegralE", num("2.00000000000000000001"), -0.5],
    text: "\\operatorname{ExpIntegralE}(2.00000000000000000001, -0.5)",
    digits: 30,
    value: "declines",
  },
  // the value is 1 + 5e-401, past a double's digits and the digits a z below the double's range is read as 0 to
  {
    head: "HypergeometricPFQ",
    call: ["HypergeometricPFQ", ["List", 1, 1], ["List", 2], num("1e-400")],
    text: "\\operatorname{HypergeometricPFQ}([1, 1], [2], 1e-400)",
    digits: 500,
    value: "declines",
  },
];

/** A number, not the call left unevaluated. */
const answered = (answer: { operator: string }, head: string): boolean => answer.operator !== head;

/**
 * The relative distance of an answer from mpmath's. A double kernel's answer, 17 digits or fewer, is held to
 * a double's 15 digits, not to the digits the call asked for.
 */
function distance(answer: { bignumRe?: BigDecimal; re: number; toString(): string }, value: string): number {
  const x = answer.bignumRe ?? new BigDecimal(String(answer.re));
  const reference = new BigDecimal(value);
  return x.sub(reference).abs().div(reference.abs()).toNumber();
}

/** Ten units of the last of `digits` digits (a correctly rounded value is within half of one). */
const bound = (digits: number): number => 10 ** (1 - digits);

/** The digits an answer claims: the call's own, unless it prints 17 or fewer, a double's, which claims 15. */
function claimed(answer: { toString(): string }, digits: number): number {
  const printed = answer
    .toString()
    .replace(/e.*$/, "")
    .replace(/[^0-9]/g, "")
    .replace(/^0+/, "");
  return printed.length > 17 ? digits : Math.min(digits, 15);
}

describe("every route reads the exact operand", () => {
  for (const c of CASES) {
    const name = `${c.head} ${JSON.stringify(c.call)} at ${c.digits} digits`;
    test(`${name}: .N(), N(·, d), evaluate() and the parse route`, () => {
      ce.precision = c.digits;
      const routes: [string, ReturnType<typeof ce.box>][] = [
        [".N()", ce.box(c.call as never).N()],
        ["N(·, d)", ce.box(["N", c.call, c.digits] as never).evaluate()],
        ["evaluate()", ce.box(c.call as never).evaluate()],
        ["parse", ce.parse(c.text).N()],
      ];
      for (const [route, answer] of routes) {
        if (c.value === "declines") {
          // evaluate() of a float answers a double where the kernel runs in doubles (1, here), which claims no digits
          if (route === "evaluate()" && c.head === "HypergeometricPFQ") continue;
          expect(answered(answer, c.head), `${route}: ${answer.toString()}`).toBe(false);
        } else if (answered(answer, c.head)) {
          expect(distance(answer, c.value), `${route}: ${answer.toString()}`).toBeLessThan(
            bound(claimed(answer, c.digits)),
          );
        }
      }
      // .N() always answers a case that has a value
      if (c.value !== "declines") expect(answered(routes[0]![1], c.head)).toBe(true);
    });
  }
});

describe("a sign, a truncation and a zero test read the bignum", () => {
  const evaluate = (call: Json) => ce.box(call as never).evaluate();

  test("RealSign and Csgn of a part below the double's range are its sign, not 0", () => {
    ce.precision = 30; // a literal read at machine precision is a double, which is 0 here
    expect(evaluate(["RealSign", num("1e-400")]).re).toBe(1);
    expect(evaluate(["RealSign", num("-1e-400")]).re).toBe(-1);
    expect(evaluate(["Csgn", num("1e-400")]).re).toBe(1);
    expect(evaluate(["Csgn", ["Complex", 0, num("-1e-400")]]).re).toBe(-1);
  });

  test("FractionalPart and IntegerPart of a decimal with more digits than a double keep them", () => {
    ce.precision = 30;
    expect(evaluate(["FractionalPart", num("3.14159265358979323846264338327950288")]).toString()).toBe(
      "0.14159265358979323846264338328",
    );
    expect(evaluate(["FractionalPart", num("1e-400")]).toString()).toBe("1e-400");
    expect(evaluate(["FractionalPart", num("-12345678901234567890.123456789012345678")]).toString()).toBe(
      "-0.123456789012345678",
    );
    expect(evaluate(["IntegerPart", num("12345678901234567890.5")]).toString()).toBe("12345678901234567890");
  });

  test("ExpIntegralE(n, 0) reads Re n > 1 exactly: n = 1 + 1e-20 is 1e20, n = 1 − 1e-20 is a pole", () => {
    ce.precision = 30;
    expect(
      ce
        .box(["ExpIntegralE", num("1.00000000000000000001"), 0] as never)
        .N()
        .toString(),
    ).toBe("100000000000000000000");
    expect(
      ce
        .box(["ExpIntegralE", num("0.99999999999999999999"), 0] as never)
        .N()
        .toString(),
    ).toBe("~oo"); // ComplexInfinity
  });
});

// Heads whose kernel reads a double: an operand of 1e-400 is 0 there, and SinIntegral(0) = 0, CosIntegral(0) = −∞.
// The value at 1e-400 is 1e-400 (SinIntegral) or −920.9… (CosIntegral): carried, or unevaluated, never 0 or ∞.
const UNDERFLOW_CALLS: [string, Json][] = [
  ["SinIntegral", ["SinIntegral", num("1e-400")]],
  ["SinhIntegral", ["SinhIntegral", num("1e-400")]],
  ["CosIntegral", ["CosIntegral", num("1e-400")]],
  ["ExpIntegralEi", ["ExpIntegralEi", num("1e-400")]],
  ["Gudermannian", ["Gudermannian", num("1e-400")]],
  ["HarmonicNumber", ["HarmonicNumber", num("1e-400")]],
  ["RiemannSiegelTheta", ["RiemannSiegelTheta", num("1e-400")]],
  ["JacobiSN", ["JacobiSN", num("1e-400"), ["Rational", 1, 2]]],
  ["JacobiNS", ["JacobiNS", num("1e-400"), ["Rational", 1, 2]]],
  ["JacobiAmplitude", ["JacobiAmplitude", num("1e-400"), ["Rational", 1, 2]]],
  ["ChebyshevT", ["ChebyshevT", 1, num("1e-400")]],
  ["HermiteH", ["HermiteH", 1, num("1e-400")]],
  ["BesselK", ["BesselK", 1, num("1e-400")]],
  // an operand whose double is the pole: the values are finite (2F1 is 46.05…, li is −45.5…, K(1 + 1e-20) is 24.4 + 1.57i)
  ["Hypergeometric2F1", ["Hypergeometric2F1", 1, 1, 2, num("0.99999999999999999999")]],
  ["Hypergeometric2F1", ["Hypergeometric2F1", 1, 1, 2, num("1.00000000000000000001")]],
  ["EllipticK", ["EllipticK", num("1.00000000000000000001")]],
  ["LogIntegral", ["LogIntegral", num("1.00000000000000000001")]],
  ["PrimeZetaP", ["PrimeZetaP", num("1.00000000000000000001")]],
];

test.each(UNDERFLOW_CALLS)(
  "%s at a double's pole or zero is a value or unevaluated, never 0 or infinite",
  (head, call) => {
    for (const digits of [30, 50]) {
      ce.precision = digits;
      const answer = ce.box(call as never).N();
      if (!answered(answer, head)) continue;
      // A bignum below the double range (1e-400) is a value whose double is 0.
      const zero = (part: { bignumRe?: { isZero(): boolean }; re: number }) =>
        part.bignumRe === undefined ? part.re === 0 : part.bignumRe.isZero();
      expect(zero(answer) && answer.im === 0, answer.toString()).toBe(false);
      expect(Number.isFinite(answer.re) && Number.isFinite(answer.im), answer.toString()).toBe(true);
    }
  },
);

// The whole grid (115 rows at 30 and 50 digits) runs under DEEP_TESTS=1; the standard run keeps every seventh row.
interface Row {
  head: string;
  args: string[];
  value: [string, string];
}

const operand = (s: string): Json => (/[.e]/.test(s) ? { num: s } : Number(s));
const callOf = (row: Row): Json => {
  const a = row.args;
  if (row.head === "HypergeometricPFQ")
    return [row.head, ["List", operand(a[0]!), operand(a[1]!)], ["List", operand(a[2]!)], operand(a[3]!)];
  if (row.head === "BellY") return [row.head, Number(a[0]), Number(a[1]), ["List", ...a.slice(2).map(operand)]];
  return [row.head, ...a.map(operand)];
};

/** The part's relative distance in units of 10^-digits; the part is 0 where mpmath's is. */
function partDistance(x: BigDecimal | undefined, value: string): number {
  const reference = new BigDecimal(value);
  if (reference.isZero()) return x === undefined || x.isZero() ? 0 : Infinity;
  if (x === undefined) return Infinity;
  return x.sub(reference).abs().div(reference.abs()).toNumber();
}

const DEEP = process.env.DEEP_TESTS === "1";
const rows = (grid as Row[]).filter((_, i) => DEEP || i % 7 === 0);

describe("the grid around each special point: right or declined, at 30 and 50 digits", () => {
  for (const digits of DEEP ? [30, 50] : [30]) {
    test(`${rows.length} rows at ${digits} digits`, () => {
      ce.precision = digits;
      for (const row of rows) {
        const answer = ce.box(callOf(row) as never).N();
        if (!answered(answer, row.head)) continue; // a decline is not an answer
        const text = answer.toString();
        const re = partDistance(answer.bignumRe ?? new BigDecimal(String(answer.re)), row.value[0]);
        const im = partDistance(answer.bignumIm ?? new BigDecimal(String(answer.im)), row.value[1]);
        expect(Math.max(re, im), `${row.head}(${row.args.join(", ")}) = ${text}`).toBeLessThan(
          bound(claimed(answer, digits)),
        );
      }
    });
  }
});
