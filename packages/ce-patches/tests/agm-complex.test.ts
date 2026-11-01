import { BigDecimal, ComputeEngine } from "@cortex-js/compute-engine";
import { compile } from "@cortex-js/compute-engine/compile";
import { expect, test } from "vite-plus/test";
import { agm, agmBig } from "../src/compute-engine/numerics/agm.ts";
import { bigCx } from "../src/compute-engine/numerics/hurwitz-zeta-big.ts";
import { applyAllPatches } from "../src/index.ts";

// AGM(1, b) off the positive reals at the engine's precision. Wolfram 15 `N[ArithmeticGeometricMean[1, b], 25]`
// (mpmath agm agrees except across the negative reals, where it takes the principal root at every
// step: AGM(1, -10) = 1.311… + 0.372…i against Wolfram's -2.462… + 2.098…i; see the agm-1-neg-10 record).

const ce = new ComputeEngine();
applyAllPatches(ce);

type Case = { b: unknown; re: string; im: string };
const cases: Case[] = [
  { b: -10, re: "-2.4621818911005727935595731", im: "2.0983173530436351629440678" },
  { b: ["Complex", 2, 3], re: "1.59938399215551992662521043", im: "1.19700133714370243906976998" },
  { b: ["Complex", -1.5, 3.5], re: "0.40935972373543629009853514", im: "1.75043845403108747649394803" },
  {
    // just above the cut: the limit from above is -10's own value, up to the 1e-12 offset
    b: ["Complex", { num: "-10" }, { num: "1e-12" }],
    re: "-2.46218189110042818236366832",
    im: "2.09831735304387197905631613",
  },
  {
    b: ["Complex", { num: "-10" }, { num: "-1e-12" }],
    re: "-2.46218189110042818236366832",
    im: "-2.09831735304387197905631613",
  },
];

const within = (got: BigDecimal | undefined, want: string, digits = 24) =>
  got !== undefined &&
  got
    .sub(new BigDecimal(want))
    .abs()
    .lt(new BigDecimal(`1e-${digits}`));

const atDigits = <T>(digits: number, run: () => T): T => {
  ce.precision = digits;
  try {
    return run();
  } finally {
    ce.precision = "machine";
  }
};

for (const { b, re, im } of cases) {
  test(`AGM(1, ${JSON.stringify(b)}) to 25 digits is Wolfram's value on .N() and N(…, 25)`, () => {
    const viaN = atDigits(25, () => ce.box(["AGM", 1, b] as never).N());
    const viaForm = ce.box(["N", ["AGM", 1, b], 25] as never).evaluate();
    for (const v of [viaN, viaForm]) {
      expect(within(v.bignumRe, re), JSON.stringify(v.json)).toBe(true);
      expect(within(v.bignumIm, im), JSON.stringify(v.json)).toBe(true);
    }
  });
}

test("AGM(b) is AGM(1, b)", () => {
  const v = atDigits(25, () => ce.box(["AGM", -10] as never).N());
  expect(within(v.bignumRe, cases[0]!.re)).toBe(true);
  expect(within(v.bignumIm, cases[0]!.im)).toBe(true);
});

test("the machine route agrees with the bignum one to a double's digits", () => {
  for (const { b, re, im } of cases) {
    const v = ce.box(["AGM", 1, b] as never).N();
    expect(v.re).toBeCloseTo(Number(re), 12);
    expect(v.im).toBeCloseTo(Number(im), 12);
  }
});

test("the doubles and BigDecimals recurrences take the same roots", () => {
  for (const [re, imag] of [
    [-10, 0],
    [2, 3],
    [-1.5, 3.5],
    [-10, 1e-12],
    [-10, -1e-12],
    [-0.001, 5],
  ] as const) {
    const d = agm({ re: 1, im: 0 }, { re, im: imag })!;
    const big = agmBig(bigCx(1), bigCx(re, imag), 20)!;
    expect(big.re.toNumber()).toBeCloseTo(d.re, 12);
    expect(big.im.toNumber()).toBeCloseTo(d.im, 12);
  }
});

test("more digits stay a prefix of the same value", () => {
  const short = atDigits(30, () => ce.box(["AGM", 1, -10] as never).N());
  const long = atDigits(80, () => ce.box(["AGM", 1, -10] as never).N());
  expect(within(long.bignumRe, short.bignumRe!.toString(), 28)).toBe(true);
  expect(within(long.bignumIm, short.bignumIm!.toString(), 28)).toBe(true);
});

test("it declines past its digit cap and at a zero operand, rather than answering", () => {
  expect(agmBig(bigCx(1), bigCx(-10), 600)).toBeUndefined();
  expect(agmBig(bigCx(1), bigCx(0), 20)).toBeUndefined();
  expect(agm({ re: 1, im: 0 }, { re: 0, im: 0 })).toBeUndefined();
  expect(agm({ re: 1, im: 0 }, { re: Infinity, im: 0 })).toBeUndefined();
});

test("exact input stays symbolic on evaluate(), a positive real is unchanged", () => {
  expect(JSON.stringify(ce.box(["AGM", 1, -10] as never).evaluate().json)).toBe('["AGM",1,-10]');
  const v = atDigits(25, () => ce.box(["AGM", 1, 2] as never).N());
  expect(within(v.bignumRe, "1.4567910310469068691864323832", 24)).toBe(true);
});

test("compiled JavaScript keeps native's real lowering: the positive value, NaN off the reals", () => {
  const compiled = compile(ce.box(["AGM", 1, "x"] as never), { to: "javascript" });
  expect(compiled.success).toBe(true);
  const run = compiled.run as (scope: { x: number }) => number;
  expect(run({ x: 2 })).toBeCloseTo(1.4567910310469068, 14);
  expect(run({ x: -10 })).toBeNaN();
});
