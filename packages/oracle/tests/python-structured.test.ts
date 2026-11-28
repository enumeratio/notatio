import { expect, test } from "vite-plus/test";
import { compareHeldCall, comparePythonStructured, numericExpression, parsePadic } from "../src/compare.ts";
import type { MathJSON } from "../src/emit.ts";
import { reduce, type Leaf, symbolic } from "../src/structural.ts";

// Sage prints a p-adic number as the terms it holds and its precision, `2^2 + O(2^3)`: four, modulo 2^3.
test("a p-adic number reads as its prime, residue and precision", () => {
  expect(parsePadic("2^2 + O(2^3)")).toEqual(["AdicNumeral", 2, 4, 3]);
  expect(parsePadic("1 + O(3)")).toEqual(["AdicNumeral", 3, 1, 1]);
  expect(parsePadic("O(5^0)")).toEqual(["AdicNumeral", 5, 0, 0]);
  expect(parsePadic("1 + 2*3 + 3^2 + O(3^4)")).toEqual(["AdicNumeral", 3, 16, 4]);
  expect(parsePadic("3 + O(3^2)")).toEqual(["AdicNumeral", 3, 3, 2]);
  // Terms past the precision fall away.
  expect(parsePadic("1 + 3^2 + O(3^2)")).toEqual(["AdicNumeral", 3, 1, 2]);
});

test("text that is not a sum of p-adic terms is not read", () => {
  expect(parsePadic("2^2 + O(x^3)")).toBeUndefined();
  expect(parsePadic("2^2")).toBeUndefined();
  expect(parsePadic("5*7^2 + O(3^3)")).toBeUndefined();
  expect(parsePadic("O(1)")).toBeUndefined();
});

test("ours as an AdicNumeral compares with the printed p-adic by residue and precision", () => {
  const ours = (expr: MathJSON) => reduce(expr, symbolic);
  expect(comparePythonStructured(ours(["AdicNumeral", 2, 4, 3]), "2^2 + O(2^3)")).toBe("agree");
  expect(comparePythonStructured(ours(["AdicNumeral", 3, 1, 1]), "1 + O(3)")).toBe("agree");
  // Another residue, precision or prime is another number.
  expect(comparePythonStructured(ours(["AdicNumeral", 2, 4, 3]), "2 + O(2^3)")).toBe("disagree");
  expect(comparePythonStructured(ours(["AdicNumeral", 2, 4, 3]), "2^2 + O(2^4)")).toBe("disagree");
  expect(comparePythonStructured(ours(["AdicNumeral", 2, 4, 3]), "1 + O(3^2)")).toBe("disagree");
});

test("a number printed as a Python expression is read as a real or a complex", () => {
  expect(numericExpression("1/2")).toBe(0.5);
  expect(numericExpression("-3^2")).toBe(-9);
  expect(numericExpression("2^-1")).toBe(0.5);
  expect(numericExpression("sqrt(4)")).toBeCloseTo(2, 12);
  const z = numericExpression("1/2*I*sqrt(3) + 1/2") as { re: number; im: number };
  expect(z.re).toBeCloseTo(0.5, 12);
  expect(z.im).toBeCloseTo(Math.sqrt(3) / 2, 12);
  expect(numericExpression("x + 1")).toBeUndefined();
  expect(numericExpression("foo(1)")).toBeUndefined();
  expect(numericExpression("1/0")).toBeUndefined();
});

// A held call: ours has the value of its argument, Sage prints it in its own spelling.
type C = { re: number; im: number };
const complex = (x: Leaf): C => (typeof x === "number" ? { re: x, im: 0 } : (x as C));
const evaluate = (expr: MathJSON): Leaf => {
  if (typeof expr === "number") return expr;
  if (!Array.isArray(expr)) return symbolic(expr);
  const [head, ...args] = expr;
  const values = args.map((a) => evaluate(a as MathJSON));
  const num = (k: number): number => values[k] as number;
  if (head === "Rational" || head === "Divide") return num(0) / num(1);
  if (head === "Sqrt") return Math.sqrt(num(0));
  if (head === "Complex") return { re: num(0), im: num(1) };
  if (head === "Add") {
    const [a, b] = [complex(values[0] as Leaf), complex(values[1] as Leaf)];
    return { re: a.re + b.re, im: a.im + b.im };
  }
  return symbolic(expr);
};
const li3 = ["PolyLog", 3, ["Add", ["Rational", 1, 2], ["Complex", 0, ["Divide", ["Sqrt", 3], 2]]]] as MathJSON;

test("the same held call agrees when its operands are the same numbers", () => {
  expect(compareHeldCall("sage", li3, "polylog(3, 1/2*I*sqrt(3) + 1/2)", evaluate)).toBe("agree");
});

test("a different operand, name or arity is not decided here", () => {
  expect(compareHeldCall("sage", li3, "polylog(3, 1/2*I*sqrt(3) - 1/2)", evaluate)).toBeUndefined();
  expect(compareHeldCall("sage", li3, "polylog(4, 1/2*I*sqrt(3) + 1/2)", evaluate)).toBeUndefined();
  expect(compareHeldCall("sage", li3, "dilog(3, 1/2*I*sqrt(3) + 1/2)", evaluate)).toBeUndefined();
  expect(compareHeldCall("sage", li3, "polylog(3)", evaluate)).toBeUndefined();
  expect(compareHeldCall("sage", li3, "polylog(3, z)", evaluate)).toBeUndefined();
  expect(compareHeldCall("sage", li3, "1/2", evaluate)).toBeUndefined();
});
