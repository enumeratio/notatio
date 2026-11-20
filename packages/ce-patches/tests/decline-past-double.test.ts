import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import {
  applyAllPatches,
  doubleBox,
  evaluateHurwitz,
  evaluatePolygamma,
  evaluateZeta,
  isMachineNumber,
  setZetaKernel,
} from "../src/index.ts";

// A numeric call that asks for more digits than a double holds stays unevaluated where only a double
// kernel could answer; at machine precision the double stands.

const ce = new ComputeEngine();
applyAllPatches(ce);

const z = ["Complex", 0.6, 0.8];
const doubleRoutes: [string, unknown][] = [
  ["LerchPhi past |z| = 1", ["LerchPhi", 2, 2, 1.5]],
  ["LerchPhi on the rim", ["LerchPhi", z, 2, 1.5]],
  ["LerchPhi at a complex s", ["LerchPhi", 0.5, ["Complex", 1, 1], 1.5]],
  ["LerchPhi at a complex z", ["LerchPhi", ["Complex", 0.3, 0.3], 2, 1.5]],
];

const atPrecision = <T>(digits: number, run: () => T): T => {
  const precision = ce.precision;
  ce.precision = digits;
  try {
    return run();
  } finally {
    ce.precision = precision;
  }
};

for (const [name, call] of doubleRoutes) {
  test(`${name} declines at 50 digits and answers a double at machine precision`, () => {
    expect(atPrecision(50, () => ce.box(call as never).N()).operator).toBe("LerchPhi");
    const machine = ce.box(call as never).N();
    expect(machine.operator).not.toBe("LerchPhi");
    expect(Number.isFinite(machine.re)).toBe(true);
  });
}

test("PolyGamma at a complex argument runs on doubles: declined at 50 digits, answered at machine precision", () => {
  const ops = [ce.number(2), ce.box(["Complex", 1, 1] as never)];
  const native = () => undefined;
  const call = (digits: number | undefined) => {
    const run = () => evaluatePolygamma(ce, native as never, ops, { engine: ce, numericApproximation: true } as never);
    return digits === undefined ? run() : atPrecision(digits, run);
  };
  expect(call(50)).toBeUndefined();
  expect(call(undefined)?.operator).not.toBe("PolyGamma");
});

test("HurwitzZeta and Zeta on the double kernel decline at 50 digits and answer at machine precision", () => {
  setZetaKernel("double");
  try {
    const hurwitz = [ce.number(2.5), ce.number(1.5)];
    const generalized = [ce.number(2.5), ce.number(-1.5)];
    expect(atPrecision(50, () => evaluateHurwitz(ce, hurwitz, true))).toBeUndefined();
    expect(atPrecision(50, () => evaluateZeta(ce, generalized, true))).toBeUndefined();
    expect(Number.isFinite(evaluateHurwitz(ce, hurwitz, true)?.re ?? NaN)).toBe(true);
    expect(Number.isFinite(evaluateZeta(ce, generalized, true)?.re ?? NaN)).toBe(true);
  } finally {
    setZetaKernel("bignum");
  }
});

// A bignum answer that prints short is no double's: ζ(-2, 1/4) is exactly -1/64.
test("a short bignum answer still answers at 50 digits through the wrapped native route", () => {
  const exact = atPrecision(50, () => ce.box(["HurwitzZeta", -2, ["Divide", 1, 4]] as never).N());
  expect(exact.operator).not.toBe("HurwitzZeta");
  expect(exact.re).toBe(-0.015625);
});

test("isMachineNumber reads a double by kind and a short bignum by what it is", () => {
  const asBignum = atPrecision(50, () => ce.box({ num: "0.25" } as never));
  expect(isMachineNumber(asBignum, 50)).toBe(false);
  expect(isMachineNumber(doubleBox(ce.number(0.25)), 50)).toBe(true);
  expect(isMachineNumber(doubleBox(ce.number(3)), 50)).toBe(true);
  expect(isMachineNumber(ce.number(3), 50)).toBe(false);
  // A complex keeps a bignum behind each part however it was built, so an unboxed one is read by its print:
  // an exact complex answer with a short part declines (the safe side), a long double-like run does too.
  expect(isMachineNumber(ce.box(["Complex", 0.1, 0.3] as never), 50)).toBe(true);
  expect(isMachineNumber(ce.box(["Complex", 0.5, 0.25] as never), 50)).toBe(false);
});
