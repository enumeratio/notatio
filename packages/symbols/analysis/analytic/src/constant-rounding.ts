import type { Expression, ComputeEngine } from "@cortex-js/compute-engine";
import { symbolNameOf, wrapOperator } from "@notatio/engine";

// Floor, Ceil and Round are idempotent, Max and Min drop an exactly-repeated argument, and
// IsOdd is False at a non-integer exact constant. (compute-engine folds Floor/Ceil/Round and
// Max/Min of exact constants such as Pi itself.) Declared by `declareAnalytic`.
//
// Idempotence can hand back an exact symbolic operand (Pi, say) as is -- honoring
// `options.numericApproximation` there too, so N(Max(Pi, Pi)) comes back as a decimal
// rather than the exact Pi evaluate() alone would give.

const KNOWN_CONSTANTS = new Set([
  "Pi",
  "ExponentialE",
  "EulerGamma",
  "GoldenRatio",
  "CatalanConstant",
  "MachineEpsilon",
]);

// Operators an exact-constant expression can be built from. Compute-engine has already
// evaluated every purely-numeric subexpression by the time a wrapped operator's `evaluate`
// runs, so a surviving Add/Multiply/etc. means some operand didn't reduce to a number --
// either a free variable or one of these irrational constants. The cheap check below
// (operator, and for a bare symbol its name) can't tell those apart; the handler settles
// it with a single N() and declines (returns undefined, same as the native handler would)
// when that isn't finite.
const CONSTANT_HEADS = new Set(["Negate", "Add", "Subtract", "Multiply", "Divide", "Power", "Sqrt", "Log"]);

/** O(1): reads only `operator`, and for a bare symbol its `symbol` name. */
function looksConstant(op: Expression): boolean {
  if (op.operator === "Symbol") return KNOWN_CONSTANTS.has(symbolNameOf(op) ?? "");
  return CONSTANT_HEADS.has(op.operator ?? "");
}

type Rounding = "Floor" | "Ceil" | "Round";

function declareRoundingHead(ce: ComputeEngine, name: Rounding): void {
  // Idempotent: Floor(Floor(x)) = Floor(x), for whatever x -- the inner value is
  // already an integer (or stays symbolic, in which case nothing changes either way).
  // compile builtin: idempotence, and exact constants that compute-engine folds before compiling
  wrapOperator(
    ce,
    [name, 1],
    (ops) => ops[0]?.operator === name,
    () => (ops, options) => (options.numericApproximation ? ops[0]!.N() : ops[0]),
    { arity: 1, compile: "builtin" },
  );
}

function declareExtremum(ce: ComputeEngine, name: "Max" | "Min"): void {
  // Idempotent: repeated identical arguments collapse to one, e.g. Max(x, x) = x.
  // `isSame` is a structural (non-evaluating) compare, cheap on the common case of
  // two distinct numbers or symbols.
  // compile builtin: idempotence, and exact constants that compute-engine folds before compiling
  wrapOperator(
    ce,
    [name, 2],
    (ops) => ops.every((op) => op === ops[0] || op.isSame(ops[0])),
    () => (ops, options) => (options.numericApproximation ? ops[0]!.N() : ops[0]),
    { arity: { min: 2 }, compile: "builtin" },
  );
}

export function declareConstantRounding(ce: ComputeEngine): void {
  declareRoundingHead(ce, "Floor");
  declareRoundingHead(ce, "Ceil");
  declareRoundingHead(ce, "Round");
  declareExtremum(ce, "Max");
  declareExtremum(ce, "Min");

  // IsOdd(Pi) etc: a non-integer exact constant is never odd.
  // compile builtin: idempotence, and exact constants that compute-engine folds before compiling
  wrapOperator(
    ce,
    ["IsOdd", 1],
    (ops) => ops[0] !== undefined && looksConstant(ops[0]),
    () => (ops) => {
      const n = ops[0]!.N();
      if (n.im !== 0 || !Number.isFinite(n.re) || Number.isInteger(n.re)) return undefined;
      return ce.False;
    },
    { arity: 1, compile: "builtin" },
  );
}
