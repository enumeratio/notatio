import { ComputeEngine, version } from "@cortex-js/compute-engine";
import { GLSLTarget, JavaScriptTarget } from "@cortex-js/compute-engine/compile";
import { describe, expect, test } from "vite-plus/test";
import { CE_0187_DEFECTS, ce0187Decline, findCe0187Defects } from "../src/ce-0187.ts";
import { compileExpression, compileTyped } from "../src/compiled.ts";

// One probe per known wrong answer of compute-engine 0.187.1's compiler (BL-557), on a bare engine: each asserts that
// the defect is there. The first release that fixes one fails its probe; that tells us the defect is gone, and its
// name (`CE_0187_DEFECTS`, in src/ce-0187.ts) finds every decline to lift. The probes follow the pin and skip in the
// nightly against compute-engine main (ce-main.yml), which runs a newer version on purpose.

type Run = (...args: never[]) => unknown;
interface Compilation {
  readonly code: string;
  readonly run: Run;
}

const js = (expression: unknown, ce: ComputeEngine, options?: object): Compilation =>
  new JavaScriptTarget().compile(ce.box(expression as never), options as never) as unknown as Compilation;

const engine = (types: Record<string, string> = {}): ComputeEngine => {
  const ce = new ComputeEngine();
  for (const [name, type] of Object.entries(types)) ce.declare(name, type);
  return ce;
};

/** What the interpreter answers for `expression` with `values` substituted, as a number. */
const interpreted = (ce: ComputeEngine, expression: unknown, values: Record<string, number>): number =>
  ce
    .box(expression as never)
    .subs(Object.fromEntries(Object.entries(values).map(([name, value]) => [name, ce.number(value)])))
    .N().re;

