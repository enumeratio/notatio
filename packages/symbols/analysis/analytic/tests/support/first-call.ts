import { createEngine } from "@notatio/engine/testing";
import { declareAnalytic } from "../../src/declare.ts";

// Runs one numeric call as the first of this process and prints its value: argv is the expression
// as JSON and the digits (0 for `.N()` at the engine's precision).
const [json, digits] = process.argv.slice(2) as [string, string];
const ce = createEngine(declareAnalytic);
const expr = JSON.parse(json);
const value = Number(digits) > 0 ? ce.box(["N", expr, Number(digits)] as never).evaluate() : ce.box(expr).N();
// `toString` shortens a decimal for display; the digits are in the bignum.
console.log(String(value.bignumRe ?? value.toString()));
