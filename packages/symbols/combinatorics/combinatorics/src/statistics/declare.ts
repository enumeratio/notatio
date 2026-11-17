// Declare a statistic from its DEFINITION — the expression is the implementation.
//
// There is no hand-written TypeScript behind these heads, so there is no second implementation
// to drift from; what runs fast is compiled from the definition itself (compiled.ts). Where a fast path does exist (the permutation statistics already in
// @notatio/combinatorics/collections), the two are held together by a differential test instead.

import { definitionHash, isCacheableDefinition, type MathJSON, pureResult } from "@notatio/engine/compiled";
import { compiledStatistic } from "./compiled.ts";
import { bareEngine } from "@notatio/engine/testing";
import { declareCompile, type Engine, type Expr, isNativeHead, operandsOf } from "@notatio/engine";
import { symbolInfo } from "@notatio/manifest";
import {
  allCarrierNames,
  carrierTypeForName,
  fill,
  operationOf,
  registerCarrier,
  registerOperation,
} from "@notatio/structures";
import { findstat } from "../../findstat/src/findstat-data.ts";
import { bySignature, type Definition, isTrue, signatureOf, SUBJECT } from "./types.ts";

type BoxInput = Parameters<Engine["box"]>[0];

const compiledCache = {
  expr: new WeakMap<Definition, ReturnType<typeof compiledStatistic> | null>(),
  where: new WeakMap<Definition, ReturnType<typeof compiledStatistic> | null>(),
};
const purity = { expr: new WeakMap<Definition, boolean>(), where: new WeakMap<Definition, boolean>() };

/** `expr` or `where` of `definition` at `subject`: compiled where it compiles, the interpreter
 *  otherwise, and shared by every engine when the expression is pure. */
function evaluateAt(ce: Engine, definition: Definition, part: "expr" | "where", subject: Expr): MathJSON | undefined {
  const expr = part === "expr" ? definition.expr : definition.where!;
  const compute = (): MathJSON | undefined => {
    // Compiled ahead of time where it could be; the interpreter is the definition itself.
    let compiled = compiledCache[part].get(definition);
    if (compiled === undefined)
      compiledCache[part].set(definition, (compiled = compiledStatistic(ce, definition, part) ?? null));
    return compiled?.(subject.json) ?? (interpretExpression(ce, expr, subject).json as MathJSON);
  };
  // A pure definition's answer depends only on the definition and the subject.
  let pure = purity[part].get(definition);
  if (pure === undefined) purity[part].set(definition, (pure = isCacheableDefinition(ce, expr, { [SUBJECT]: "any" })));
  return pure ? pureResult(definitionHash(part === "expr" ? expr : { where: expr }), subject.json, compute) : compute();
}

/**
 * Evaluate `definition` at `subject` — substitute the wildcard and evaluate. Exported
 * because it is also how the tests and the reduction analysis reach a definition. The subject is
 * the caller's to choose in the definition's domain (`inDomain`): off it the value is not the statistic's.
 */
export function applyDefinition(ce: Engine, definition: Definition, subject: Expr): Expr {
  return ce.box((evaluateAt(ce, definition, "expr", subject) ?? "Nothing") as never);
}

/**
 * Whether `subject` is in the definition's domain: always without a `where`, else only when `where`
 * evaluates to `True` there. `False`, an expression left unevaluated and an error all leave it out,
 * so a definition declines wherever its `where` cannot vouch for it.
 */
export function inDomain(ce: Engine, definition: Definition, subject: Expr): boolean {
  if (definition.where === undefined) return true;
  try {
    return isTrue(evaluateAt(ce, definition, "where", subject));
  } catch {
    return false;
  }
}

/** The definition evaluated by the interpreter alone: what the compiled code is held to. */
export function interpretDefinition(ce: Engine, definition: Definition, subject: Expr): Expr {
  return interpretExpression(ce, definition.expr, subject);
}

function interpretExpression(ce: Engine, expression: MathJSON, subject: Expr): Expr {
  // In a scope of its own: boxing declares the free `_x`, and a definition that fixes its
  // type (Depth's `Abs(At(_x, i) - i)` makes it a number) would otherwise pin that type on
  // the global `_x` for every later definition, whose `Length(_x)` then never reduces.
  ce.pushScope();
  try {
    const direct = ce
      .box(expression as BoxInput)
      .subs({ [SUBJECT]: subject })
      .evaluate();
    // A literal empty list under `At` types as `missing` and the definition fails to type-check;
    // filled in as JSON before boxing (structures' `fill`) it reads as it should. Tried second:
    // a definition that maps over the subject (trees) only reduces with the literal.
    if (!JSON.stringify(direct.json).includes('"Error"')) return direct;
    return ce.box(fill(expression, subject.json, SUBJECT) as BoxInput).evaluate();
  } finally {
    ce.popScope();
  }
}