describe.skipIf(process.env.COMPUTE_ENGINE_MAIN === "1")(
  `compute-engine ${version}'s known compiled wrong answers`,
  () => {
    test("the probes run on the version they were written for", () => {
      expect(version).toBe("0.187.1");
    });

    describe(CE_0187_DEFECTS.parentheses, () => {
      test("an operator-lowered function in a function body is spliced into the operator around it", () => {
        const ce = engine();
        // 2·Fract(y) is 1 at y = 1.5; the code is `2 * y - Math.floor(y)`.
        const fract = js(["Function", ["Multiply", 2, ["Fract", "y"]], "y"], ce);
        expect(fract.code).toBe("(y) => 2 * y - Math.floor(y)");
        expect(fract.run(1.5 as never)).toBe(2);
        // 2/hav(y) is 4.3045 at y = 1.5; the code is `2 / (1 - Math.cos(y)) / 2`.
        const hav = js(["Function", ["Divide", 2, ["Haversine", "y"]], "y"], ce);
        expect(hav.code).toBe("(y) => 2 / (1 - Math.cos(y)) / 2");
        expect(hav.run(1.5 as never)).toBeCloseTo(1 / (1 - Math.cos(1.5)), 9);
        expect(hav.run(1.5 as never)).not.toBeCloseTo(2 / ((1 - Math.cos(1.5)) / 2), 3);
      });

      test("the same functions on an input are parenthesized, so only a function's own parameter is spliced", () => {
        const ce = engine({ x: "real" });
        expect(js(["Multiply", 2, ["Fract", "x"]], ce).run({ x: 1.5 } as never)).toBe(1);
      });

      test("an If the types decide is spliced unparenthesized", () => {
        const ce = engine({ x: "real" });
        const expression = ["Multiply", 2, ["If", ["Less", 2, 3], ["Add", "x", 1], 0]];
        const compiled = js(expression, ce);
        expect(compiled.code).toBe("2 * _.x + 1");
        expect(compiled.run({ x: 1 } as never)).toBe(3);
        expect(interpreted(ce, expression, { x: 1 })).toBe(4);
      });

      test("a type ascription on an expression is spliced unparenthesized", () => {
        const ce = engine({ x: "real" });
        const expression = ["Multiply", 2, ["Typed", ["Add", "x", 1], "'real'"]];
        const compiled = js(expression, ce);
        expect(compiled.code).toBe("2 * _.x + 1");
        expect(compiled.run({ x: 1 } as never)).toBe(3);
        expect(interpreted(ce, expression, { x: 1 })).toBe(4);
      });

      test("an If whose condition runs is parenthesized", () => {
        const ce = engine({ x: "real" });
        const compiled = js(["Multiply", 2, ["If", ["Less", "x", 3], ["Add", "x", 1], 0]], ce);
        expect(compiled.run({ x: 1 } as never)).toBe(4);
      });

      test("the scanner sees each shape", () => {
        const hit = (json: unknown): boolean =>
          findCe0187Defects(json as never).some((h) => h.defect === CE_0187_DEFECTS.parentheses);
        expect(hit(["Function", ["Multiply", 2, ["Fract", "y"]], "y"])).toBe(true);
        expect(hit(["Function", ["Divide", 2, ["Haversine", "y"]], "y"])).toBe(true);
        expect(hit(["Multiply", 2, ["If", ["Less", 2, 3], ["Add", "x", 1], 0]])).toBe(true);
        expect(hit(["Multiply", 2, ["Typed", ["Add", "x", 1], "'real'"]])).toBe(true);
        expect(hit(["Multiply", 2, ["If", ["Less", "x", 3], ["Add", "x", 1], 0]])).toBe(false);
        expect(hit(["Multiply", 2, ["Fract", "x"]])).toBe(false);
      });
    });

    describe(CE_0187_DEFECTS.reciprocalHyperbolic, () => {
      test("a Csch or Sech in a denominator drops its reciprocal", () => {
        const ce = engine({ x: "real" });
        // 2 / Csch(x) is 2 sinh x, and 2 / Sech(x) is 2 cosh x; compiled, each is 2 over the hyperbolic function itself.
        for (const [head, fn, name] of [
          ["Csch", Math.sinh, "sinh"],
          ["Sech", Math.cosh, "cosh"],
        ] as const) {
          const compiled = js(["Divide", 2, [head, "x"]], ce);
          expect(compiled.code).toBe(`2 / Math.${name}(_.x)`);
          expect(compiled.run({ x: 0.3 } as never)).toBeCloseTo(2 / fn(0.3), 12);
          expect(interpreted(ce, ["Divide", 2, [head, "x"]], { x: 0.3 })).toBeCloseTo(2 * fn(0.3), 12);
        }
      });
    });

    describe(CE_0187_DEFECTS.sqrtSquared, () => {
      const names = { x: "real", y: "real" };
      const sum = ["Add", ["Square", "x"], ["Square", "y"]];
      const squared = ["Power", ["Sqrt", sum], 2];

      test("a difference, a negation and a product of Sqrt(X)² lose their parentheses", () => {
        const ce = engine(names);
        const at = { x: 1, y: 2 };
        for (const [expression, compiledValue, right] of [
          [["Subtract", 1, squared], 4, -4],
          [["Negate", squared], 3, -5],
          [["Multiply", 2, squared], 6, 10],
        ] as const) {
          expect(js(expression, ce).run(at as never)).toBe(compiledValue);
          expect(interpreted(ce, expression, at)).toBe(right);
        }
      });

      test("the square alone is right, and GLSL keeps it whole", () => {
        const ce = engine(names);
        expect(js(squared, ce).run({ x: 1, y: 2 } as never)).toBe(5);
        expect(new GLSLTarget().compile(ce.box(["Subtract", 1, squared] as never)).code).toContain("_gpu_pow2(sqrt(");
      });

      test("Abs of a Block loses its Abs and its parentheses, on JavaScript and GLSL", () => {
        const ce = engine(names);
        const expression = ["Multiply", 2, ["Abs", ["Block", ["Add", ["Square", "x"], 1]]]];
        expect(js(expression, ce).code).toBe("2 * (_.x * _.x) + 1");
        expect(js(expression, ce).run({ x: 1 } as never)).toBe(3);
        expect(interpreted(ce, expression, { x: 1 })).toBe(4);
        expect(new GLSLTarget().compile(ce.box(expression as never)).code).toBe("2.0 * (x * x) + 1.0");
      });

      test("the scanner sees each shape", () => {
        const hit = (json: unknown): boolean =>
          findCe0187Defects(json as never).some((h) => h.defect === CE_0187_DEFECTS.sqrtSquared);
        expect(hit(["Subtract", 1, squared])).toBe(true);
        expect(hit(["Negate", squared])).toBe(true);
        expect(hit(["Multiply", 2, ["Abs", ["Block", ["Add", ["Square", "x"], 1]]]])).toBe(true);
        expect(hit(["Add", 1, squared])).toBe(false);
      });
    });

    describe(CE_0187_DEFECTS.scope, () => {
      test("a name is read from the scope the compile runs in, not the one the expression was boxed in", () => {
        const ce = engine();
        const expression = ce.box(["Multiply", "x", "k"]);
        ce.pushScope();
        ce.declare("k", "integer");
        ce.assign("k", 4);
        const compiled = new JavaScriptTarget().compile(expression) as unknown as Compilation;
        ce.popScope();
        // `k` is free where the expression was boxed, so its code should read it from the input.
        expect(compiled.code).toBe("4 * _.x");
        expect(compiled.run({ x: 1, k: 7 } as never)).toBe(4);
      });
    });

    describe(CE_0187_DEFECTS.heldValueBoxing, () => {
      test("with k held, (x²)^k is boxed as x^(2k), which loses the absolute value at a changed k", () => {
        const ce = engine();
        ce.declare("k", "integer");
        ce.assign("k", 4);
        const held = ce.box(["Power", ["Square", "x"], "k"]);
        expect(held.json).toEqual(["Power", "x", ["Multiply", 2, "k"]]);
        const at = { x: ce.number(-3), k: ce.number(0.5) };
        // (x²)^(1/2) is 3 at x = -3.
        expect(held.subs(at).evaluate().re).toBe(-3);
        expect(
          engine()
            .box(["Power", ["Square", "x"], "k"])
            .subs(at)
            .evaluate().re,
        ).toBe(3);
      });

      test("the scanner sees the shape", () => {
        const hits = findCe0187Defects(["Power", ["Square", "x"], "k"] as never);
        expect(hits.map((h) => h.defect)).toContain(CE_0187_DEFECTS.heldValueBoxing);
      });
    });

    describe(CE_0187_DEFECTS.complexParameter, () => {
      test("a function parameter with no declared type reaches LerchPhi's complex lowering, which reads a number as 0", () => {
        const ce = engine();
        const expression = ["Function", ["LerchPhi", 0.3, "t", 2], "t"];
        const compiled = js(expression, ce);
        expect(compiled.code).toContain("_SYS.clerchPhi(");
        // Φ(0.3, t, 2) at t = 2 is 0.2903; the result is the constant 1 / (1 - 0.3).
        expect(compiled.run(2 as never)).toBeCloseTo(1 / 0.7, 12);
        expect(interpreted(ce, ["LerchPhi", 0.3, 2, 2], {})).toBeCloseTo(0.2903, 4);
      });

      test("a real parameter is right", () => {
        const ce = engine();
        const compiled = js(["Function", ["LerchPhi", 0.3, "t", 2], ["Typed", "t", "'real'"]], ce);
        expect(compiled.run(2 as never)).toBeCloseTo(0.2903, 4);
      });

      test("the scanner sees the shape, and not a real parameter", () => {
        const hit = (json: unknown): boolean =>
          findCe0187Defects(json as never).some((h) => h.defect === CE_0187_DEFECTS.complexParameter);
        expect(hit(["Function", ["LerchPhi", 0.3, "t", 2], "t"])).toBe(true);
        expect(hit(["Function", ["LerchPhi", 0.3, "t", 2], ["Typed", "t", "'real'"]])).toBe(false);
      });
    });

    describe("the census-only defects", () => {
      test(`${CE_0187_DEFECTS.sumNaN}: a Sum answers NaN at its first NaN term, where the interpreter sums on`, () => {
        const ce = engine();
        const expression = ["Sum", ["Sqrt", ["Subtract", "k", 3]], ["Triple", "k", 1, 5]];
        const compiled = js(expression, ce);
        expect(compiled.code).toContain("if (_tv1 !== _tv1) return NaN;");
        expect(compiled.run({} as never)).toBeNaN();
        expect(ce.box(expression as never).N().re).toBeCloseTo(2.414213562373095, 12);
      });

      test(`${CE_0187_DEFECTS.pointListBudget}: a PointList stops at iterationBudget`, () => {
        const ce = engine();
        const expression = ["PointList", ["Range", 1, 5000], ["Range", 1, 5000]];
        expect((js(expression, ce, { iterationBudget: 100 }).run({} as never) as unknown[]).length).toBe(100);
        expect((js(expression, ce).run({} as never) as unknown[]).length).toBe(5000);
      });

      test(`${CE_0187_DEFECTS.complexModeSqrt}: not reproduced; Sqrt at -4 is 2i in complex mode and NaN in strict mode`, () => {
        const ce = engine({ x: "real" });
        expect(js(["Sqrt", "x"], ce, { mode: "complex" }).run({ x: -4 } as never)).toEqual({ re: 0, im: 2 });
        expect(js(["Sqrt", "x"], ce).run({ x: -4 } as never)).toBeNaN();
      });

      test(`${CE_0187_DEFECTS.complexInput}: not reproduced as a wrong value; z² + a of undeclared names throws on a complex input`, () => {
        const ce = engine();
        const compiled = js(["Add", ["Square", "z"], "a"], ce);
        expect(compiled.code).toBe("(_.z * _.z) + _.a");
        expect(() => compiled.run({ z: { re: 0, im: 2 }, a: 1 } as never)).toThrow(/complex/);
      });

      test(`${CE_0187_DEFECTS.absRange}: not reproduced; Abs keeps its range through a declared range`, () => {
        const ce = engine({ x: "real<-5..3>" });
        expect(ce.box(["Abs", ["Subtract", "x", 1]] as never).type.toString()).toBe("real<0..6>");
        expect(ce.box(["Add", ["Abs", "x"], -6] as never).type.toString()).toBe("real<-6..-1>");
      });
    });
  },
);

