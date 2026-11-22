// Records what every compile entry point of compute-engine is handed, for ce-0187-scan.ts. Load it before the
// script whose compiles are to be read:
//
//   node --import packages/census/scripts/ce-0187-hook.ts <script> [args…]
//
// It wraps `compile` and `compileToSource` where each target defines them, so a subclass (`FastTarget`, the
// BigInt target) and a call by the package-level `compile()` are seen the same. One JSON line per distinct call
// goes to `$CE_0187_SCAN_DIR` (default `node_modules/.cache/ce-0187-scan` under the working directory), a file per process, so the shards a script launches
// write beside each other: `{ language, entry, json, types, options, held }`. Nothing a call answers is changed.

import { appendFileSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import * as compileModule from "@cortex-js/compute-engine/compile";

type Method = (this: unknown, expr: unknown, options?: unknown) => unknown;

const dir = process.env["CE_0187_SCAN_DIR"] ?? join(process.cwd(), "node_modules", ".cache", "ce-0187-scan");
mkdirSync(dir, { recursive: true });
const file = join(dir, `${basename(process.argv[1] ?? "repl")}-${process.pid}.jsonl`);

/** The calls already written, by their text. */
const seen = new Set<string>();

/** The first stack frame in a package of this repository: which entry point of ours made the call. */
function entryOf(): string {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 60;
  const frames = (new Error().stack ?? "").split("\n").slice(2);
  Error.stackTraceLimit = limit;
  const own = frames.find(
    (f) => /\/(packages|web)\//.test(f) && !f.includes("ce-0187-hook") && !f.includes("node_modules"),
  );
  return (own ?? frames[0] ?? "").replace(/^\s*at /, "").replace(/^.*\/(packages|web)\//, "$1/");
}

interface Boxed {
  readonly json?: unknown;
  readonly unknowns?: readonly string[];
  readonly freeVariables?: readonly string[];
  readonly engine?: { box(json: unknown): { type?: { toString(): string }; value?: unknown; isConstant?: boolean } };
}

/** The declared type of each free name of the expression (a bound name has none worth reading), and which of them
 *  hold a value in the scope now. */
function namesOf(expr: Boxed): { types: Record<string, string>; held: string[] } {
  const types: Record<string, string> = {};
  const held: string[] = [];
  for (const name of new Set([...(expr.unknowns ?? []), ...(expr.freeVariables ?? [])])) {
    try {
      const symbol = expr.engine?.box(name);
      const type = symbol?.type?.toString();
      if (type !== undefined) types[name] = type;
      if (symbol?.value !== undefined && symbol.isConstant !== true) held.push(name);
    } catch {
      // a name that does not box on its own
    }
  }
  return { types, held };
}

function record(language: string, method: string, expr: unknown, options: unknown): void {
  try {
    const boxed = expr as Boxed;
    if (boxed.json === undefined) return;
    const { types, held } = namesOf(boxed);
    const opts = options as { mode?: unknown; iterationBudget?: unknown } | undefined;
    const line = JSON.stringify({
      language,
      entry: `${method}@${entryOf()}`,
      json: boxed.json,
      types,
      options: { mode: opts?.mode, iterationBudget: opts?.iterationBudget },
      held,
    });
    if (seen.has(line)) return;
    seen.add(line);
    appendFileSync(file, `${line}\n`);
  } catch {
    // never disturb the compile
  }
}

/** The target's language (`javascript`, `glsl`), read from its own description, not its minified class name. */
function languageOf(target: unknown): string {
  try {
    return String((target as { createTarget(): { language?: string } }).createTarget().language);
  } catch {
    return (target as { constructor: { name: string } }).constructor.name;
  }
}

const owners = new Map<object, Set<string>>();
for (const [name, value] of Object.entries(compileModule)) {
  if (typeof value !== "function" || !name.endsWith("Target")) continue;
  for (const method of ["compile", "compileToSource"]) {
    let owner: object | null = (value as { prototype?: object }).prototype ?? null;
    while (owner !== null && !Object.hasOwn(owner, method)) owner = Object.getPrototypeOf(owner) as object | null;
    if (owner === null) continue;
    owners.set(owner, (owners.get(owner) ?? new Set()).add(method));
  }
}
for (const [owner, methods] of owners) {
  for (const method of methods) {
    const original = (owner as Record<string, Method>)[method];
    if (typeof original !== "function") continue;
    (owner as Record<string, Method>)[method] = function (this: unknown, expr, options) {
      record(languageOf(this), method, expr, options);
      return original.call(this, expr, options);
    };
  }
}