/**
 * The ways a caller can wire the statistics. Each definition always goes into its carrier's
 * `CombinatorialStat` table; it is also a head of its own unless that name is taken.
 */
export interface DeclareOptions {
  /**
   * Declare each statistic over its carrier's DOMAIN TYPE, and unwrap the constructed value
   * before evaluating.
   *
   * This is the intended mode: a combinatorial statistic is a function OF a carrier, so
   * `Cycles(Permutation([2,1,3]))` is the question and `Cycles([2,1,3])` is a type error —
   * which is the whole reason the domains exist. A definition marked `alsoOnList` additionally
   * accepts a bare list, because that reading stands on its own (see `Definition.alsoOnList`).
   * It is also what lets `CombinatorialStat` find a value's carrier from its type.
   *
   * Read back from `@notatio/structures`' carrier registry by default (`carrierTypeForName`,
   * as families do since #458) — the caller's own area already declared its carriers on `ce`
   * before calling this, so the type is there to read rather than pass in. Pass an explicit map
   * only to override that, keyed by carrier (`definition.on`); a carrier missing from BOTH the
   * registry and this map takes a bare list instead, which is what the definition tests use.
   */
  readonly domainTypes?: Readonly<Record<string, string>>;
}

/** A statistic's name taken by something that is not the same statistic. */
export class StatisticCollisionError extends Error {
  readonly signatures: readonly string[];
  constructor(signatures: readonly string[]) {
    super(`statistics: already declared by something else: ${signatures.join(", ")}`);
    this.name = "StatisticCollisionError";
    this.signatures = signatures;
  }
}

/**
 * The bare-list shape of a carrier, for the untyped declaration. A set partition is a list
 * of BLOCKS; declaring it as a list of integers made every set-partition statistic an
 * unreachable type error.
 */
const BARE_SHAPE: Readonly<Record<string, string>> = {
  SetPartition: "list<list<integer>>",
};

/** The argument type a statistic accepts, given how the caller wired the carriers — an
 *  explicit override first, then whatever the caller's own `declareCarriers` already
 *  registered on `ce` for this carrier, then the bare list as a last resort. */
function subjectType(ce: Engine, definition: Definition, options: DeclareOptions): string {
  const bare = BARE_SHAPE[definition.on] ?? "list<integer>";
  const carrier = options.domainTypes?.[definition.on] ?? carrierTypeForName(ce, definition.on);
  if (carrier === undefined) return bare;
  // A union, so one head answers both readings and the handler tells them apart by the
  // operator. compute-engine accepts `(permutation | list<integer>) -> number` and dispatches
  // to the same evaluator for either arm.
  return definition.alsoOnList === true ? `${carrier} | ${bare}` : carrier;
}

/** FindStat's ids for each of our statistics, by signature: matched by value, as findstat-data
 *  records, and as the head's record states. */
const BY_VALUE: ReadonlyMap<string, readonly string[]> = new Map(
  findstat.map((match) => [`${match.head}@${match.on}`, match.findstat]),
);
const findstatIds = (definition: Definition): string[] => [
  ...new Set([
    ...(BY_VALUE.get(signatureOf(definition)) ?? []),
    ...(symbolInfo(definition.head)?.findstat ?? [])
      .filter((ref) => ref.on === undefined || ref.on === definition.on)
      .map((ref) => ref.id),
  ]),
];

/**
 * Give a head a statistic's carrier as one more argument, so the bare head dispatches on its
 * argument's carrier the way `CombinatorialStat` does. Every arm the head had is kept; only a
 * value of the carrier reaches the definition. Used for a head another carrier already
 * declared (`Peaks` on permutations, then on Dyck paths) and for compute-engine's own: `Sign`
 * of a permutation is its ±1, the same map onto the signs that a number's `Sign` is (Dean,
 * 2026-09-28), so it generalises the head rather than overloading it.
 */
