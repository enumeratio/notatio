// Scans what our compile entry points were handed for the shapes of compute-engine 0.187.1's known wrong
// compiled answers (BL-557), and checks each hit against the interpreter.
//
//   node --import packages/census/scripts/ce-0187-hook.ts <script>     record the compiles of a script
//   node --import packages/census/scripts/ce-0187-hook.ts packages/census/scripts/ce-0187-drive.ts
//                                                                      record the plot and code-form paths
//   node packages/census/scripts/ce-0187-scan.ts [--dir <dir>] [--check] [--json <out>]
//
// The scan reads the recorded compiles (the hook's directory, default node_modules/.cache/ce-0187-scan), and
// counts the hits per defect: a compile call that holds one, and the distinct shapes. With `--check` it takes each
// distinct hit's neighborhood (the enclosing function when the hit is in one, else the operator around it), compiles
// it with the types the compile had (names it has no type for are integers, or lists of them where they are read
// with `At`), and runs the compiled code against the interpreter at inputs that expose the defect: a spread of
// values, negatives and non-integers among them, and every assignment of a few. A hit is `agree` when every input
// both sides answer gives the same value, `disagree` when one differs (the first is printed), `declined` when the
// compiler declines the neighborhood, `unchecked` when no input gets an answer from both.
//
// What a record holds is the expression as the entry point handed it to compute-engine's compiler: after our
// canonical forms, the call expansion and the rewriting, so the shapes our own rewriting makes are seen.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ComputeEngine } from "@cortex-js/compute-engine";
import { GLSLTarget, JavaScriptTarget } from "@cortex-js/compute-engine/compile";
import {
  atPath,
  CE_0187_DECLINED,
  type Ce0187Defect,
  type Ce0187Hit,
  findCe0187Defects,
} from "@notatio/engine/compiled";

interface Recorded {
  readonly language: string;
  readonly entry: string;
  readonly json: unknown;
  readonly types: Readonly<Record<string, string>>;
  readonly options: { readonly mode?: unknown; readonly iterationBudget?: unknown };
  readonly held: readonly string[];
}

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? undefined : args[at + 1];
};
const dir = flag("dir") ?? join(process.cwd(), "node_modules", ".cache", "ce-0187-scan");

/** Each distinct line of every process's file once: shards and reruns repeat calls. */
const lines = new Set(
  readdirSync(dir)
    .filter((name) => name.endsWith(".jsonl"))
    .flatMap((name) => readFileSync(join(dir, name), "utf8").split("\n"))
    .filter((line) => line !== ""),
);
const records: Recorded[] = [...lines].map((line) => JSON.parse(line) as Recorded);

/** The entry point's name for a table: its file, without the line. */
const entryName = (entry: string): string => entry.replace(/:\d+:\d+\)?$/, "");

interface Found {
  readonly record: Recorded;
  readonly hit: Ce0187Hit;
}

const found: Found[] = [];
const options = { budget: 0, complex: 0, held: 0, complexTypes: 0 };
for (const record of records) {
  for (const hit of findCe0187Defects(record.json, record.types)) found.push({ record, hit });
  if (record.options.iterationBudget !== undefined) options.budget++;
  if (record.options.mode === "complex") options.complex++;
  if (record.held.length > 0) options.held++;
  if (Object.values(record.types).some((t) => /complex/.test(t))) options.complexTypes++;
}

const key = (f: Found): string =>
  `${f.hit.defect}|${f.hit.detail}|${JSON.stringify(atPath(f.record.json, f.hit.path))}`;
const distinct = new Map<string, Found[]>();
for (const f of found) distinct.set(key(f), [...(distinct.get(key(f)) ?? []), f]);

console.log(
  `${records.length} distinct compile calls from ${new Set(records.map((r) => entryName(r.entry))).size} entry points`,
);
const count = <T>(items: readonly T[], by: (item: T) => string): [string, number][] =>
  Object.entries(
    items.reduce<Record<string, number>>((acc, item) => ({ ...acc, [by(item)]: (acc[by(item)] ?? 0) + 1 }), {}),
  );
console.log(
  `by target: ${count(records, (r) => r.language)
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")}`,
);
console.log(
  `options: iterationBudget set in ${options.budget} calls, complex mode in ${options.complex}; names that hold a value when compiled in ${options.held}; complex-typed names in ${options.complexTypes}`,
);

