import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

const ce = createEngine(declareAnalytic);

// compute-engine's complex PolyLog, PolyGamma, LogGamma, BarnesG and Zeta, and LerchPhi where it rewrites into
// PolyLog, run on doubles. At more digits than a double holds the call stays unevaluated, where it used to
// answer a double; at machine precision the double stands.

const at = (digits: number | undefined, call: unknown) => {
  const precision = ce.precision;
  try {
    if (digits !== undefined) ce.precision = digits;
    return ce.box(call as never).N();
  } finally {
    ce.precision = precision;
  }
};

const i1 = ["Complex", 1, 1];
const routes: [string, unknown[]][] = [
  ["PolyLog at a complex z", ["PolyLog", 2, ["Complex", 0.5, 0.5]]],
  ["PolyLog past |z| = 1", ["PolyLog", 2, 3.5]],
  ["PolyGamma at a complex z", ["PolyGamma", 0, i1]],
  ["PolyGamma of order 2 at a complex z", ["PolyGamma", 2, i1]],
  ["LogGamma at a complex z", ["LogGamma", i1]],
  ["BarnesG at a complex z", ["BarnesG", i1]],
  ["Zeta at a complex s and a negative a", ["Zeta", ["Complex", 2, 3], -1.5]],
  ["LerchPhi past |z| = 1", ["LerchPhi", 2, 2, 1.5]],
  ["LerchPhi on the rim", ["LerchPhi", ["Complex", 0.6, 0.8], 2, 1.5]],
];

for (const [name, call] of routes) {
  test(`${name} declines at 50 digits and answers a double at machine precision`, () => {
    expect(at(50, call).operator).toBe(call[0]);
    const machine = at(undefined, call);
    expect(machine.operator).not.toBe(call[0]);
    expect(Number.isFinite(machine.re)).toBe(true);
  });
}

test("LerchPhi next to z = 1 answers through PolyLog's bignum kernel or not at all, never with a double at 50 digits", () => {
  const near = { num: "0.99999999999999999999" };
  expect(at(50, ["LerchPhi", near, 2, 1]).operator).toBe("LerchPhi");
  expect(at(undefined, ["LerchPhi", near, 2, 1]).re).toBeCloseTo(1.6449340668482264, 14);
  // Li_1 is -ln(1 - z), which the bignum reads exactly.
  expect(at(50, ["LerchPhi", near, 1, 1]).re).toBeCloseTo(46.0517018598809, 12);
});

test("a bignum answer past a double's digits is kept", () => {
  expect(at(50, ["PolyGamma", 1, 2.5]).bignumRe?.toString().length).toBeGreaterThan(40);
  expect(at(50, ["HurwitzZeta", ["Complex", 2, 3], 1.5]).operator).not.toBe("HurwitzZeta");
});