function extendHead(ce: Engine, definition: Definition, type: string | undefined): void {
  const found = ce.lookupDefinition(definition.head);
  const operator = found !== undefined && "operator" in found ? found.operator : undefined;
  if (operator === undefined || type === undefined) return;
  // A one-argument head takes the carrier as one more type of its argument: an overload set
  // would turn away what the native arm took (`Sign(NaN)` stops matching either arm).
  const native = String(operator.signature);
  const single = /^\(([^,&]+)\) -> ([^&]+)$/.exec(native);
  const results = single === null ? [] : [...new Set([...single[2]!.split(" | "), "number"])];
  (operator as { signature: unknown }).signature = ce.type(
    single === null ? `((${type}) -> number) & ${native}` : `(${type} | ${single[1]}) -> ${results.join(" | ")}`,
  );
  const nativeEvaluate = operator.evaluate;
  operator.evaluate = (ops, options) => {
    const subject = ops[0];
    if (subject?.operator !== definition.on) return nativeEvaluate?.(ops, options);
    const inner = operandsOf(subject)[0] ?? subject;
    return inDomain(ce, definition, inner) ? applyDefinition(ce, definition, inner) : undefined;
  };
  // compile builtin: answers only for the carrier it is declared on
  declareCompile(ce, definition.head, "builtin");
}

let bare: Engine | undefined;
/** Whether compute-engine itself defines `head`, with a meaning of its own (`Sign`). */
const isEngineHead = (head: string): boolean => isNativeHead((bare ??= bareEngine()), head);

/**
 * File every definition in its carrier's `CombinatorialStat` table, and declare it as a
 * head of its own where the name is free. A taken name is fine in three cases, all explicit:
 * the table already holds another package's kernel for this very statistic
 * (@notatio/combinatorics/collections' permutation statistics); compute-engine owns the
 * name (`Sign`), when its head is generalised to take the carrier too; or another carrier's
 * OWN call to this function already declared it (`MajorIndex` on `Permutation` and on
 * `DyckPath`: one head, one owner, the first call wins — see each area's own `declare<Area>`,
 * which calls this separately per area since step 6b, so the shadow can span calls, not just
 * one `definitions` array). Anything else is a `StatisticCollisionError`, listing every one.
 *
 * Definitions for one head on several carriers share the head, the first declaring it; each
 * later carrier widens it (`extendHead`), so the bare head dispatches on its argument's
 * carrier. Every one of them is in its carrier's table.
 */
export function declareStatistics(
  ce: Engine,
  definitions: readonly Definition[],
  options: DeclareOptions = {},
): Map<string, Definition> {
  const index = bySignature(definitions);
  const collisions: string[] = [];

  for (const definition of definitions) {
    const type = options.domainTypes?.[definition.on] ?? carrierTypeForName(ce, definition.on);
    registerCarrier(ce, { name: definition.on, ...(type === undefined ? {} : { type }) });
    registerOperation(ce, "CombinatorialStat", definition.on, {
      name: definition.head,
      findstat: findstatIds(definition),
      epsil: { expression: definition.expr, subject: SUBJECT },
      // Off the domain there is no value: the operation's contract is `undefined`, and the call stays.
      definition: (subject) => {
        const inner = subject.operator === definition.on ? (operandsOf(subject)[0] ?? subject) : subject;
        return inDomain(ce, definition, inner) ? applyDefinition(ce, definition, inner) : undefined;
      },
    });

    if (isNativeHead(ce, definition.head)) {
      const kernel = operationOf(ce, "CombinatorialStat", definition.on, definition.head)?.kernel;
      if (kernel !== undefined) continue;
      // Another carrier already has an entry under this exact head — a call for THAT carrier
      // already ran (this area's own, earlier in `definitions`, or another area's declare
      // entirely) and won the name; this carrier widens that head rather than colliding.
      const shadowedByAnotherCarrier = allCarrierNames(ce).some(
        (carrier) =>
          carrier !== definition.on && operationOf(ce, "CombinatorialStat", carrier, definition.head) !== undefined,
      );
      if (shadowedByAnotherCarrier || isEngineHead(definition.head)) extendHead(ce, definition, type);
      else collisions.push(signatureOf(definition));
      continue;
    }

    ce.declare(definition.head, {
      signature: `(${subjectType(ce, definition, options)}) -> ${definition.result ?? "number"}`,
      evaluate: (ops: readonly Expr[]): Expr | undefined => {
        const subject = ops[0];
        if (subject === undefined) return undefined;
        // Unwrap only an actual carrier. `definition.on` IS the constructor head's spelling,
        // so this is what tells a `Permutation([3,1,2])` from the bare `[3,1,2]` that the
        // `alsoOnList` arm of the union lets through.
        const inner = subject.operator === definition.on ? (operandsOf(subject)[0] ?? subject) : subject;
        return inDomain(ce, definition, inner) ? applyDefinition(ce, definition, inner) : undefined;
      },
    });
  }
  if (collisions.length > 0) throw new StatisticCollisionError(collisions);
  return index;
}
