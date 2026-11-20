import type { Expression, ComputeEngine } from "@notatio/engine/unstable";
import { isNumber } from "@notatio/engine";
import { clearKernelZero } from "@notatio/ce-patches";

// The degree-0 member of an orthogonal-polynomial family is the constant 1, whatever x is. A double kernel reads x as
// a double, so past a double's digits it would decline a value that needs no x at all.

const isFloat = (op: Expression): boolean =>
  isNumber(op) && (op as Partial<{ isExact: boolean }>).isExact === false && Number.isFinite(op.re);

/** Is every operand an exact number? A kernel's 0 on exact operands has an exact route to confirm it. */
export const allExact = (ops: readonly (Expression | undefined)[]): boolean =>
  ops.every((op) => op !== undefined && (op as Partial<{ isExact: boolean }>).isExact === true);

/**
 * Does the double kernel's `value` stand? Not when it is a 0 on exact operands with an exact polynomial to confirm it
 * (`withinExact`): the caller then goes on to that route, and the kernel's 0 is forgotten. A 0 on a float operand is a
 * double's and stands as one (`declineMachineAnswer` declines it past a double's digits).
 */
export function keepsKernelValue(
  value: Expression | undefined,
  ops: readonly (Expression | undefined)[],
  withinExact: boolean,
): boolean {
  if (value === undefined || !isNumber(value) || value.re !== 0 || value.im !== 0) return true;
  if (!allExact(ops) || !withinExact) return true;
  clearKernelZero();
  return false;
}

/**
 * The value 1 of a degree-0 member, for the operands `ops` (the order excluded): the exact 1, or, when an operand is
 * a float, the float 1.0 (a float operand gives a float result).
 */
export function degreeZero(ce: ComputeEngine, ops: readonly Expression[]): Expression {
  return ops.some(isFloat) ? ce.box({ num: "1.0" } as never) : ce.One;
}