const defects = [...new Set(found.map((f) => f.hit.defect))] as Ce0187Defect[];
for (const defect of defects) {
  const mine = found.filter((f) => f.hit.defect === defect);
  const shapes = [...distinct.keys()].filter((k) => k.startsWith(`${defect}|`));
  console.log(
    `${defect}${CE_0187_DECLINED.has(defect) ? " (declines)" : ""}: ${mine.length} hits in ${new Set(mine.map((f) => f.record)).size} compile calls, ${shapes.length} distinct`,
  );
  for (const [entry, n] of count(mine, (f) => entryName(f.record.entry))
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 6))
    console.log(`    ${n}  ${entry}`);
}
if (defects.length === 0) console.log("no hits");

// --- the compile handlers: code they answer with, spliced by compute-engine into the operator around it ---

/** Whether `code` is one operand: names, literals, calls, member reads and bracketed groups, no operator outside brackets. */
function isAtomic(code: string): boolean {
  let depth = 0;
  let quote = "";
  let outside = "";
  for (let i = 0; i < code.length; i++) {
    const c = code[i]!;
    if (quote !== "") {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'" || c === "`") quote = c;
    else if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) depth--;
    else if (depth === 0) outside += c;
  }
  const bare = outside.replace(/\s+/g, "");
  return /^[\w$.]*$/.test(bare) || /^\d[\d.]*e[+-]?\d+$/i.test(bare);
}

/**
 * Every compile handler a definition of the full engine carries, called with real, integer and literal operands in
 * JavaScript and GLSL: the code it answers with must be one operand (a call, an immediately-applied function), or
 * `2 * <head>(x)` splices it unparenthesized. compute-engine's own handlers are driven with a stand-in `compile`
 * callback and answer what it gives them, so a row for `EvaluateAt`, `Derivative` or `ND` is the stand-in's.
 */
async function auditHandlers(): Promise<void> {
  const { fullEngine } = await import("../src/engine.ts");
  const ce = fullEngine() as unknown as {
    context: { lexicalScope: { bindings: Map<string, { operator?: { compile?: unknown } }>; parent?: unknown } };
    box(json: unknown): { symbol?: string; json: unknown };
    pushScope(): void;
    popScope(): void;
    declare(name: string, type: string): void;
  };
  type Handler = (args: unknown[], compile: (e: { symbol?: string; json: unknown }) => string, ctx: object) => unknown;
  let handlers = 0;
  let outputs = 0;
  const bad: string[] = [];
  for (
    let scope: typeof ce.context.lexicalScope | undefined = ce.context.lexicalScope;
    scope !== undefined;
    scope = scope.parent as typeof scope | undefined
  ) {
    for (const [name, def] of scope.bindings) {
      const handler = def.operator?.compile;
      if (typeof handler !== "function") continue;
      handlers++;
      for (const language of ["javascript", "glsl"]) {
        for (let n = 1; n <= 4; n++) {
          for (const kind of ["real", "integer", "literal"]) {
            ce.pushScope();
            try {
              const names = ["a", "b", "c", "d"].slice(0, n);
              if (kind !== "literal") for (const x of names) ce.declare(x, kind);
              const args = names.map((x, i) => ce.box(kind === "literal" ? i + 2 : x));
              const out = (handler as Handler)(args, (e) => String(e.symbol ?? JSON.stringify(e.json)), {
                language,
                target: { language },
              });
              if (typeof out !== "string") continue;
              outputs++;
              if (!isAtomic(out))
                bad.push(`${name}/${n}/${language}/${kind}: ${out.replace(/\s+/g, " ").slice(0, 100)}`);
            } catch {
              // a handler that refuses these operands
            } finally {
              ce.popScope();
            }
          }
        }
      }
    }
  }
  console.log(
    `handlers: ${handlers} definitions carry a compile function; ${outputs} outputs; ${bad.length} not one operand`,
  );
  for (const row of bad) console.log(`    ${row}`);
}

if (args.includes("--handlers")) await auditHandlers();

// --- the check: compiled against the interpreter ---

type Value = number | boolean | readonly Value[];
type Verdict = "agree" | "disagree" | "declined" | "unchecked";
interface Outcome {
  readonly verdict: Verdict;
  readonly compared: number;
  readonly note?: string;
}

