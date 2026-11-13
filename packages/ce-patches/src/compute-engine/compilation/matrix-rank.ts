import type { Expression } from "@cortex-js/compute-engine";
import { operandsOf, symbolNameOf } from "@notatio/engine";
import { MATRIX_RANK_SOURCE } from "../numerics/matrix-rank.ts";

// JavaScript lowering of `MatrixRank`. A literal matrix of integers and rationals compiles to exact
// integers (each row scaled by the least common multiple of its denominators, which keeps the rank),
// so its rank is exact whatever the digits; anything else (a variable, a computed matrix, a literal
// with a float) reaches the kernel as the numbers it holds at run time, where integers are still
// eliminated exactly and any other number takes the float path with a tolerance.

type Rational = readonly [bigint, bigint];

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));

/** An exact rational literal's numerator and denominator; undefined for a float or anything else. */
function rationalOf(entry: Expression): Rational | undefined {
  const json = entry.json as unknown;
  const integer = (j: unknown): bigint | undefined => {
    if (typeof j === "number") return Number.isInteger(j) ? BigInt(j) : undefined;
    const digits = typeof j === "object" && j !== null ? (j as { num?: unknown }).num : undefined;
    return typeof digits === "string" && /^-?\d+$/.test(digits) ? BigInt(digits) : undefined;
  };
  const whole = integer(json);
  if (whole !== undefined) return [whole, 1n];
  if (!Array.isArray(json) || json[0] !== "Rational" || json.length !== 3) return undefined;
  const [numerator, denominator] = [integer(json[1]), integer(json[2])];
  if (numerator === undefined || denominator === undefined || denominator === 0n) return undefined;
  return denominator < 0n ? [-numerator, -denominator] : [numerator, denominator];
}

/** The rows of a literal matrix (or the one row of a literal vector) as integers, or undefined. */
export function exactRows(matrix: Expression): bigint[][] | undefined {
  if (matrix.operator !== "List") return undefined;
  const ops = operandsOf(matrix);
  if (ops.length === 0) return undefined;
  const rows = ops.every((op) => op.operator === "List") ? ops.map(operandsOf) : [ops];
  const out: bigint[][] = [];
  for (const row of rows) {
    if (row.length === 0 || row.length !== rows[0]!.length) return undefined;
    const rationals: Rational[] = [];
    for (const entry of row) {
      const r = rationalOf(entry);
      if (r === undefined) return undefined;
      rationals.push(r);
    }
    const common = rationals.reduce((l, [, d]) => (l / gcd(l, d)) * d, 1n);
    out.push(rationals.map(([n, d]) => n * (common / d)));
  }
  return out;
}

/** A literal matrix whose entries include a symbol: the evaluator reads those as indeterminates
 *  (the rank of generic entries), which compiled code, holding numbers, cannot. */
const hasSymbolEntry = (matrix: Expression): boolean =>
  matrix.operator === "List" &&
  operandsOf(matrix).some((op) => (op.operator === "List" ? hasSymbolEntry(op) : symbolNameOf(op) !== undefined));

/** `compile` handler of `MatrixRank`: one operand, a matrix. */
export function compileMatrixRank(
  args: readonly Expression[],
  compile: (e: Expression) => string,
  context: { language?: string },
): string | undefined {
  if (context.language !== "javascript" || args.length !== 1) return undefined;
  const matrix = args[0]!;
  if (hasSymbolEntry(matrix)) throw new Error("MatrixRank of symbolic entries has no compiled lowering");
  const rows = exactRows(matrix);
  const operand =
    rows === undefined
      ? compile(matrix)
      : `[${rows.map((row) => `[${row.map((x) => `${x}n`).join(", ")}]`).join(", ")}]`;
  return `${MATRIX_RANK_SOURCE}(${operand})`;
}
