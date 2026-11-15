// Our side of the benchmark, as a harness like every generated one (https://github.com/enumeratio/notatio/wiki/Benchmarking
// §4.2): reads case names on stdin, answers `<<name>>{json}` on stdout. The engine is
// configured once; every timed call gets a freshly boxed expression, boxed before the
// sample starts and outside the timing, and only `evaluate()` (or `N()` for a numeric precision)
// is timed. A boxed `List` keeps its evaluated elements, so evaluating one object twice times a lookup.
//
//   node packages/bench/src/harness-ts.ts

import { createInterface } from "node:readline";
import type { ComputeEngine } from "@cortex-js/compute-engine";
// The reference engine's library set; engines.ts is shared setup, not a script with effects.
import { declaredEngine } from "../../reference/scripts/engines.ts";
import { answerText } from "./agree.ts";
import { catalogPlan } from "./generate.ts";
import { measure, QUIT } from "./protocol.ts";

// The whole catalogue, like every generated harness; the coordinator asks for cases by name.
const plan = catalogPlan();
const ce: ComputeEngine = declaredEngine();

const byName = new Map(plan.cases.map((c) => [c.name, c]));

function run(name: string): object {
  const c = byName.get(name);
  if (c === undefined) return { error: `no case ${name}` };
  const cell = c.systems.ts;
  if (cell === undefined || !("sources" in cell)) return { error: "not planned for ts" };
  ce.precision = typeof c.precision === "number" ? c.precision : "machine";
  const inputs = cell.sources.map((source) => JSON.parse(source));
  const boxed = inputs.map((input) => ce.box(input));
  const numeric = c.precision !== "exact";
  const once = (expr: (typeof boxed)[number]): unknown => (numeric ? expr.N() : expr.evaluate());
  const first = once(boxed[0]!) as { json: unknown; isSame: (other: unknown) => boolean };
  // An expression left as it was is no answer; timing it would only time the lookup.
  if (first.isSame(boxed[0])) return { error: "stays unevaluated" };
  const value = answerText(first.json);
  // One fresh box per call of the coming sample, the inputs taken in turn.
  let pool: typeof boxed = [];
  let taken = 0;
  let next = 0;
  const prepare = (k: number): void => {
    pool = Array.from({ length: k }, () => ce.box(inputs[next++ % inputs.length]));
    taken = 0;
  };
  const timed = measure(() => once(pool[taken++]!), { budgetMs: c.budget * 1000, clear: prepare });
  return { value, ...timed };
}

const lines = createInterface({ input: process.stdin });
for await (const line of lines) {
  const name = line.trim();
  if (name === QUIT) break;
  let out: object;
  try {
    out = run(name);
  } catch (error) {
    out = { error: error instanceof Error ? error.message : String(error) };
  }
  process.stdout.write(`<<${name}>>${JSON.stringify(out)}\n`);
}