/** Names a node reads that nothing inside it binds: a function's parameters, a sum's index, a block's locals. */
function freeNames(node: unknown, bound: ReadonlySet<string> = new Set(), into = new Set<string>()): Set<string> {
  if (typeof node === "string") {
    if (!bound.has(node) && /^[a-z_][\w]*$/.test(node) && node !== "self") into.add(node);
    return into;
  }
  if (!Array.isArray(node)) return into;
  const [head, ...ops] = node as [string, ...unknown[]];
  const inner = new Set(bound);
  if (head === "Function") {
    for (const p of ops.slice(1)) inner.add(String(Array.isArray(p) ? p[1] : p));
    freeNames(ops[0], inner, into);
    return into;
  }
  if (head === "Sum" || head === "Product") {
    const limits = ops[1];
    if (Array.isArray(limits) && typeof limits[1] === "string") inner.add(limits[1]);
    freeNames(ops[0], inner, into);
    for (const bound of Array.isArray(limits) ? limits.slice(2) : []) freeNames(bound, bound_(inner), into);
    return into;
  }
  if (head === "Block") {
    for (const op of ops)
      if (Array.isArray(op) && (op[0] === "Assign" || op[0] === "Declare") && typeof op[1] === "string")
        inner.add(op[1]);
  }
  for (const op of ops) freeNames(op, inner, into);
  return into;
}
const bound_ = (set: ReadonlySet<string>): ReadonlySet<string> => set;

/** How deeply `name` is indexed with `At` somewhere in `node`: 0 for a scalar, 1 for a list, 2 for a list of lists. */
function depthOf(node: unknown, name: string): number {
  if (!Array.isArray(node)) return 0;
  let depth = 0;
  const [head, ...ops] = node as [string, ...unknown[]];
  if (head === "At" && ops[0] === name) depth = 1;
  if (head === "At" && Array.isArray(ops[0]) && depthOf(ops[0], name) >= 1)
    depth = Math.max(depth, depthOf(ops[0], name) + 1);
  for (const op of ops) depth = Math.max(depth, depthOf(op, name));
  if (head === "At" && Array.isArray(ops[0])) {
    const inner = depthOf(ops[0], name);
    if (inner > 0) depth = Math.max(depth, inner + 1);
  }
  return depth;
}

/** `--positive`: only inputs a definition is stated over (positive sizes and indexes), where a mismatch is not a domain's edge. */
const positive = args.includes("--positive");
const SCALARS_INTEGER = positive ? [1, 2, 3, 4, 5] : [-3, -1, 0, 1, 2, 3, 5, 7];
const SCALARS_REAL = [-2.5, -0.5, 0.3, 1.7, 2.5, 3.2];
const LISTS = [[3, 1, 4, 1, 5], positive ? [2, 1, 2, 4, 1] : [2, 0, 2, 7, 1], [1, 2, 3, 4, 5], [5, 4, 3, 2, 1]];

/** A deterministic spread of assignments to `names`. */
function assignments(
  names: readonly { name: string; depth: number; real: boolean }[],
  total = 8,
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < total; i++) {
    const at: Record<string, unknown> = {};
    names.forEach(({ name, depth, real }, j) => {
      const pick = (i * 7 + j * 3 + (i >> 2)) % 97;
      if (depth === 0) {
        const pool = real ? SCALARS_REAL : SCALARS_INTEGER;
        at[name] = pool[pick % pool.length]!;
      } else if (depth === 1) at[name] = LISTS[pick % LISTS.length]!;
      else
        at[name] = [LISTS[pick % LISTS.length]!, LISTS[(pick + 1) % LISTS.length]!, LISTS[(pick + 2) % LISTS.length]!];
    });
    out.push(at);
  }
  return out;
}

const toJson = (value: unknown): unknown =>
  Array.isArray(value)
    ? ["List", ...value.map(toJson)]
    : typeof value === "boolean"
      ? value
        ? "True"
        : "False"
      : value;

