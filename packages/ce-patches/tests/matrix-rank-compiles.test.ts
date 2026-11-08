import { ComputeEngine } from "@cortex-js/compute-engine";
import { JavaScriptTarget } from "@cortex-js/compute-engine/compile";
import { expect, test } from "vite-plus/test";
import { applyPatch, matrixRank, matrixRankCompiles } from "../src/index.ts";

const ce = new ComputeEngine();
applyPatch(ce, matrixRankCompiles);

const rows = (m: readonly (readonly unknown[])[]): unknown => ["List", ...m.map((r) => ["List", ...r])];
const frac = (n: number, d: number): unknown => ["Rational", n, d];

/** Compile `MatrixRank` of a literal matrix, and of the same matrix passed in as a variable. */
const compiled = (m: unknown): unknown => {
  const result = new JavaScriptTarget().compile(ce.box(["MatrixRank", m] as never)) as { run: () => unknown };
  return result.run();
};
const compiledVariable = (values: unknown): unknown => {
  ce.pushScope();
  ce.declare("m", Number.isInteger((values as number[][]).flat()[0]) ? "list<list<integer>>" : "list<list<real>>");
  const result = new JavaScriptTarget().compile(ce.box(["MatrixRank", "m"] as never)) as {
    run: (vars: Record<string, unknown>) => unknown;
  };
  ce.popScope();
  return result.run({ m: values });
};
const evaluated = (m: unknown): unknown => ce.box(["MatrixRank", m] as never).evaluate().json;
const numeric = (m: unknown): unknown => ce.box(["MatrixRank", m] as never).N().json;

const CASES: [string, unknown, number][] = [
  [
    "identity",
    rows([
      [1, 0],
      [0, 1],
    ]),
    2,
  ],
  [
    "integer, singular",
    rows([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]),
    2,
  ],
  [
    "zero",
    rows([
      [0, 0],
      [0, 0],
    ]),
    0,
  ],
  ["one by one", rows([[-5]]), 1],
  [
    "wide",
    rows([
      [1, 2, 3],
      [2, 4, 6],
    ]),
    1,
  ],
  [
    "tall",
    rows([
      [1, 2],
      [2, 4],
      [3, 6],
      [0, 1],
    ]),
    2,
  ],
  [
    "a zero column first",
    rows([
      [0, 1, 2],
      [0, 3, 4],
      [0, 5, 6],
    ]),
    2,
  ],
  [
    "a pivot found by a swap",
    rows([
      [0, 1],
      [1, 0],
    ]),
    2,
  ],
  [
    "rank three of four",
    rows([
      [1, 2, 3, 4],
      [2, 4, 6, 8],
      [1, 0, 1, 0],
      [3, 6, 10, 12],
    ]),
    3,
  ],
  [
    "rational, singular",
    rows([
      [frac(1, 2), frac(1, 3)],
      [frac(1, 4), frac(1, 6)],
    ]),
    1,
  ],
  [
    "rational, regular",
    rows([
      [frac(1, 2), frac(1, 3)],
      [frac(1, 3), frac(1, 2)],
    ]),
    2,
  ],
  ["a vector", ["List", 1, 2, 3], 1],
  ["a zero vector", ["List", 0, 0], 0],
  [
    "float",
    rows([
      [1.25, 3.2, 3.2],
      [7.9, -1.4, 5.1],
      [1.1, 2.5, -1.5],
    ]),
    3,
  ],
  [
    "float, singular",
    rows([
      [1.5, 3],
      [2.5, 5],
    ]),
    1,
  ],
];

for (const [name, m, rank] of CASES)
  test(`${name}: every route gives ${rank}`, () => {
    expect(evaluated(m)).toBe(rank);
    expect(numeric(m)).toBe(rank);
    expect(compiled(m)).toBe(rank);
  });

test("the parse route reads rank(A) and compiles it", () => {
  const parsed = ce.parse("\\operatorname{rank}(\\begin{pmatrix}1&2\\\\2&4\\end{pmatrix})");
  expect(parsed.evaluate().json).toBe(1);
  const result = new JavaScriptTarget().compile(parsed) as { run: () => unknown };
  expect(result.run()).toBe(1);
});

test("a variable holding integers is eliminated exactly, rows and columns of any shape", () => {
  expect(
    compiledVariable([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]),
  ).toBe(2);
  expect(
    compiledVariable([
      [1, 2],
      [3, 4],
      [5, 6],
    ]),
  ).toBe(2);
  expect(compiledVariable([[0, 0, 0]])).toBe(0);
  expect(compiledVariable([[3, 6]])).toBe(1);
});

test("exact rank where a float elimination loses it", () => {
  // The 12 by 12 Hilbert matrix is regular, though a double-precision elimination calls it rank 10 (what
  // `.N()` gets, its entries being doubles by then; compile folds a constant call the same way).
  const hilbert = (n: number): unknown =>
    rows(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => frac(1, i + j + 1))));
  for (const n of [8, 12]) expect(evaluated(hilbert(n))).toBe(n);
  expect(numeric(hilbert(8))).toBe(8);
  expect(compiled(hilbert(8))).toBe(8);
  // The same matrix scaled to integers reaches compiled code as a variable, eliminated exactly.
  const scale = 5354228880; // the least common multiple of 1..23
  expect(
    compiledVariable(Array.from({ length: 12 }, (_, i) => Array.from({ length: 12 }, (_, j) => scale / (i + j + 1)))),
  ).toBe(12);
  // Integers past a double's digits: 2^60 + 1 against 2^60 differ in the last place only.
  const big = 2n ** 60n;
  const columns = [
    [big + 1n, big],
    [big, big - 1n],
  ];
  expect(matrixRank(columns)).toBe(2);
  expect(
    matrixRank([
      [big, big],
      [big, big],
    ]),
  ).toBe(1);
});

test("a float operand takes the tolerance path: noise below it is no rank", () => {
  expect(
    matrixRank([
      [0.1, 0.2],
      [0.3, 0.6],
    ]),
  ).toBe(1);
  expect(
    compiledVariable([
      [0.1, 0.2],
      [0.3, 0.6000000000000001],
    ]),
  ).toBe(1);
  expect(
    compiledVariable([
      [0.1, 0.2],
      [0.3, 0.7],
    ]),
  ).toBe(2);
  expect(
    matrixRank([
      [0.5, 0],
      [0, 1e-3],
    ]),
  ).toBe(2);
});

test("an empty, ragged or non-finite matrix declines rather than answers", () => {
  expect(() => matrixRank([])).toThrow();
  expect(() => matrixRank([[]])).toThrow();
  expect(() => matrixRank([[1, 2], [3]])).toThrow();
  expect(() =>
    matrixRank([
      [1, Number.NaN],
      [3, 4],
    ]),
  ).toThrow();
  expect(() =>
    matrixRank([
      [1, Infinity],
      [3, 4],
    ]),
  ).toThrow();
  // The evaluator leaves the empty matrix unevaluated, and so does the engine: no route answers it.
  expect(evaluated(["List"])).toEqual(["MatrixRank", ["List"]]);
});

test("a matrix of distinct symbols has no lowering (the evaluator reads the symbols as indeterminates)", () => {
  const generic = rows([
    ["a", "b"],
    ["c", "d"],
  ]);
  expect(() => compiled(generic)).toThrow();
});
