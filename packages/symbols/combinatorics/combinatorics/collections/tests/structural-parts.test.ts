import { bareEngine, createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCollections } from "../src/library.ts";

// First, Last and At read a non-collection's operands as its parts only where they can't change when
// its symbols are bound: an inert call `f(a, b)`, or arithmetic over symbols that are numbers.

const bare = bareEngine();
const declared = createEngine(declareCollections);
const run = (ce: typeof bare, expr: unknown) => JSON.stringify(ce.box(expr as never).evaluate().json);
const fn = (body: unknown, ...params: string[]) => ["Function", body, ...params];
const U = ["List", 1, 2];
const V = ["List", 3, 4];
const sum = ["Add", "u", "v"];
const bodies = { First: ["First", sum], Last: ["Last", sum], At: ["At", sum, 1] };
const answers = { First: 4, Last: 6, At: 4 };

for (const [head, body] of Object.entries(bodies)) {
  const shapes = {
    apply: ["Apply", fn(body, "u", "v"), U, V],
    map: ["Map", fn(["Apply", fn(body, "u", "v"), "p", V], "p"), ["List", U]],
    nested: ["Apply", fn(["Apply", fn(body, "v"), V], "u"), U],
  };

  test(`${head} of a lambda's untyped sum waits for the binding`, () => {
    for (const [name, shape] of Object.entries(shapes)) {
      const ours = run(declared, shape);
      expect(ours, name).toBe(run(bare, shape));
      expect(ours, `${name} read a parameter`).not.toBe(JSON.stringify(U));
    }
    if (head !== "At") expect(run(declared, shapes.apply)).toBe(String(answers[head as keyof typeof answers]));
  });
}

test("At(f(a, b), 1) is a, and inside a lambda applied to lists it is the first list", () => {
  expect(run(declared, ["At", ["f", "a", "b"], 1])).toBe('"a"');
  expect(run(declared, ["Apply", fn(["At", ["f", "u", "v"], 1], "u", "v"), U, V])).toBe(JSON.stringify(U));
});

test("First and Last of an inert call read its operands", () => {
  expect(run(declared, ["First", ["f", "a", "b"]])).toBe('"a"');
  expect(run(declared, ["Last", ["f", "a", "b"]])).toBe('"b"');
});

for (const head of ["First", "Last"] as const) {
  const part = head === "First" ? "a" : "b";
  const typed = () => {
    const ce = createEngine(declareCollections);
    ce.declare("a", "real");
    ce.declare("b", "real");
    return ce;
  };

  test(`${head}(a^2 + b^2) stays unevaluated while a and b may be lists`, () => {
    const expr = [head, ["Add", ["Power", "a", 2], ["Power", "b", 2]]];
    expect(ce_head(run(declared, expr))).toBe(head);
  });

  test(`${head}(a^2 + b^2) is a term once a and b are declared real`, () => {
    const expr = [head, ["Add", ["Power", "a", 2], ["Power", "b", 2]]];
    expect(run(typed(), expr)).toBe(JSON.stringify(["Power", part, 2]));
  });

  test(`a top-level ${head}(u + v) of untyped symbols stays unevaluated`, () => {
    expect(ce_head(run(declared, [head, sum]))).toBe(head);
  });
}

// A typed leaf doesn't make an operand safe: its head may return a list once its operand is bound.
test("an operand whose head returns a list is not read by parts, though its symbol is typed", () => {
  const typedEngines = () => {
    const withN = (ce: typeof bare) => {
      ce.declare("n", "integer");
      return ce;
    };
    return [withN(bareEngine()), withN(createEngine(declareCollections))] as const;
  };
  const [native, ours] = typedEngines();
  for (const call of [
    ["First", ["Divisors", "n"]],
    ["Last", ["IntegerDigits", "n"]],
    ["At", ["Range", "n"], 1],
    ["First", ["FactorInteger", "n"]],
  ]) {
    expect(run(ours, call), JSON.stringify(call)).toBe(run(native, call));
  }
});

// Key is one of ours, typed (any) -> any and left alone for a symbol: its operand is not a part to read.
test("an operand under a head typed (any) -> any is not read by parts", () => {
  const ce = createEngine(declareCollections);
  ce.declare("p", "boolean");
  expect(run(ce, ["First", ["Key", "p"]])).not.toBe('"p"');
});

/** The head of a JSON answer. */
function ce_head(json: string): unknown {
  const parsed = JSON.parse(json) as unknown;
  return Array.isArray(parsed) ? parsed[0] : parsed;
}
