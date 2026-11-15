import { wrapOperator } from "@notatio/engine";
import type { Patch } from "../patch.ts";
import { compileBeta, evaluateBeta } from "../compute-engine/library/beta.ts";

// Beta(a, b) = Γ(a)Γ(b)/Γ(a+b) at two non-integers with a + b a non-positive integer is 0, the
// quotient of finite Γ values by a pole. Native gives NaN there on floats, on N of a rational
// pair, and in the JavaScript lowering (Beta(−5/2, 1/2), Beta(1/2, −1/2), Beta(3/2, −5/2));
// cortex-js/compute-engine#590.
export const betaAtPole: Patch = {
  id: "beta-at-pole",
  lands: "Beta(a, b) = 0 where a and b are non-integers and a + b is a non-positive integer, not NaN",
  files: ["src/compute-engine/numerics/beta.ts", "src/compute-engine/library/beta.ts"],
  heads: ["Beta"],

  fixed: (ce) => ce.box(["Beta", -2.5, 0.5]).N().is(0) && ce.box(["Beta", 0.5, -0.5]).evaluate().is(0),

  apply: (ce) => wrapOperator(ce, ["Beta"], () => true, evaluateBeta(ce), { arity: 2, compile: compileBeta }),
};
