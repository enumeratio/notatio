import type { Expr } from "@notatio/engine";
import { DOUBLE_DIGITS, type EvalOptions } from "@notatio/ce-patches";
import { roundedTree } from "./correctly-rounded.ts";

/** Digits an assembled formula carries beyond the engine's precision: each step of its
 * arithmetic rounds, and a sum or difference of kernel values loses the digits its terms share
 * (Γ(3, 1) − Γ(3, 7) keeps 20 of 21). */
const FINISH_GUARD = 12;

/**
 * `expr` evaluated numerically to the engine's precision, every digit of it right: the formula is
 * evaluated with `FINISH_GUARD` more digits and the answer rounded back, so it prints as many
 * digits as `ce.precision` asks for, whichever heads (and which package's `Add` and `Multiply`)
 * the formula goes through. At a double's precision or less the engine's own reading stands.
 */
export function numerically(expr: Expr): Expr {
  const ce = expr.engine;
  const precision = ce.precision;
  if (precision <= DOUBLE_DIGITS) return expr.N();
  ce.precision = precision + FINISH_GUARD;
  let value: Expr;
  try {
    value = expr.N();
  } finally {
    ce.precision = precision;
  }
  return typeof value.json === "number" ? value : ce.box(roundedTree(ce, value.json, precision) as never);
}

/** A formula an exact rule rewrites a call into: evaluated numerically under `N()`, exactly otherwise. */
export const finish = (expr: Expr, options: EvalOptions): Expr =>
  options.numericApproximation ? numerically(expr) : expr.evaluate();
