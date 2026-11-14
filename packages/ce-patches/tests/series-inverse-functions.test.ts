import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { applyAllPatches } from "../src/index.ts";

const ce = new ComputeEngine();
applyAllPatches(ce);

const series = (f: unknown, order?: number, engine: ComputeEngine = ce) =>
  engine.box(["Series", f, "x", 0, ...(order === undefined ? [] : [order])] as never).evaluate();
const power = (k: number) => ["Power", "x", k];
const rational = (p: number, q: number, k: number) => ["Multiply", ["Rational", p, q], power(k)];

test("Series(Arctan(x), x, 0, 7) is the Gregory series", () => {
  expect(series(["Arctan", "x"], 7).json).toEqual([
    "Add",
    rational(-1, 7, 7),
    rational(1, 5, 5),
    rational(-1, 3, 3),
    "x",
    ["BigO", power(9)],
  ]);
});

test("Series(Arcsin(x), x, 0, 5) and Series(Arccos(x), x, 0, 5) are the standard expansions", () => {
  expect(series(["Arcsin", "x"], 5).json).toEqual([
    "Add",
    rational(3, 40, 5),
    rational(1, 6, 3),
    "x",
    ["BigO", power(7)],
  ]);
  expect(series(["Arccos", "x"], 3).json).toEqual([
    "Add",
    rational(-1, 6, 3),
    ["Negate", "x"],
    ["BigO", power(5)],
    ["Multiply", ["Rational", 1, 2], "Pi"],
  ]);
});

test("a composite argument and the remainder term follow the native answer", () => {
  expect(series(["Arctan", ["Power", "x", 2]], 3).json).toEqual(["Add", power(2), ["BigO", power(4)]]);
  expect(series(["Arctan", ["Multiply", 2, "x"]], 3).json).toEqual([
    "Add",
    rational(-8, 3, 3),
    ["Multiply", 2, "x"],
    ["BigO", power(5)],
  ]);
});

test("Arcsinh and Arctanh expand rather than stay as derivatives at 0", () => {
  expect(series(["Arcsinh", "x"], 3).json).toEqual(["Add", rational(-1, 6, 3), "x", ["BigO", power(5)]]);
  expect(series(["Arctanh", "x"], 3).json).toEqual(["Add", rational(1, 3, 3), "x", ["BigO", power(5)]]);
});

test("the default order, the parse route and .N() agree", () => {
  const evaluated = series(["Arctan", "x"]);
  expect(evaluated.json).toEqual(["Add", rational(1, 5, 5), rational(-1, 3, 3), "x", ["BigO", power(7)]]);
  const parsed = ce.parse("\\operatorname{Series}(\\arctan x, x, 0, 3)").evaluate();
  expect(parsed.json).toEqual(series(["Arctan", "x"], 3).json);
  const numeric = ce.box(["Series", ["Arctan", "x"], "x", 0, 3] as never).N();
  expect(numeric.operator).toBe("Add");
  expect(numeric.json).toEqual(expect.arrayContaining([["BigO", power(5)]]));
  expect(JSON.stringify(numeric.json)).toContain("0.333");
});

test("a point other than 0, or an argument not vanishing there, is the native answer", () => {
  expect(series(["Arctan", ["Add", "x", 1]], 1).operator).not.toBe("Series");
  const atOne = ce.box(["Series", ["Arctan", "x"], "x", 1, 2] as never).evaluate();
  expect(JSON.stringify(atOne.json)).toContain("Pi");
});

test("an inverse function of Sin(x) agrees with the series composed by hand", () => {
  expect(series(["Arctan", ["Sin", "x"]], 5).json).toEqual([
    "Add",
    rational(3, 8, 5),
    rational(-1, 2, 3),
    "x",
    ["BigO", power(7)],
  ]);
});

test("the patched Series is as fast as a trig one", () => {
  const started = performance.now();
  series(["Arctan", "x"], 7);
  series(["Arcsin", "x"], 7);
  expect(performance.now() - started).toBeLessThan(300);
});

// The full comparison with compute-engine's own handler, whose cost doubles with each order.
for (const head of ["Arctan", "Arcsin", "Arccos", "Arccot"]) {
  test.runIf(process.env.DEEP_TESTS === "1")(`${head} through order 6 matches the native handler`, () => {
    const native = new ComputeEngine();
    for (let order = 1; order <= 6; order++) {
      expect(series([head, "x"], order).json, `${head} ${order}`).toEqual(series([head, "x"], order, native).json);
    }
  });
}
