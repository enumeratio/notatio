// Times one interpreter-sweep definition on one subject, declared engine against bare, and optionally prints
// the heads and functions the time goes to. Run under `node --cpu-prof` for a CPU profile of the whole run;
// `summarize-cpuprofile.ts` reads one.
//
//   node packages/census/scripts/profile-interpreter.ts KEY [--subject JSON | --heaviest] [--side declared|bare|both]
//     [--repeat N]
//
// KEY is a definition's key (`Ringel@dyck_path`). `--heaviest` (the default) takes the heaviest of its large
// subjects (`targetSubjects`). Each side is run once to warm up and then `--repeat` times (default 3); the
// minimum and the median are printed, in ms, with the ratio declared over bare when both ran.

import { interpret, sweepTargets, targetSubjects } from "@notatio/combinatorics/sweep";
import { type Engine, overloadTable, wrapOperator } from "@notatio/engine";
import { bareEngine } from "@notatio/engine/testing";
import { fullEngine } from "../src/engine.ts";

const args = process.argv.slice(2);
const key = args[0];
if (key === undefined || key.startsWith("--")) throw new Error("usage: profile-interpreter.ts KEY [options]");
const flag = (name: string): string | undefined => {
  const at = args.indexOf(name);
  return at < 0 ? undefined : args[at + 1];
};
const side = flag("--side") ?? "both";
const repeat = Number(flag("--repeat") ?? "3");

const target = sweepTargets().find((candidate) => candidate.key === key);
if (target === undefined) throw new Error(`no definition ${key}`);

const declared = fullEngine() as unknown as Engine;
if (args.includes("--legacy-form-handlers"))
  // The baseline before `declareOperatorForms` stopped giving `Map`, `Fold` and `Filter` a handler that only declines.
  for (const head of ["Map", "Fold", "Filter"])
    wrapOperator(
      declared as never,
      [head],
      () => true,
      () => () => undefined,
      1,
    );
const bare = bareEngine() as unknown as Engine;

const given = flag("--subject");
let subject: unknown;
if (given !== undefined) subject = JSON.parse(given);
else {
  const { small, large } = targetSubjects(bare, target);
  subject = [...small, ...large].at(-1);
}
console.log(`${key} on ${JSON.stringify(subject).slice(0, 200)}`);

const time = (ce: Engine): { min: number; median: number } => {
  interpret(ce, target, subject);
  const times: number[] = [];
  for (let i = 0; i < repeat; i++) {
    const started = performance.now();
    interpret(ce, target, subject);
    times.push(performance.now() - started);
  }
  times.sort((a, b) => a - b);
  return { min: times[0]!, median: times[Math.floor(times.length / 2)]! };
};

interface Scope {
  readonly bindings: Map<string, { operator?: { evaluate?: (...args: unknown[]) => unknown } }>;
  readonly parent?: Scope;
}
const scopeOf = (ce: Engine): Scope => (ce as unknown as { context: { lexicalScope: Scope } }).context.lexicalScope;

/** The scopes from the engine's current one to the outermost, and how many bindings each holds. */
const scopeSizes = (ce: Engine): number[] => {
  const sizes: number[] = [];
  for (let scope: Scope | undefined = scopeOf(ce); scope !== undefined; scope = scope.parent)
    sizes.push(scope.bindings.size);
  return sizes;
};

/**
 * Wraps the `evaluate` of every operator in an engine's scope chain to count calls and time them by head: `ms` is
 * inclusive of the operand evaluations and of other heads' calls under it, `selfMs` leaves those out.
 */
