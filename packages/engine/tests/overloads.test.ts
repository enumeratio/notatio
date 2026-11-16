import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { defineOverload, type Overload, wrapOperator } from "../src/index.ts";

// Two packages extending one native head: a carrier row and a general one.
const carrier = (ce: ComputeEngine): Overload => ({
  package: "carriers",
  signature: "(value) -> value",
  on: ["Wrapped"],
  arity: 1,
  native: (op) => op.isInteger !== false,
  evaluate: (ops) => ce.box(["Wrapped", ["Fibonacci", (ops[0]!.json as unknown as unknown[])[1]]] as never).evaluate(),
});
const general = (ce: ComputeEngine): Overload => ({
  package: "general",
  signature: "(number, any?) -> any",
  unless: ["Wrapped"],
  when: (ops) => ops.length === 2 || ops[0]!.isInteger === false,
  native: (op) => op.isInteger !== false,
  evaluate: (ops) =>
    ce.box(
      ops.length === 2
        ? ["Tuple", "'poly'", ...ops.map((op) => op.json)]
        : (["Tuple", "'real'", ops[0]!.json] as never),
    ),
});

const engine = (rows: readonly ((ce: ComputeEngine) => Overload)[]): ComputeEngine => {
  const ce = new ComputeEngine();
  ce.declare("Wrapped", { signature: "(any) -> value" });
  for (const row of rows) defineOverload(ce, "Fibonacci", row(ce));
  return ce;
};
const answers = (ce: ComputeEngine): unknown[] =>
  [
    ["Fibonacci", 10],
    ["Fibonacci", 1.5],
    ["Fibonacci", 7, "x"],
    ["Fibonacci", ["Wrapped", 6]],
    ["Fibonacci", "'s'"],
  ].map((expr) => ce.box(expr as never).evaluate().json);

test("declare order doesn't matter: same signature, same answers", () => {
  const ab = engine([carrier, general]);
  const ba = engine([general, carrier]);
  const signature = (ce: ComputeEngine): string =>
    String((ce.lookupDefinition("Fibonacci") as { operator: { signature: unknown } }).operator.signature);
  expect(signature(ab)).toBe(signature(ba));
  expect(answers(ab)).toEqual(answers(ba));
  expect(answers(ab).slice(0, 4)).toEqual([55, ["Tuple", "'real'", 1.5], ["Tuple", "'poly'", 7, "x"], ["Wrapped", 8]]);
});

test("the head's own handler only sees what the gates let through", () => {
  // A string boxes (the carrier row's `value` admits it), no row answers, and the gates keep it
  // from the integer recurrence: it stays unevaluated.
  const [, , , , s] = answers(engine([carrier, general]));
  expect(s).toEqual(["Fibonacci", "'s'"]);
});

test("overrides puts a row ahead of another package's", () => {
  const ce = new ComputeEngine();
  const row = (pkg: string, overrides?: string[]): Overload => ({
    package: pkg,
    signature: "(real) -> any",
    when: (ops) => ops[0]!.isInteger === false,
    ...(overrides ? { overrides } : {}),
    evaluate: () => ce.string(pkg),
  });
  defineOverload(ce, "Fibonacci", row("a"));
  defineOverload(ce, "Fibonacci", row("b", ["a"]));
  expect(ce.box(["Fibonacci", 1.5]).evaluate().json).toBe("'b'");
});

// A row on a lazy head (`Add`, `Multiply`) sees its operands as the call would have evaluated
// them: numerically under `N()`, exactly otherwise. Evaluating them exactly under `N()` changed
// the digits a sum or product printed (the exact operand was approximated later, at another
// precision), so a package's row, even one that never answers, changed the number.
test("a row on a lazy head sees its operands numerically under N and exactly otherwise", () => {
  const seen: string[] = [];
  const spy = (): Overload => ({
    package: "spy",
    signature: "(number, number) -> number",
    gate: () => true,
    compile: "builtin",
    evaluate: (ops, options) => {
      seen.push(`${options.numericApproximation === true ? "N" : "exact"} ${JSON.stringify(ops.map((op) => op.json))}`);
      return undefined;
    },
  });
  const ce = new ComputeEngine();
  // A head that stays a call until it is asked for a number, as a kernel's closed form does.
  ce.declare("Half", {
    signature: "(number) -> number",
    evaluate: (_ops, options) => (options.numericApproximation === true ? ce.number(0.5) : undefined),
  });
  // `Add` and `Multiply` are lazy once a library that needs `Subtract` to canonicalize declares them so.
  for (const head of ["Add", "Multiply"]) {
    (ce.lookupDefinition(head) as { operator: { lazy?: boolean } }).operator.lazy = true;
  }
  for (const head of ["Add", "Multiply"]) defineOverload(ce, head, spy());
  ce.box(["Add", ["Half", 1], 1] as never).N();
  expect(seen).toEqual(["N [1,0.5]"]);
  seen.length = 0;
  ce.box(["Add", ["Half", 1], "x"] as never).evaluate();
  expect(seen).toEqual(['exact ["x",["Half",1]]']);
});

test("a wrapper on a lazy head sees its operands numerically under N and exactly otherwise", () => {
  const seen: string[] = [];
  const ce = new ComputeEngine();
  ce.declare("Half", {
    signature: "(number) -> number",
    evaluate: (_ops, options) => (options.numericApproximation === true ? ce.number(0.5) : undefined),
  });
  (ce.lookupDefinition("Multiply") as { operator: { lazy?: boolean } }).operator.lazy = true;
  wrapOperator(
    ce,
    ["Multiply"],
    (ops) => {
      seen.push(JSON.stringify(ops.map((op) => op.json)));
      return false;
    },
    () => () => undefined,
    { compile: "builtin" },
  );
  ce.box(["Multiply", ["Half", 1], 3] as never).N();
  expect(seen).toEqual(["[3,0.5]"]);
  seen.length = 0;
  ce.box(["Multiply", ["Half", 1], "x"] as never).evaluate();
  expect(seen).toEqual(['["x",["Half",1]]']);
});
