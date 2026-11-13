import { bigRationalAt, symbolNameOf, wrapOperator, type Engine } from "@notatio/engine";

export function declareModExactConstant(ce: Engine): void {
  // A bare constant symbol (Pi) against a float modulus (Mod(Pi, 2.5)): evaluate returns the number, where
  // compute-engine leaves Mod held. An exact modulus, `.N()` and the JavaScript compile already agree with
  // compute-engine, so they are not this wrapper's business; `compile: "builtin"` keeps the lowering's value.
  wrapOperator(
    ce,
    ["Mod", 2],
    (ops) => {
      if (ops.length !== 2 || ops[0] === undefined || ops[1] === undefined) return false;
      const [x, m] = ops;
      if (symbolNameOf(x) === undefined) return false; // a bare constant symbol only
      if (bigRationalAt(x) !== undefined) return false; // already exact: native handles it
      if (bigRationalAt(m) !== undefined) return false; // an exact modulus: compute-engine answers it
      const mNum = m.re;
      if (!(Number.isFinite(mNum) && mNum > 0)) return false;
      const xNum = x.N().re;
      if (!Number.isFinite(xNum)) return false; // a free variable, not a numeric constant
      const ratio = xNum / mNum;
      return Math.abs(ratio - Math.round(ratio)) > 1e-6; // margin from a boundary case
    },
    () => (ops, options) => {
      const [x, m] = ops;
      const k = Math.floor(x.N().re / m.re!);
      const expr = ce.function("Subtract", [x, ce.function("Multiply", [ce.number(k), m])]);
      return options.numericApproximation ? expr.N() : expr.evaluate();
    },
    { compile: "builtin" },
  );
}
