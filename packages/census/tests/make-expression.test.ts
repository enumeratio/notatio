import { join } from "node:path";
import { ComputeEngine } from "@cortex-js/compute-engine";
import type { MathJsonExpression } from "@cortex-js/compute-engine/epsil";
import { makeBoxes, makeExpression, MakeExpressionError } from "@enumeratio/boxes";
import { readEntries, recordDirs } from "@enumeratio/entry/node";
import { expect, test } from "vite-plus/test";

// MakeExpression over the reference examples' expressions: written as boxes and read back, each
// is the same expression, once canonical. The standard run takes every 20th; `DEEP_TESTS=1`
// takes them all, which is where the decline and mismatch rates are read.
const deep = process.env.DEEP_TESTS === "1";
const STRIDE = 20;

const packagesRoot = join(import.meta.dirname, "../..");
const exprs = recordDirs(packagesRoot).flatMap(({ dir }) =>
  readEntries(dir).flatMap((entry) =>
    (entry.examples ?? []).map((e) => ({ id: `${entry.name}/${e.id}`, expr: e.expr })),
  ),
);
const sample = deep ? exprs : exprs.filter((_, i) => i % STRIDE === 0);

const ce = new ComputeEngine();
const canonicalNode = (json: unknown): unknown => {
  ce.pushScope();
  try {
    return ce.box(json as never).json;
  } catch {
    return json;
  } finally {
    ce.popScope();
  }
};
// The boxes write `Divide`, `Subtract`, `Negate` and `Rational` as the fraction or difference their
// `Multiply`/`Add` spellings write, so both sides go to one vocabulary first. That holds inside a held
// argument (`Expand`, `Solve`, `N`, a `Function` body) too, where CE leaves what it is given.
const BIG_OPERATORS = new Set(["Sum", "Product", "Integrate"]);
// The reciprocal of a product is the product of the reciprocals.
const reciprocal = (x: unknown): unknown =>
  Array.isArray(x) && x[0] === "Multiply" ? ["Multiply", ...x.slice(1).map(reciprocal)] : ["Power", x, -1];
const vocabulary = (json: unknown): unknown => {
  if (!Array.isArray(json)) return json;
  const [head, ...args] = json.map(vocabulary) as [string, ...unknown[]];
  if ((head === "Divide" || head === "Rational") && args.length === 2)
    return ["Multiply", args[0], reciprocal(args[1])];
  if (head === "Subtract" && args.length === 2) return ["Add", args[0], ["Multiply", -1, args[1]]];
  if (head === "Negate" && args.length === 1) return ["Multiply", -1, args[0]];
  if (head === "Power" && args.length === 2 && Number.isInteger(args[1]) && (args[1] as number) < 0)
    return reciprocal(["Power", args[0], -(args[1] as number)]);
  // `(a^-1 mod n)` is how both a modular inverse and a power with exponent -1 are written.
  if (head === "PowerMod" && args.length === 3 && args[1] === -1) return ["ModularInverse", args[0], args[2]];
  // A bound is written the same as a `Limits`, which is what compute-engine canonicalizes it to.
  if (BIG_OPERATORS.has(head))
    return [
      head,
      args[0],
      ...args.slice(1).map((a) => (Array.isArray(a) && a[0] === "Tuple" ? ["Limits", ...a.slice(1)] : a)),
    ];
  return [head, ...args];
};
// Canonical at every depth, so a held argument is as canonical as a free one.
const deepCanonical = (json: unknown): unknown =>
  Array.isArray(json) ? canonicalNode([json[0], ...json.slice(1).map(deepCanonical)]) : json;
// Canonical forms spell a reciprocal their own way (`Divide(1, a)`), so the vocabulary is applied again.
const canonical = (json: unknown): string => {
  const once = canonicalNode(deepCanonical(vocabulary(json)));
  return JSON.stringify(canonicalNode(deepCanonical(vocabulary(once))));
};

test("MakeExpression reads the reference examples back", () => {
  const rows = { exact: 0, equivalent: 0, declined: 0, mismatched: 0 };
  const mismatched: string[] = [];
  const declined = new Map<string, number>();
  for (const { id, expr } of sample) {
    let boxes;
    try {
      boxes = makeBoxes(expr as MathJsonExpression);
    } catch {
      continue; // an example makeBoxes cannot write has nothing to read back
    }
    let back: MathJsonExpression;
    try {
      back = makeExpression(boxes);
    } catch (error) {
      if (!(error instanceof MakeExpressionError)) throw error;
      rows.declined++;
      const why = error.message.replace(/: .*/s, "");
      declined.set(why, (declined.get(why) ?? 0) + 1);
      continue;
    }
    if (JSON.stringify(back) === JSON.stringify(expr)) rows.exact++;
    else if (canonical(back) === canonical(expr)) rows.equivalent++;
    else {
      rows.mismatched++;
      if (mismatched.length < 10) mismatched.push(`${id}: ${JSON.stringify(expr)} => ${JSON.stringify(back)}`);
    }
  }
  const total = rows.exact + rows.equivalent + rows.declined + rows.mismatched;
  console.info(
    `makeExpression over ${total} examples${deep ? "" : ` (every ${STRIDE}th)`}: ${rows.exact} exact, ` +
      `${rows.equivalent} equivalent once canonical, ${rows.declined} declined, ${rows.mismatched} mismatched`,
  );
  console.info(`declined: ${JSON.stringify([...declined.entries()].toSorted((a, b) => b[1] - a[1]).slice(0, 8))}`);
  console.info(`mismatches:\n${mismatched.join("\n")}`);
  // What is left is heads whose notation shares a spelling with another (`ζ(s, a)`, an interval and a
  // list), operands `makeBoxes` drops (a second integration variable, a step), or layout and
  // interfaces: boxes that say nothing of the expression.
  expect(rows.exact + rows.equivalent).toBeGreaterThan(0.975 * total);
  expect(rows.declined).toBeLessThan(0.01 * total);
}, 600_000);
