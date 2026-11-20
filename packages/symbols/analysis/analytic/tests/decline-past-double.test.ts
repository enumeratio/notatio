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
  ["Beta at a complex operand", ["Beta", ["Complex", 0.5, 0.7], 0.7]],
  ["Digamma at a complex z", ["Digamma", ["Complex", 0.5, 0.7]]],
  ["LambertW at a complex z", ["LambertW", ["Complex", 0.5, 0.7]]],
  ["Gudermannian at a float", ["Gudermannian", 0.7]],
  ["Gudermannian at a complex z", ["Gudermannian", ["Complex", 0.5, 0.7]]],
  ["Hyperfactorial at a float", ["Hyperfactorial", 0.7]],
  ["HypergeometricU at floats", ["HypergeometricU", 0.7, 2.3, 0.4]],
  ["HypergeometricUStar at floats", ["HypergeometricUStar", 0.7, 2.3, 0.4]],
  ["BernoulliB at a float", ["BernoulliB", 2, 0.7]],
  ["BernoulliPolynomial at a float", ["BernoulliPolynomial", 2, 0.7]],
  ["NorlundB at a float", ["NorlundB", 2, 0.7]],
  ["TriangleWave at a float", ["TriangleWave", 0.7]],
  ["RiemannSiegelTheta at a float", ["RiemannSiegelTheta", 0.7]],
  ["RisingFactorial at a complex operand", ["RisingFactorial", 2, ["Complex", 0.5, 0.7]]],
  ["IncompleteEllipticE at a complex parameter", ["IncompleteEllipticE", 0.7, ["Complex", 0.5, 0.7]]],
  ["IncompleteEllipticF at a complex parameter", ["IncompleteEllipticF", 0.7, ["Complex", 0.5, 0.7]]],
];

for (const [name, call] of routes) {
  test(`${name} declines at 50 digits and answers a double at machine precision`, () => {
    expect(at(50, call).operator).toBe(call[0]);
    const machine = at(undefined, call);
    expect(machine.operator).not.toBe(call[0]);
    expect(Number.isFinite(machine.re)).toBe(true);
  });
}

test("LerchPhi next to z = 1 answers from the exact z (the series about z = 1) or not at all, never with a double at 50 digits", () => {
  const near = { num: "0.99999999999999999999" };
  const answer = at(50, ["LerchPhi", near, 2, 1]);
  // mpmath: lerchphi(1 - 1e-20, 2, 1) = 1.644934066848226436018347488715698316773207500064088…
  expect(answer.operator).not.toBe("LerchPhi");
  expect(answer.bignumRe?.toString().startsWith("1.644934066848226436018347488715698316773207500064")).toBe(true);
  expect(at(undefined, ["LerchPhi", near, 2, 1]).re).toBeCloseTo(1.6449340668482264, 14);
  // Li_1 is -ln(1 - z), which the bignum reads exactly.
  expect(at(50, ["LerchPhi", near, 1, 1]).re).toBeCloseTo(46.0517018598809, 12);
});

// The orthogonal polynomials at an exact degree run the three-term recurrence in bignums from the operand's decimal
// (orthogonal-recurrence.test.ts), so at 50 digits they answer to them instead of declining a double.
test.each([
  ["ChebyshevT", ["ChebyshevT", 2, 0.7], "-0.02"],
  ["ChebyshevU", ["ChebyshevU", 2, 0.7], "0.96"],
  ["HermiteH", ["HermiteH", 2, 0.7], "-0.04"],
  ["LaguerreL", ["LaguerreL", 2, 0.7], "-0.155"],
  ["LegendrePolynomial", ["LegendrePolynomial", 2, 0.7], "0.235"],
])("%s at a float answers from its decimal at 50 digits and a double at machine precision", (_name, call, value) => {
  expect(at(50, call).toString()).toBe(value);
  const machine = at(undefined, call);
  expect(machine.operator).not.toBe(call[0]);
  expect(machine.re).toBeCloseTo(Number(value), 12);
});

// A double that rounds to a whole number is still a double at machine precision: L₁(x) = 1 − x is 1 − 1e-20 here,
// which no double holds; at 50 digits the bignum recurrence answers the 1 − 1e-20 itself.
test("a double kernel that rounds to a whole number answers the double at machine precision, and 50 digits at 50", () => {
  const call = ["LaguerreL", 1, { num: "1e-20" }];
  expect(at(50, call).toString()).toBe("0.99999999999999999999");
  const machine = at(undefined, call);
  expect(machine.operator).not.toBe("LaguerreL");
  expect(machine.re).toBe(1);
});

test("a bignum answer past a double's digits is kept", () => {
  expect(at(50, ["PolyGamma", 1, 2.5]).bignumRe?.toString().length).toBeGreaterThan(40);
  expect(at(50, ["HurwitzZeta", ["Complex", 2, 3], 1.5]).operator).not.toBe("HurwitzZeta");
});
