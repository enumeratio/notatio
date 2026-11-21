// The declared engine's interpreter time over the bare one's, on a sample of the committed sweep list, all in this
// process and on the same rows: for measuring a change to what declaring the libraries does to evaluation.
//
//   node packages/census/scripts/sweep-ratio.ts [--every N] [--slice I] [--legacy] [--only bare|declared|legacy] [--by-definition]
//
// Every N-th row of the list (default 20; `--slice I` keeps to one of the seven slices first) is interpreted on
// a bare engine and on the declared one, each side once after a warm-up of the definition's first row, in the
// list's order. `--legacy` adds a third engine, the declared one with the handlers `declareOperatorForms` used to
// give `Map`, `Fold` and `Filter`. The totals are CPU time (the box is shared, wall time is not steady). An answer
// that differs from the bare engine's is listed.

import { interpret, sweepTargets, type SweepTarget } from "@notatio/combinatorics/sweep";
import { type Engine, wrapOperator } from "@notatio/engine";
import { bareEngine } from "@notatio/engine/testing";
import { fullEngine } from "../src/engine.ts";
import { readList, sliceOf } from "./interpreter-sweep.ts";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const at = args.indexOf(name);
  return at < 0 ? undefined : args[at + 1];
};
const every = Number(flag("--every") ?? "20");
const slice = flag("--slice");
const legacy = args.includes("--legacy");
const only = flag("--only");

const targets = new Map<string, SweepTarget>(sweepTargets().map((target) => [target.key, target]));
const rows = readList(new URL("../tests/fixtures/interpreter-sweep.tsv", import.meta.url).pathname)
  .filter((row) => slice === undefined || sliceOf(row.key, row.subject) === Number(slice))
  .filter((_, i) => i % every === 0);

const allEngines: [string, Engine][] = [
  ["bare", bareEngine() as unknown as Engine],
  ["declared", fullEngine() as unknown as Engine],
];
if (legacy) {
  const old = fullEngine() as unknown as Engine;
  for (const head of ["Map", "Fold", "Filter"])
    wrapOperator(
      old as never,
      [head],
      () => true,
      () => () => undefined,
      1,
    );
  allEngines.push(["legacy", old]);
}
const engines = allEngines.filter(([name]) => only === undefined || name === only);

const cpu = (run: () => unknown): { ms: number; text: string } => {
  const before = process.cpuUsage();
  let text: string;
  try {
    text = JSON.stringify(run());
  } catch (error) {
    text = `error ${String(error).slice(0, 80)}`;
  }
  const used = process.cpuUsage(before);
  return { ms: (used.user + used.system) / 1000, text };
};

const total: Record<string, number> = {};
const perDefinition = new Map<string, Record<string, number>>();
const warmed = new Set<string>();
const differing: string[] = [];
for (const row of rows) {
  const target = targets.get(row.key)!;
  if (!warmed.has(row.key)) {
    warmed.add(row.key);
    for (const [, ce] of engines) cpu(() => interpret(ce, target, row.subject));
  }
  let reference: string | undefined;
  for (const [name, ce] of engines) {
    const { ms, text } = cpu(() => interpret(ce, target, row.subject));
    total[name] = (total[name] ?? 0) + ms;
    const mine = perDefinition.get(row.key) ?? {};
    mine[name] = (mine[name] ?? 0) + ms;
    perDefinition.set(row.key, mine);
    if (name === "bare") reference = text;
    else if (reference !== undefined && text !== reference)
      differing.push(`${name} ${row.key} ${JSON.stringify(row.subject)}`);
  }
}

console.log(`${rows.length} rows`);
for (const [name] of engines)
  console.log(
    `${name.padEnd(9)} ${(total[name]! / 1000).toFixed(1)} s cpu${name === "bare" || total.bare === undefined ? "" : `  ratio ${(total[name]! / total.bare!).toFixed(3)}`}`,
  );
if (only === undefined) console.log(`answers differing from bare: ${differing.length}`);
for (const line of differing.slice(0, 20)) console.log(`  ${line}`);
if (args.includes("--by-definition")) {
  const worst = [...perDefinition]
    .filter(([, t]) => t.bare! > 100)
    .map(([key, t]) => [key, t.declared! / t.bare!, t.bare!] as const)
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 25);
  for (const [key, ratio, bare] of worst)
    console.log(`${ratio.toFixed(2).padStart(6)}  ${bare.toFixed(0).padStart(6)} ms bare  ${key}`);
}
