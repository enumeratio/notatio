// unstable: a bare engine to declare the analytic library against
import { BigDecimal } from "@notatio/engine";
import { ComputeEngine } from "@notatio/engine/unstable";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// LerchPhi(z, s, a) and Zeta(s, a) branch on an operand's value (Φ(1, s, a) = ζ(s, a), Φ(0, s, a) = a^(−s),
// Zeta(s, 0) = ζ(s)), and each test read the double. A bignum that is not its double took the wrong branch:
//   Φ(1 − 1e-20, 1, 1) is 46.05 and was ComplexInfinity;
//   Φ(0, 2 + 1e-20, −½) is 4 − 1.26e-19i and was NaN;
//   Zeta(2, 1e-400) is 1e800 and was ζ(2).
// Every route (evaluate, .N(), N(·, d), the parse route) answers right or stays unevaluated. A route that falls back to
// the machine kernel (evaluate(), and .N() where a call has no bignum kernel) answers a double, held to
// 1e-15; one that answers at the engine's digits is held to them. Values are mpmath's lerchphi and zeta at 100 digits.

const ce = new ComputeEngine();
declareAnalytic(ce);
afterEach(() => {
  ce.precision = "machine";
});

type Json = string | number | { num: string } | readonly [string, ...Json[]];
interface Answer {
  readonly operator: string;
  readonly re: number;
  readonly im: number;
  readonly bignumRe?: BigDecimal;
  readonly bignumIm?: BigDecimal;
  toString(): string;
}

/** The answers of a call at `digits`: .N(), N(·, d), and evaluate() of the call. */
function routes(call: Json, digits: number): [string, Answer][] {
  ce.precision = digits;
  return [
    [".N()", ce.box(call as never).N() as Answer],
    ["N(·, d)", ce.box(["N", call, digits] as never).evaluate() as Answer],
    ["evaluate()", ce.box(call as never).evaluate() as Answer],
  ];
}

const part = (big: BigDecimal | undefined, double: number): BigDecimal => big ?? new BigDecimal(String(double));

/** A double's worth of digits: the machine kernel's answer, not the engine's. */
const isMachine = (answer: Answer): boolean =>
  [answer.bignumRe, answer.bignumIm].every((x) => x === undefined || x.toPrecision(18).eq(x));

/**
 * `answer` is a number whose parts are within the digits it carries of `value` (relative, each part): 1e-15 for a
 * double, 10^(1 − digits) otherwise. Fails for a symbol such as ComplexInfinity, NaN, or a wrong digit.
 */
function expectRight(answer: Answer, [re, im]: [string, string], digits: number, label: string): void {
  // 1e800 is the bignum; its double is Infinity
  const finite = Number.isFinite(answer.re) || answer.bignumRe !== undefined;
  expect(finite && !/Infinity|NaN/.test(answer.toString()), `${label}: not a number: ${answer.toString()}`).toBe(true);
  const [reRef, imRef] = [new BigDecimal(re), new BigDecimal(im)];
  const rel = (x: BigDecimal, r: BigDecimal) =>
    x
      .sub(r)
      .abs()
      .div(r.isZero() ? reRef.abs() : r.abs())
      .toNumber();
  const distance = Math.max(rel(part(answer.bignumRe, answer.re), reRef), rel(part(answer.bignumIm, answer.im), imRef));
  expect(distance, `${label}: ${answer.toString()}`).toBeLessThan(isMachine(answer) ? 1e-15 : 10 ** (1 - digits));
}

describe("Φ(1 − 1e-20, s, a) is not the pole's value: every route declines or answers right", () => {
  const z = { num: "0.99999999999999999999" };
  // mpmath: lerchphi(mpf('0.99999999999999999999'), s, 1) at 100 digits
  for (const [s, value] of [
    [1, "46.05170185988091368082034611228609328883"],
    [2, "1.644934066848226436018347488715698316773"],
  ] as const) {
    test(`Φ(1 − 1e-20, ${s}, 1) at 30 digits`, () => {
      for (const [route, answer] of routes(["LerchPhi", z, s, 1], 30)) {
        if (answer.operator !== "LerchPhi") expectRight(answer, [value, "0"], 30, route);
      }
    });
  }

  test("the parse route", () => {
    ce.precision = 30;
    const parsed = ce.parse("\\operatorname{LerchPhi}(0.99999999999999999999, 1, 1)").N() as Answer;
    if (parsed.operator !== "LerchPhi") {
      expectRight(parsed, ["46.05170185988091368082034611228609328883", "0"], 30, "parse");
    }
  });

  test("an exact z = 1 is still ζ(s, a): Φ(1, 2, 1) = ζ(2)", () => {
    ce.precision = 30;
    const answer = ce.box(["LerchPhi", 1, 2, 1] as never).N() as Answer;
    expectRight(answer, ["1.644934066848226436472415166646025189219", "0"], 30, "Φ(1, 2, 1)");
  });
});

describe("Φ(0, 2 + 1e-20, −½) is 4 − 1.26e-19i: every route answers with both parts right", () => {
  // mpmath: lerchphi(0, mpf(2) + mpf(10)**-20, mpf(-0.5)) at 100 digits
  const value: [string, string] = [
    "4.000000000000000000027725887222397812375",
    "-1.256637061435917295393767697673015562201e-19",
  ];
  for (const a of [["Rational", -1, 2], { num: "-0.5" }] as Json[]) {
    test(`a = ${JSON.stringify(a)}, 30 digits`, () => {
      for (const [route, answer] of routes(["LerchPhi", 0, { num: "2.00000000000000000001" }, a], 30)) {
        expect(answer.operator, route).not.toBe("LerchPhi");
        expectRight(answer, value, 30, route);
      }
    });
  }

  test("the parse route", () => {
    ce.precision = 30;
    const parsed = ce.parse("\\operatorname{LerchPhi}(0, 2.00000000000000000001, -\\frac{1}{2})").N() as Answer;
    expectRight(parsed, value, 30, "parse");
  });
});

describe("Zeta(2, 1e-400) is 1e800, not ζ(2): every route carries it scaled", () => {
  for (const head of ["Zeta", "HurwitzZeta"]) {
    test(`${head}, 30 digits`, () => {
      // mpmath: zeta(2, mpf('1e-400')) = 1.0e800 (ζ(2) is its 800th digit)
      for (const [route, answer] of routes([head, 2, { num: "1e-400" }], 30)) {
        // 1e800 is no double, so evaluate() at machine precision stays unevaluated; a number is held to the digits.
        if (answer.operator !== head) expectRight(answer, ["1e800", "0"], 30, route);
      }
      expect(routes([head, 2, { num: "1e-400" }], 30)[0]![1].operator).not.toBe(head);
    });
  }

  test("the parse route", () => {
    ce.precision = 30;
    const parsed = ce.parse("\\operatorname{HurwitzZeta}(2, 1e-400)").N() as Answer;
    expectRight(parsed, ["1e800", "0"], 30, "parse");
  });

  test("Zeta(−1, 1e-400) = −1/12 (mpmath: zeta(-1, mpf('1e-400')))", () => {
    for (const [route, answer] of routes(["Zeta", -1, { num: "1e-400" }], 30)) {
      expectRight(answer, ["-0.08333333333333333333333333333333333333333", "0"], 30, route);
    }
  });

  test("an exact zero a is still ζ(s)", () => {
    ce.precision = 30;
    const answer = ce.box(["Zeta", 2, 0] as never).N() as Answer;
    expectRight(answer, ["1.644934066848226436472415166646025189219", "0"], 30, "Zeta(2, 0)");
  });
});