/** A compiled or interpreted answer as plain values, or undefined for one that is not a number, a boolean or a list of them. */
function plain(value: unknown): Value | undefined {
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return Number(value);
  if (value === "True") return true;
  if (value === "False") return false;
  if (Array.isArray(value)) {
    if ((value[0] === "List" && typeof value[1] !== "undefined") || value[0] === "List") {
      const items = (value as unknown[]).slice(1).map(plain);
      return items.some((x) => x === undefined) ? undefined : (items as Value[]);
    }
    const items = value.map(plain);
    return items.some((x) => x === undefined) ? undefined : (items as Value[]);
  }
  if (value !== null && typeof value === "object") {
    const o = value as { re?: unknown; im?: unknown; num?: unknown };
    if (typeof o.num === "string") return Number(o.num.replace(/[^\d.eE+-]/g, ""));
    if (typeof o.re === "number" && (o.im === 0 || o.im === undefined)) return o.re;
  }
  return undefined;
}

const same = (a: Value, b: Value): boolean =>
  typeof a === "number" && typeof b === "number"
    ? a === b || Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)) || (Number.isNaN(a) && Number.isNaN(b))
    : Array.isArray(a) && Array.isArray(b)
      ? a.length === b.length && a.every((x, i) => same(x, b[i] as Value))
      : a === b;

