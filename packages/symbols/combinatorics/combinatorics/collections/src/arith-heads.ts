import { type Engine, type Expr, wrapOperator } from "@notatio/engine";

// #113 arithmetic-head extensions that don't belong to any single family, and are kept
// OUT of packages/symbols/analysis/analytic on purpose:
//
//  - Sign of an exact real numeric expression (a Sqrt/rational tree with no free
//    variable) that compute-engine's native Sign leaves unevaluated: certified by
//    bumping `ce.precision` and re-evaluating in bignum, never by trusting a single
//    double-precision `.N()`.

/** Operators an exact, symbol-free numeric expression is built from -- the same shape
 *  `looksConstant` in constant-rounding.ts checks, but this module can't import that
 *  package (boundary), so it keeps its own copy local to what it needs. */
const NUMERIC_HEADS = new Set(["Negate", "Add", "Subtract", "Multiply", "Divide", "Power", "Sqrt"]);

// ─── Sign of an exact numeric expression ───────────────────────────────────────────────

/**
 * The sign of a real, symbol-free numeric expression, certified rather than guessed: bump
 * `ce.precision` and re-evaluate in bignum, and only trust the sign once it reproduces
 * unchanged at double the precision. A single-precision `.N()` can't tell a genuinely
 * negative value like $\sqrt2-2$ from rounding noise around zero; two independent bignum
 * evaluations agreeing is what "certified" means here. Returns `undefined` (declines,
 * falling through to native) rather than a wrong answer when it can't confirm.
 */
function certifiedSign(ce: Engine, x: Expr): -1 | 0 | 1 | undefined {
  const saved = ce.precision;
  try {
    let digits = Math.max(saved, 30);
    for (let round = 0; round < 6; round++) {
      ce.precision = digits;
      const re1 = x.N().re;
      ce.precision = digits * 2;
      const re2 = x.N().re;
      if (re1 !== undefined && re2 !== undefined && re1 === 0 && re2 === 0) return 0;
      if (
        re1 !== undefined &&
        re2 !== undefined &&
        Number.isFinite(re1) &&
        Number.isFinite(re2) &&
        re1 !== 0 &&
        re2 !== 0 &&
        Math.sign(re1) === Math.sign(re2)
      ) {
        return Math.sign(re1) as -1 | 1;
      }
      digits *= 4;
    }
    return undefined;
  } finally {
    ce.precision = saved;
  }
}

function declareExactSign(ce: Engine): void {
  // compile builtin: an exact expression's certified sign: compute-engine folds exact constants before compiling
  wrapOperator(
    ce,
    ["Sign", 1],
    (ops) => {
      if (ops.length !== 1 || ops[0] === undefined) return false;
      const op = ops[0];
      if (!NUMERIC_HEADS.has(op.operator ?? "")) return false;
      // `.re`/`.im` on an un-evaluated exact expression like Subtract(Sqrt(2), 2) read
      // as NaN -- compute-engine only fills them in once something forces a numeric
      // approximation. `.N()` is that force; a real result here is what "no free
      // variable, no imaginary part" actually means for a call this shape hasn't
      // resolved on its own.
      const n = op.N();
      return n.im === 0 && Number.isFinite(n.re);
    },
    () => (ops, options) => {
      const sign = certifiedSign(ce, ops[0]!);
      if (sign === undefined) return undefined;
      const result = ce.number(sign);
      return options.numericApproximation ? result.N() : result;
    },
    { compile: "builtin" },
  );
}

export function declareArithHeads(ce: Engine): void {
  declareExactSign(ce);
}
