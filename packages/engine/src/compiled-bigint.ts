// Epsil definitions compiled to JavaScript over BigInts, for the integers past 2^53 that
// compiled.ts's doubles can't hold. compute-engine's compiler in its `bigint` mode: every integer is
// a `bigint`, and what is not pure integer arithmetic (a real, `n/2` outside a rounding, a constant
// such as `π`) is a decline, which a caller hands to the interpreter. A separate entry
// (`@notatio/engine/compiled-bigint`).

import type { ComputeEngine, Expression } from "@cortex-js/compute-engine";
import { compile } from "@cortex-js/compute-engine/compile";
import { type CompiledRun, runtimeHelpers, selfContainedCode } from "./compiled.ts";

/** compute-engine's runtime helpers, which the `bigint` mode's code calls (`_SYS.bbinomial`, `_SYS.bfactorial`). */
export const bigintRuntime = runtimeHelpers;

/** A bigint compilation: `code` is one expression of `_SYS` (from `bigintRuntime`) and `_` (the
 *  variables, as bigints and lists of them). */
interface BigintCompilation {
  readonly run: CompiledRun;
  readonly code: string;
}

/** `expression` compiled over bigints, each free variable typed; undefined when the compiler declines. */
export function compileBigint(
  ce: ComputeEngine,
  expression: unknown,
  types: Readonly<Record<string, string>>,
): BigintCompilation | undefined {
  ce.pushScope();
  try {
    for (const [name, type] of Object.entries(types)) ce.declare(name, type);
    // The caller converts its inputs (`toBigint`), so the entry check has nothing to do; `fallback: false`
    // makes a decline throw, where the default logs it and hands back an interpreter.
    const result = compile(ce.box(expression as never) as Expression, {
      mode: "bigint",
      fallback: false,
      entryChecks: false,
    }) as { success?: boolean; code?: string; preamble?: string };
    const code = selfContainedCode(result);
    if (result.success !== true || code === undefined) return undefined;
    // oxlint-disable-next-line no-implied-eval -- the code is compute-engine's compiled output
    const fn = new Function("_SYS", "_", `return ${code}`) as (sys: unknown, vars: Record<string, unknown>) => unknown;
    return { run: (vars) => fn(bigintRuntime(ce), vars), code };
  } catch {
    return undefined;
  } finally {
    ce.popScope();
  }
}

/** A value for bigint code: integers as bigints, lists of them as lists, a record of variables entrywise. */
export function toBigint(value: unknown): unknown {
  if (typeof value === "number") return BigInt(value);
  if (Array.isArray(value)) return value.map(toBigint);
  return typeof value === "object" && value !== null
    ? Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, toBigint(entry)]))
    : value;
}

/** The plain JS a bigint result stands for: a bigint a double holds exactly as a number, a bigger one
 *  as it is, lists elementwise. */
export function fromBigint(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value <= BigInt(Number.MAX_SAFE_INTEGER) && value >= -BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value;
  }
  return Array.isArray(value) ? value.map(fromBigint) : value;
}

/** Whether a failure of bigint code is a decline (a double mixed in, a rank out of reach) rather
 *  than a bug in the generated code. */
export const isBigintDecline = (error: unknown): boolean => error instanceof TypeError || error instanceof RangeError;