/** GLSL source evaluated as a JavaScript expression, with the shader functions it calls; undefined when it is not one. */
function glslRun(code: string, names: readonly string[]): ((at: Record<string, unknown>) => unknown) | undefined {
  if (/[\n;{]/.test(code) || /\bvec\d|\bfloat\b|\bint\b/.test(code)) return undefined;
  const shim = {
    abs: Math.abs,
    sqrt: Math.sqrt,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    exp: Math.exp,
    log: Math.log,
    floor: Math.floor,
    ceil: Math.ceil,
    fract: (x: number) => x - Math.floor(x),
    min: Math.min,
    max: Math.max,
    pow: Math.pow,
    sign: Math.sign,
    atan: Math.atan,
    asin: Math.asin,
    acos: Math.acos,
    radians: (x: number) => (x * Math.PI) / 180,
    _gpu_pow2: (x: number) => x * x,
    _gpu_cos: Math.cos,
    _gpu_sin: Math.sin,
    _gpu_fmod: (x: number, y: number) => x - y * Math.floor(x / y),
  } as Record<string, unknown>;
  try {
    // oxlint-disable-next-line no-implied-eval -- the shader expression under test
    const fn = new Function(...Object.keys(shim), ...names, `return (${code});`) as (...a: unknown[]) => unknown;
    return (at) => fn(...Object.values(shim), ...names.map((n) => at[n]));
  } catch {
    return undefined;
  }
}

function check(found: Found): Outcome {
  const { record, hit } = found;
  // The neighborhood: the outermost enclosing function when the hit is in one, else the operator around it.
  let cut = hit.path.slice(0, -1);
  for (let n = 1; n <= hit.path.length; n++) {
    const node = atPath(record.json, hit.path.slice(0, n));
    if (Array.isArray(node) && node[0] === "Function") {
      cut = hit.path.slice(0, n);
      break;
    }
  }
  const neighborhood =
    hit.path.length === 0 || hit.defect === "ce-0187:sum-nan"
      ? atPath(record.json, hit.path)
      : atPath(record.json, cut);
  if (JSON.stringify(neighborhood).length > 3000)
    return { verdict: "unchecked", compared: 0, note: "neighborhood too large to interpret" };
  const names = [...freeNames(neighborhood)];
  const real = Object.values(record.types).some((t) => t.startsWith("real"));
  const typed = names.map((name) => {
    const given = record.types[name];
    const depth = depthOf(neighborhood, name);
    const isReal = given !== undefined && /^real|^finite_real|^number/.test(given);
    return { name, depth, real: isReal || (real && given === undefined && depth === 0 && record.language === "glsl") };
  });
  const declare = (ce: ComputeEngine): void => {
    for (const { name, depth, real } of typed) {
      const given = record.types[name];
      ce.declare(
        name,
        given !== undefined && given !== "unknown"
          ? given
          : depth === 2
            ? "list<list<integer>>"
            : depth === 1
              ? "list<integer>"
              : real
                ? "real"
                : "integer",
      );
    }
  };

  const ce = new ComputeEngine();
  ce.pushScope();
  let run: ((at: Record<string, unknown>) => unknown) | undefined;
  try {
    declare(ce);
    const boxed = ce.box(neighborhood as never);
    if (record.language === "glsl") {
      const compiled = new GLSLTarget().compile(boxed) as { code?: string; success?: boolean };
      if (compiled.success !== true || compiled.code === undefined) return { verdict: "declined", compared: 0 };
      run = glslRun(compiled.code, names);
      if (run === undefined) return { verdict: "unchecked", compared: 0, note: "GLSL with statements" };
    } else {
      const compiled = new JavaScriptTarget().compile(boxed) as {
        run?: (at: Record<string, unknown>) => unknown;
        success?: boolean;
      };
      if (compiled.success !== true || compiled.run === undefined) return { verdict: "declined", compared: 0 };
      const lambda = Array.isArray(neighborhood) && neighborhood[0] === "Function";
      const fn = compiled.run;
      run = lambda ? undefined : fn;
      if (lambda) {
        // A function value: applied to each assignment's scalars in parameter order.
        const params = (neighborhood as unknown[]).slice(2).map((p) => String(Array.isArray(p) ? p[1] : p));
        run = (at) => (fn as unknown as (...a: unknown[]) => unknown)(...params.map((p) => at[p] ?? 2.5));
      }
    }
  } catch {
    return { verdict: "declined", compared: 0 };
  } finally {
    ce.popScope();
  }

  const lambda = Array.isArray(neighborhood) && neighborhood[0] === "Function";
  const params = lambda ? (neighborhood as unknown[]).slice(2).map((p) => String(Array.isArray(p) ? p[1] : p)) : [];
  const ie = new ComputeEngine();
  let compared = 0;
  const pool = lambda ? [...params].map((name) => ({ name, depth: 0, real: true })) : typed;
  for (const at of assignments(pool)) {
    let theirs: Value | undefined;
    try {
      theirs = plain(run!(at));
    } catch {
      continue;
    }
    let ours: Value | undefined;
    try {
      // The names are bound by a function, not substituted: a substitution into a nested function can be captured.
      const target = lambda
        ? ["Apply", neighborhood, ...params.map((p) => toJson(at[p]))]
        : ["Apply", ["Function", neighborhood, ...Object.keys(at)], ...Object.values(at).map(toJson)];
      const substituted = ie.box(target as never);
      ours = plain(substituted.N().json);
    } catch {
      continue;
    }
    if (ours === undefined || theirs === undefined) continue;
    if (typeof ours === "number" && Number.isNaN(ours)) continue;
    compared++;
    if (!same(theirs, ours))
      return {
        verdict: "disagree",
        compared,
        note: `at ${JSON.stringify(at)}: compiled ${JSON.stringify(theirs)}, interpreter ${JSON.stringify(ours)}`,
      };
  }
  return { verdict: compared === 0 ? "unchecked" : "agree", compared };
}

if (args.includes("--check")) {
  const results = new Map<string, Outcome>();
  let done = 0;
  const only = flag("only");
  for (const [k, fs] of distinct) {
    if (only !== undefined && !k.startsWith(`${only}|`)) continue;
    results.set(k, check(fs[0]!));
    if (++done % 25 === 0) console.error(`  checked ${done} of ${distinct.size}`);
  }
  for (const defect of defects) {
    const keys = [...distinct.keys()].filter((k) => k.startsWith(`${defect}|`) && results.has(k));
    if (keys.length === 0) continue;
    const tally = count(keys, (k) => results.get(k)!.verdict);
    console.log(`check ${defect}: ${tally.map(([v, n]) => `${v} ${n}`).join(", ")}`);
    for (const k of keys) {
      const r = results.get(k)!;
      if (r.verdict === "disagree" || r.verdict === "unchecked")
        console.log(
          `    ${r.verdict}: ${k.split("|").slice(1).join(" | ").slice(0, 240)}${r.note === undefined ? "" : `\n        ${r.note.slice(0, 400)}`}`,
        );
    }
  }
  const out = flag("json");
  if (out !== undefined)
    writeFileSync(
      out,
      JSON.stringify(
        [...distinct.entries()]
          .filter(([k]) => results.has(k))
          .map(([k, fs]) => ({ key: k, count: fs.length, example: fs[0]!.record.entry, ...results.get(k) })),
        null,
        1,
      ),
    );
}
