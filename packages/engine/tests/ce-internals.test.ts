import { ComputeEngine, version } from "@cortex-js/compute-engine";
import { JavaScriptTarget } from "@cortex-js/compute-engine/compile";
import { expect, test } from "vite-plus/test";
import { CHECKED_COMPUTE_ENGINE, functionNodePrototype, libraryOperator, shadowsLibrary } from "../src/ce-internals.ts";
import { isCompileDecline } from "../src/compiled.ts";
import { extendHead, refusing, wrapOperator } from "../src/index.ts";

// The compile stance reads two things from compute-engine's internals (ce-internals.ts). A bump of
// compute-engine fails here until someone has checked both still hold and moved CHECKED_COMPUTE_ENGINE on.

// The nightly against compute-engine main (ce-main.yml) runs a newer version on purpose; the rule tests below still run.
// tools/ce-downstream/run.ts matches this test by its title: rename them together.
test.skipIf(process.env.COMPUTE_ENGINE_MAIN === "1")(
  "compute-engine is the version whose shadow rules ce-internals.ts was checked against",
  () => {
    expect(version).toBe(CHECKED_COMPUTE_ENGINE);
  },
);

test("the library operator is the one a fresh engine's lookup resolves to, and an extension is not", () => {
  const ce = new ComputeEngine();
  const fresh = (ce.lookupDefinition("Sin") as { operator: object }).operator;
  expect(libraryOperator(ce, "Sin")).toBe(fresh);
  extendHead(ce, "Sin", { broadcastable: true });
  const extended = (ce.lookupDefinition("Sin") as { operator: object }).operator;
  expect(extended).not.toBe(fresh);
  expect(libraryOperator(ce, "Sin")).toBe(fresh);
  expect(libraryOperator(ce, "NotAHead")).toBeUndefined();
});

test("shadowsLibrary agrees with compute-engine's own refusal to compile a shadowed head", () => {
  const compiles = (ce: ComputeEngine, head: string): boolean => {
    try {
      new JavaScriptTarget().compile(ce.box([head, "x"]));
      return true;
    } catch (error) {
      expect((error as Error).message).toMatch(/shadows the library operator/);
      return false;
    }
  };
  const ce = new ComputeEngine();
  const operator = () => (ce.lookupDefinition("Sin") as { operator: { lazy?: boolean; evaluate?: unknown } }).operator;
  expect(shadowsLibrary(ce, "Sin", operator(), true)).toBe(false);
  extendHead(ce, "Sin", { broadcastable: true });
  // An extension that replaces `evaluate` in place still compiles as the library head (0.170).
  operator().evaluate = () => undefined;
  expect(shadowsLibrary(ce, "Sin", operator(), true)).toBe(false);
  expect(compiles(ce, "Sin")).toBe(true);
  // What it holds or threads makes a shadow.
  operator().lazy = true;
  expect(shadowsLibrary(ce, "Sin", operator(), true)).toBe(true);
  expect(compiles(ce, "Sin")).toBe(false);
});

test("a definition that is not an extension shadows by a replaced evaluate", () => {
  const ce = new ComputeEngine();
  const operator = () => (ce.lookupDefinition("Sin") as { operator: { evaluate?: unknown } }).operator;
  ce.declare("Sin", { signature: "(number) -> number", evaluate: () => undefined } as never);
  expect(shadowsLibrary(ce, "Sin", operator())).toBe(true);
  expect(() => new JavaScriptTarget().compile(ce.box(["Sin", "x"]))).toThrow(/shadows the library operator/);
});

test("function nodes share one prototype that carries evaluate and evaluateAsync", () => {
  const ce = new ComputeEngine();
  const prototype = functionNodePrototype(ce);
  expect(prototype).toBeDefined();
  expect(Object.getPrototypeOf(ce.box(["Add", "x", 1]))).toBe(prototype);
  expect(Object.getPrototypeOf(ce.box(["Sin", "x"]))).toBe(prototype);
});

// structuralOperands (index.ts) trusts a symbol's type only if it was declared: `inferredType` tells which.
test("a declared symbol's definition reports inferredType false, an inferred one true, a mentioned one has none", () => {
  const ce = new ComputeEngine();
  const valueOf = (name: string) => {
    const definition = ce.lookupDefinition(name);
    return definition !== undefined && "value" in definition ? definition.value : undefined;
  };
  ce.declare("declared", "real");
  ce.assign("assigned", 3);
  ce.box(["Add", "mentioned", 1]).evaluate();
  expect(valueOf("declared")?.inferredType).toBe(false);
  expect(valueOf("assigned")?.inferredType).toBe(true);
  expect(ce.lookupDefinition("mentioned")).toBeUndefined();
});

// isCompileDecline tells a decline by message for the kinds compute-engine doesn't type; a reworded
// message fails here at the bump, not as a warning in every kernel answer.
test("compile declines of each kind classify as declines, and an ordinary error does not", () => {
  const ce = new ComputeEngine();
  extendHead(ce, "Sin", { broadcastable: true });
  wrapOperator(
    ce,
    ["Sin", 1],
    () => false,
    () => () => undefined,
    {
      arity: 1,
      compile: refusing(() => true, "held"),
    },
  );
  const thrown = (json: unknown): unknown => {
    try {
      new JavaScriptTarget().compile(ce.box(json as never), { fallback: false });
    } catch (error) {
      return error;
    }
    throw new Error(`${JSON.stringify(json)} compiled`);
  };
  for (const json of [
    ["NotAHeadAnywhere", 1], // an unknown operator
    ["Sin", "x"], // a refusing() head
    ["Pi"], // an invalid expression
    ["Equal", "x", 1], // an untyped input: a typed decline
  ])
    expect(isCompileDecline(thrown(json)), JSON.stringify(json)).toBe(true);
  expect(isCompileDecline(new Error("boom"))).toBe(false);
});