// The declines hold whatever the pin does, so these run on every version.
describe("the declines", () => {
  const defective = [
    ["Multiply", 2, ["If", ["Less", 2, 3], ["Add", "_x", 1], 0]],
    ["Multiply", 2, ["Typed", ["Add", "_x", 1], "'real'"]],
    ["Subtract", 1, ["Power", ["Sqrt", ["Add", ["Square", "_x"], 1]], 2]],
    ["Multiply", 2, ["Abs", ["Block", ["Add", ["Square", "_x"], 1]]]],
    ["Function", ["Multiply", 2, ["Fract", "y"]], "y"],
    ["Divide", 2, ["Csch", "_x"]],
    ["Power", ["Square", "_x"], "_k"],
    ["Function", ["LerchPhi", 0.3, "t", 2], "t"],
  ];

  test.each(defective)("%j is left to the interpreter, and the reason names its defect", (...json) => {
    expect(ce0187Decline(json as never)).toMatch(/^ce-0187:[a-z-]+: /);
  });

  test("compileTyped declines each, and compiles the same expression without the shape", () => {
    const ce = new ComputeEngine();
    for (const json of defective.slice(0, 4)) expect(compileTyped(ce, json, { _x: "integer" })).toBeUndefined();
    expect(compileTyped(ce, ["Multiply", 2, ["Add", "_x", 1]], { _x: "integer" })?.run({ _x: 1 })).toBe(4);
  });

  test("compileExpression declines one", () => {
    const ce = new ComputeEngine();
    ce.declare("x", "real");
    expect(
      compileExpression(ce.box(["Subtract", 1, ["Power", ["Sqrt", ["Add", ["Square", "x"], 1]], 2]] as never)),
    ).toBeUndefined();
    expect(compileExpression(ce.box(["Add", "x", 1] as never))?.({ x: 1 })).toBe(2);
  });

  test("a decided If whose branches are calls, and a function of a real parameter, are left to the compiler", () => {
    expect(ce0187Decline(["Negate", ["If", "True", ["Binomial", "_n", "k"], 0]] as never)).toBeUndefined();
    expect(ce0187Decline(["Function", ["LerchPhi", 0.3, "t", 2], ["Typed", "t", "'real'"]] as never)).toBeUndefined();
  });
});
