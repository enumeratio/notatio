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
const canonical = (json: unknown): string => {
  ce.pushScope();
  try {
    return JSON.stringify(ce.box(json as never).json);
  } catch {
    return `uncanonical ${JSON.stringify(json)}`;
  } finally {
    ce.popScope();
  }
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
  // list), or that print as layout or an interface: boxes that say nothing of the expression.
  expect(rows.exact + rows.equivalent).toBeGreaterThan(0.85 * total);
  expect(rows.declined).toBeLessThan(0.01 * total);
}, 600_000);