function countHeads(ce: Engine): Map<string, { calls: number; ms: number; selfMs: number }> {
  const table = new Map<string, { calls: number; ms: number; selfMs: number }>();
  const stack: { name: string; child: number }[] = [];
  for (let scope: Scope | undefined = scopeOf(ce); scope !== undefined; scope = scope.parent)
    for (const [name, binding] of scope.bindings) {
      const operator = binding.operator;
      const evaluate = operator?.evaluate;
      if (operator === undefined || evaluate === undefined) continue;
      const entry = { calls: 0, ms: 0, selfMs: 0 };
      table.set(name, entry);
      operator.evaluate = function (this: unknown, ...rest: unknown[]) {
        const frame = { name, child: 0 };
        stack.push(frame);
        const started = performance.now();
        try {
          return evaluate.apply(this, rest);
        } finally {
          const took = performance.now() - started;
          stack.pop();
          entry.calls++;
          entry.ms += took;
          entry.selfMs += took - frame.child;
          const outer = stack.at(-1);
          if (outer !== undefined) outer.child += took;
        }
      };
    }
  return table;
}

const result: Record<string, { min: number; median: number }> = {};
if (args.includes("--overrides")) {
  // The library heads the declared engine re-declares in its own scope, and which of their fields differ.
  const inner = scopeOf(declared);
  const outer = inner.parent;
  if (outer === undefined) throw new Error("the declared engine has one scope");
  const FIELDS = [
    "evaluate",
    "canonical",
    "lazy",
    "signature",
    "broadcastable",
    "collection",
    "evaluateAsync",
    "compile",
  ];
  for (const [name, binding] of inner.bindings) {
    const library = outer.bindings.get(name) as { operator?: Record<string, unknown> } | undefined;
    const mine = binding.operator as Record<string, unknown> | undefined;
    if (mine === undefined || library?.operator === undefined) continue;
    const differs = FIELDS.filter((field) => String(mine[field]) !== String(library.operator![field]));
    console.log(`${name.padEnd(24)} differs: ${differs.join(" ") || "-"}  lazy ${String(mine.lazy)}`);
  }
  process.exit(0);
}
if (args.includes("--tables")) {
  // The heads our overload dispatcher wraps on the declared engine: rows (how many carry a gate, `written` or
  // `on` match) and whether the head is lazy, which makes the dispatcher evaluate its operands itself.
  for (let scope: Scope | undefined = scopeOf(declared); scope !== undefined; scope = scope.parent)
    for (const [name, binding] of scope.bindings) {
      const table = overloadTable(declared as never, name);
      if (table === undefined) continue;
      const lazy = (binding.operator as { lazy?: boolean } | undefined)?.lazy === true;
      console.log(
        `${name.padEnd(24)} rows ${String(table.rows.length).padStart(3)}  lazy ${lazy}  wrapped ${table.wrapped}`,
      );
    }
  process.exit(0);
}
if (args.includes("--heads")) {
  const ce = side === "bare" ? bare : declared;
  console.log(`scope chain of ${side}: ${scopeSizes(ce).join(", ")} bindings`);
  interpret(ce, target, subject);
  const table = countHeads(ce);
  const started = performance.now();
  interpret(ce, target, subject);
  console.log(`one call: ${(performance.now() - started).toFixed(0)} ms (heads wrapped)`);
  for (const [name, { calls, ms, selfMs }] of [...table].toSorted((a, b) => b[1].selfMs - a[1].selfMs).slice(0, 25))
    if (calls > 0)
      console.log(
        `${name.padEnd(28)} calls ${String(calls).padStart(7)}  incl ${ms.toFixed(0).padStart(7)} ms  self ${selfMs.toFixed(0).padStart(7)} ms`,
      );
  process.exit(0);
}
for (const [name, ce] of [
  ["bare", bare],
  ["declared", declared],
] as const) {
  if (side !== "both" && side !== name) continue;
  result[name] = time(ce);
  console.log(`${name}: min ${result[name]!.min.toFixed(1)} ms, median ${result[name]!.median.toFixed(1)} ms`);
}
if (result.declared !== undefined && result.bare !== undefined)
  console.log(
    `ratio declared/bare: min ${(result.declared.min / result.bare.min).toFixed(2)}, median ${(result.declared.median / result.bare.median).toFixed(2)}`,
  );
