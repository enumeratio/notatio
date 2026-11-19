// unstable: a bare engine to declare the analytic library against
import { BigDecimal } from "@notatio/engine";
import { ComputeEngine } from "@notatio/engine/unstable";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// ζ(s) and ζ(s, a) at a real s next to an integer that it is not: s = −2 − 1e-16 is the double −2
// but not −2, and ζ(−2) = 0 where ζ(−2 − 1e-16) = 3.04e-18. compute-engine's own ζ loses digits within
// 1e-30 of an integer and declines next to the pole, and the kernel's plan read s as that double, so
// every route (evaluate, .N(), N(·, d), the parse route) takes the kernel's exact reading of s. Values are
// mpmath's zeta(s, a) at 150 digits (scripts/collect-zeta-near-integer-mpmath.py has the full grid).

const ce = new ComputeEngine();
declareAnalytic(ce);
afterEach(() => {
  ce.precision = "machine";
});

type Json = string | number | { num: string } | readonly [string, ...Json[]];

interface Case {
  /** s, as the decimal the reader keeps at full precision */
  s: string;
  /** a, as JSON and as the text the parse route reads */
  a: { json: Json; latex: string } | undefined;
  digits: number;
  value: string;
}

const A_ONE = undefined;
const A_QUARTER = { json: ["Rational", 1, 4] as Json, latex: "\\frac{1}{4}" };
const A_THREE = { json: 3, latex: "3" };

// mpmath: zeta(s, a) at 150 digits, written to 52
const CASES: Case[] = [
  {
    s: "-2.0000000000000001",
    a: A_ONE,
    digits: 30,
    value: "3.044845705839326749207572109989513583698747213996993e-18",
  },
  {
    s: "-2.0000000000000001",
    a: A_QUARTER,
    digits: 30,
    value: "-0.01562499999999999890654235551976036231648353734999494",
  },
  { s: "-2.0000000000000001", a: A_THREE, digits: 30, value: "-5.000000000000000274214026518138806626745554837309829" },
  { s: "1.0000000000000001", a: A_QUARTER, digits: 30, value: "10000000000000004.22745353337626595989716516603709725" },
  {
    s: "-5.000000000000000000000000000001",
    a: A_QUARTER,
    digits: 50,
    value: "0.00006006634424603174603174603173986378003303578484026102",
  },
  {
    s: "-2.000000000000000000000000000001",
    a: A_ONE,
    digits: 50,
    value: "3.044845705839327078025153047112189488890677094717896e-32",
  },
  {
    s: "-0.000000000000000000000000000001",
    a: A_ONE,
    digits: 30,
    value: "-0.4999999999999999999999999999990810614667953272582197",
  },
];

/** A number, not a ζ call left unevaluated. */
const isNumber = (answer: { operator: string }): boolean =>
  answer.operator !== "Zeta" && answer.operator !== "HurwitzZeta";

/** The relative distance of an answer from mpmath's, or Infinity when the call stayed unevaluated. */
function distance(answer: { operator: string; bignumRe?: BigDecimal; re: number }, value: string): number {
  if (!isNumber(answer)) return Infinity;
  const x = answer.bignumRe ?? new BigDecimal(String(answer.re));
  const reference = new BigDecimal(value);
  return x.sub(reference).abs().div(reference.abs()).toNumber();
}

/** Within one unit of the last of `digits` digits: the value is correctly rounded, so half of one. */
const rounded = (digits: number): number => 10 ** (1 - digits);

describe("ζ next to an integer, every route", () => {
  for (const c of CASES) {
    const name = `ζ(${c.s}${c.a ? `, ${c.a.latex}` : ""}) at ${c.digits} digits`;
    const sJson: Json = { num: c.s };
    const calls: [string, Json][] = c.a
      ? [
          ["HurwitzZeta", ["HurwitzZeta", sJson, c.a.json]],
          ["Zeta", ["Zeta", sJson, c.a.json]],
        ]
      : [
          ["Zeta", ["Zeta", sJson]],
          ["HurwitzZeta", ["HurwitzZeta", sJson, 1]],
        ];

    for (const [head, call] of calls) {
      test(`${head}, ${name}: .N(), evaluate() and N(·, d) agree with mpmath`, () => {
        ce.precision = c.digits;
        const viaN = ce.box(call as never).N();
        const viaEvaluate = ce.box(call as never).evaluate();
        const viaHead = ce.box(["N", call, c.digits] as never).evaluate();
        for (const [route, answer] of [
          [".N()", viaN],
          ["N(·, d)", viaHead],
        ] as const) {
          expect(distance(answer, c.value), `${route}: ${answer.toString()}`).toBeLessThan(rounded(c.digits));
        }
        // evaluate() of a decimal that is not a double reads at machine precision, where it declines rather than
        // answer for the integer its double is.
        if (isNumber(viaEvaluate)) {
          expect(distance(viaEvaluate, c.value), `evaluate(): ${viaEvaluate.toString()}`).toBeLessThan(
            rounded(c.digits),
          );
        } else {
          expect(viaEvaluate.operator).toBe(head);
        }
      });
    }

    test(`the parse route, ${name}`, () => {
      ce.precision = c.digits;
      const text = c.a ? `\\operatorname{HurwitzZeta}(${c.s}, ${c.a.latex})` : `\\zeta(${c.s})`;
      const parsed = ce.parse(text).N();
      expect(distance(parsed, c.value), parsed.toString()).toBeLessThan(rounded(c.digits));
    });
  }
});

test("an exact rational s, −20000000000000001/10^16, is read exactly: .N() and N(·, d) agree with mpmath", () => {
  const s: Json = ["Rational", { num: "-20000000000000001" }, { num: "10000000000000000" }];
  ce.precision = 30;
  for (const [call, value] of [
    [["Zeta", s], "3.044845705839326749207572109989513583698747213996993e-18"],
    [["HurwitzZeta", s, ["Rational", 1, 4]], "-0.01562499999999999890654235551976036231648353734999494"],
  ] as const) {
    for (const answer of [ce.box(call as never).N(), ce.box(["N", call, 30] as never).evaluate()]) {
      expect(distance(answer, value), answer.toString()).toBeLessThan(rounded(30));
    }
  }
});

test("a double next to an integer reads as the double it is, at machine precision", () => {
  // ζ(−2 + 2^−51) from the exact double: ζ'(−2)·2^−51 = −ζ(3)/(4π²)·2^−51
  const s = -2 + 2 ** -51;
  const answer = ce.box(["N", ["Zeta", s]] as never).evaluate();
  expect(isNumber(answer)).toBe(true);
  const expected = (-1.2020569031595942 / (4 * Math.PI ** 2)) * 2 ** -51;
  expect(Math.abs(answer.re - expected) / Math.abs(expected)).toBeLessThan(1e-9);
});

test("an exact integer is untouched: ζ(−2) = 0 and ζ(−1) = −1/12", () => {
  expect(ce.box(["Zeta", -2]).evaluate().re).toBe(0);
  expect(ce.box(["Zeta", -1]).evaluate().toString()).toBe("-1/12");
});
