import { createEngine } from "@notatio/engine/testing";
import { compileExpression } from "@notatio/engine/compiled";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

const ce = createEngine(declareAnalytic);

// A double kernel's answer is a double, so it never claims to be an exact integer or an exact zero; an exact operand
// with a closed form answers exactly, and a float operand answers a float.

const run = (call: unknown, how: "evaluate" | "N", digits?: number) => {
  const precision = ce.precision;
  try {
    if (digits !== undefined) ce.precision = digits;
    const expr = ce.box(call as never);
    return how === "N" ? expr.N() : expr.evaluate();
  } finally {
    ce.precision = precision;
  }
};
const isExact = (x: unknown): boolean => (x as { isExact?: boolean }).isExact === true;

const heads: [string, (x: unknown) => unknown[]][] = [
  ["ChebyshevT", (x) => ["ChebyshevT", 0, x]],
  ["ChebyshevU", (x) => ["ChebyshevU", 0, x]],
  ["HermiteH", (x) => ["HermiteH", 0, x]],
  ["LaguerreL", (x) => ["LaguerreL", 0, x]],
  ["LaguerreL (a)", (x) => ["LaguerreL", 0, 2, x]],
  ["LegendrePolynomial", (x) => ["LegendrePolynomial", 0, x]],
];

test("a degree-0 member is 1 without reading x: exact for an exact x, a float for a float x, at any precision", () => {
  for (const [name, call] of heads) {
    for (const how of ["evaluate", "N"] as const) {
      for (const digits of [undefined, 50]) {
        const floatAnswer = run(call(0.3), how, digits);
        expect(floatAnswer.re, `${name} ${how} ${digits}`).toBe(1);
        expect(isExact(floatAnswer), `${name} float ${how} ${digits}`).toBe(false);
        const exactAnswer = run(call(["Rational", 1, 3]), how, digits);
        expect(exactAnswer.re, `${name} exact ${how} ${digits}`).toBe(1);
      }
    }
    expect(isExact(run(call("x"), "evaluate")), `${name} symbolic`).toBe(true);
    expect(isExact(run(call(2), "N", 50)), `${name} exact integer`).toBe(true);
  }
});

test("a Jacobi function at an exact m = 0 is exact where it has a closed form, and a float at a float operand", () => {
  expect(isExact(run(["JacobiDN", 1, 0], "evaluate"))).toBe(true);
  expect(isExact(run(["JacobiDN", 1, 0], "N"))).toBe(true);
  expect(isExact(run(["JacobiND", ["Rational", 1, 2], 0], "evaluate"))).toBe(true);
  // an infinite operand (i·K(1)) is no written float
  const infinite = ["Multiply", ["Complex", 0, 1], ["EllipticK", 1]];
  for (const head of ["JacobiDN", "JacobiND"]) {
    for (const how of ["evaluate", "N"] as const) {
      const answer = run([head, infinite, 0], how);
      expect(answer.re).toBe(1);
      expect(isExact(answer), `${head} ${how}`).toBe(true);
    }
  }
  for (const how of ["evaluate", "N"] as const) {
    for (const call of [
      ["JacobiDN", 0.5, 0],
      ["JacobiDN", 1, { num: "0.0" }],
      ["JacobiND", 0.5, 0],
    ]) {
      const answer = run(call, how);
      expect(answer.re).toBe(1);
      expect(isExact(answer), `${JSON.stringify(call)} ${how}`).toBe(false);
    }
  }
});

test("a zero from a double kernel declines past a double's digits unless an exact route produced it", () => {
  // L₁(1 + 1e-20) = −1e-20: the decimal is read exactly, and the kernel's 0 is a double's.
  const near = { num: "1.00000000000000000001" };
  expect(run(["LaguerreL", 1, near], "N", 50).operator).toBe("LaguerreL");
  // L₁(1) = 0 exactly, on exact operands.
  const exact = run(["LaguerreL", 1, 1], "N", 50);
  expect(exact.re).toBe(0);
  expect(isExact(exact)).toBe(true);
  for (const head of ["ChebyshevT", "HermiteH", "LegendrePolynomial"]) {
    const exactZero = run([head, 1, 0], "N", 50);
    expect(exactZero.re, head).toBe(0);
    expect(isExact(exactZero), `${head} exact`).toBe(true);
    // the same zero on a float operand is a double's
    expect(run([head, 1, { num: "0.0" }], "N", 50).operator, `${head} float`).toBe(head);
  }
  // a float zero still prints as it does at machine precision
  expect(run(["LaguerreL", 1, 1.0], "N").re).toBe(0);
});

test("the compiled degree-0 and L₁(1) values agree with the interpreter", () => {
  for (const call of [
    ["ChebyshevT", 0, "x"],
    ["HermiteH", 0, "x"],
    ["LaguerreL", 0, "x"],
    ["LaguerreL", 1, "x"],
  ]) {
    const run = compileExpression(ce.box(call as never));
    expect(run, JSON.stringify(call)).toBeDefined();
    for (const x of [0.3, 1]) {
      const bound = ce.box(call as never).subs({ x } as never);
      expect(run?.({ x })).toBeCloseTo(bound.N().re, 12);
    }
  }
});
