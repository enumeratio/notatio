// A library's head declares its options in its own record; the kernel's reader finds them.

import { parseExpression, rulesInCalls } from "@notatio/formats/expression";
import { expect, test } from "vite-plus/test";
import { libraryOptionsOf } from "../src/library-options.ts";

test("the manifest's options and formats' own are one table", () => {
  expect(libraryOptionsOf("TestResultObject").has("ExpectedOutput")).toBe(true);
  expect(libraryOptionsOf("Plot").has("PlotStyle")).toBe(true);
  expect(libraryOptionsOf("Sin").size).toBe(0);
});

test("an arrow on a library's head is its option only with the library's table", () => {
  const written = (): unknown[] => ["TestResultObject", ["To", "ExpectedOutput", 2], ["To", "x", 0]];
  const plain = written();
  rulesInCalls(plain as never);
  expect(plain).toEqual(written());
  const read = written();
  rulesInCalls(read as never, libraryOptionsOf);
  expect(read).toEqual(["TestResultObject", ["Rule", "ExpectedOutput", 2], ["To", "x", 0]]);
});

test.each([
  ["IsPrime", "Over"],
  ["FactorInteger", "Over"],
  ["Divisors", "Over"],
  ["PrimeNu", "Over"],
  ["PrimeOmega", "Over"],
  ["MoebiusMu", "Over"],
  ["IsSquareFree", "Over"],
  ["DivisorSigma", "Over"],
  ["AdditionTable", "ElementOrder"],
  ["MultiplicationTable", "ElementOrder"],
  ["Graph", "EdgeWeight"],
  ["Fourier", "FourierParameters"],
  ["InverseFourier", "FourierParameters"],
  ["VerificationTest", "SameTest"],
  ["VerificationTest", "TimeConstraint"],
  ["VerificationTest", "MemoryConstraint"],
  ["VerificationTest", "TestID"],
])("%s reads %s as a Rule", (head, option) => {
  const read: unknown[] = [head, 1, ["To", option, 2]];
  rulesInCalls(read as never, libraryOptionsOf);
  expect(read).toEqual([head, 1, ["Rule", option, 2]]);
});

test("parseExpression takes the table", () => {
  const { json, errors } = parseExpression("Plot(Sin(x), (x, 0, 6), Axes -> False)", { optionsOf: libraryOptionsOf });
  expect(errors).toEqual([]);
  expect(JSON.stringify(json)).toContain('"Rule"');
});
