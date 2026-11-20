import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// RC(x, y) ~ −ln(y)/(2√x) as y → 0: the integral diverges at y = 0, and a tiny y is finite.

const ce = createEngine(declareAnalytic);

test("RC at its pole y = 0 is infinite on every route, never a huge number", () => {
  for (const x of [2, 2.5, 0, { num: "2.0000000000000000000000000000001" }]) {
    const call = ["CarlsonRC", x, 0];
    expect(ce.box(call as never).evaluate().json).toEqual("PositiveInfinity");
    expect(ce.box(call as never).N().json).toEqual("PositiveInfinity");
    expect(ce.box(["N", call, 40] as never).evaluate().json).toEqual("PositiveInfinity");
  }
  for (const x of [-2, ["Complex", 1, 2]]) {
    expect(ce.box(["CarlsonRC", x, 0] as never).N().json).toEqual("ComplexInfinity");
  }
});

test("RC at a y far below the working digits stays finite (mpmath elliprc(2, 1e-100))", () => {
  const value = ce.box(["N", ["CarlsonRC", 2, { num: "1e-100" }], 30] as never).evaluate();
  expect((value.json as { num: string }).num).toBe("82.1438702833587526244470415676");
});

test("y below the double's range is not the pole: RC(2, 1e-400) is finite or declines", () => {
  // mpmath elliprc(2, 1e-400) = 326.3735… ; the double of 1e-400 is 0, the bignum is not.
  for (const call of [
    ["CarlsonRC", 2, { num: "1e-400" }],
    ["N", ["CarlsonRC", 2, { num: "1e-400" }], 30],
  ]) {
    const json = JSON.stringify(ce.box(call as never).evaluate().json);
    expect(json).not.toContain("Infinity");
  }
});
