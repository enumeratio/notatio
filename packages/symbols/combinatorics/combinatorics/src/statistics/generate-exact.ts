// The exact counts' compiled code (`Definition.exact`): each definition compiled over BigInts by
// `compileBigint`, where an integer past 2^53 stays an integer and a division that leaves a remainder
// throws instead of rounding, then held to the interpreter's answer on `subjectsOf(definition)`. Kept apart
// from generate-compiled.ts, whose text keys every statistics verdict; the verdicts of these are
// `compile-exact`'s own (scripts/verdicts.ts). Run by scripts/compile-exact.ts, read by compiled.ts.

import type { Engine } from "@notatio/engine";
import { definitionHash } from "@notatio/engine/compiled";
import { compileBigint, fromBigint, toBigint } from "@notatio/engine/compiled-bigint";
import { bareEngine } from "@notatio/engine/testing";
import { evaluateEpsil, evaluateEpsilRepeatedly } from "@notatio/structures";
import { subjectToJs } from "../flat.ts";
import type { CompiledDefinition, Verdicts } from "./generate-compiled.ts";
import { type Definition, SUBJECT, signatureOf } from "./types.ts";

/** The integer a MathJSON answer stands for, `{ num: "1.2e+22" }` included; undefined for anything else. */
export function integerOf(json: unknown): bigint | undefined {
  if (typeof json === "number") return Number.isInteger(json) ? BigInt(json) : undefined;
  const text = typeof json === "object" && json !== null && "num" in json ? String((json as { num: unknown }).num) : "";
  const parts = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(text);
  if (parts === null) return undefined;
  const [, sign, whole, fraction = "", exponent = "0"] = parts;
  const shift = Number(exponent) - fraction.length;
  if (shift < 0) return undefined;
  const value = BigInt(whole! + fraction) * 10n ** BigInt(shift);
  return sign === "-" ? -value : value;
}

/**
 * `expr` in the form the BigInt compiler takes, the same function: a `Sum`, `Product`, `Max` or `Min` of a list is a fold
 * whose first value is a literal or an element (compute-engine's own lowering starts it from a double, which a bigint
 * cannot be combined with), and a `Range` states its step (the compiler counts an unstated one in doubles beside a bigint start).
 */
export function bigintForm(expr: unknown): unknown {
  if (!Array.isArray(expr)) return expr;
  const [head, ...operands] = expr.map(bigintForm);
  if ((head === "Sum" || head === "Product") && operands.length === 1) {
    const [operation, first] = head === "Sum" ? ["Add", 0] : ["Multiply", 1];
    return ["Fold", ["Function", [operation, "foldA", "foldB"], "foldA", "foldB"], first, operands[0]];
  }
  // A `Max` or `Min` of a list starts from -Infinity or Infinity, a double: fold from the first element instead.
  if ((head === "Max" || head === "Min") && operands.length === 1)
    return ["Fold", ["Function", [head, "foldA", "foldB"], "foldA", "foldB"], ["At", operands[0], 1], operands[0]];
  if (head === "Range" && operands.length === 2) return ["Range", ...operands, 1];
  return [head, ...operands];
}

/** Whether the BigInt code gives the interpreter's integer on every subject: the code is an exact count's only compiled
 *  route, so one it declines is a gap (the interpreter answers it at run time), and the verdict is no. */
function agrees(
  ce: Engine,
  definition: Definition,
  run: (vars: Record<string, unknown>) => unknown,
  subjects: readonly unknown[],
): boolean {
  let answered = 0;
  for (const subject of subjects) {
    const value = subjectToJs(subject);
    if (value === undefined) continue;
    let answer: unknown;
    try {
      answer = fromBigint(run(toBigint({ [SUBJECT]: value }) as Record<string, unknown>));
    } catch (error) {
      // The code is the only compiled route of an exact count, so a subject it declines is a gap, not a skip.
      console.warn(`${signatureOf(definition)}: BigInt code declines ${JSON.stringify(subject)}: ${String(error)}`);
      return false;
    }
    if (typeof answer !== "bigint" && !(typeof answer === "number" && Number.isInteger(answer))) {
      console.warn(
        `${signatureOf(definition)}: BigInt code answers ${String(answer)} on ${JSON.stringify(subject)}, not an integer`,
      );
      return false;
    }
    answered++;
    const got = BigInt(answer);
    const same = (expected: unknown) => integerOf(expected) === got;
    if (
      !same(evaluateEpsilRepeatedly(ce, definition.expr, { [SUBJECT]: subject })) &&
      !same(evaluateEpsil(ce, definition.expr, { [SUBJECT]: subject }))
    )
      return false;
  }
  return answered > 0;
}

/** Every exact definition of `definitions` that compiles over BigInts and agrees with the interpreter on
 *  `subjectsOf(definition)`; one that compiles and disagrees is in `disagreed`, one the compiler can't take is left out
 *  (both are interpreted). `shapeOf` is a carrier's bare shape, e.g. `list<integer>`. Only those `mine` takes are looked at. */
export function exactDefinitionsFor(
  definitions: readonly Definition[],
  shapeOf: (carrier: string) => string,
  subjectsOf: (ce: Engine, definition: Definition) => readonly unknown[],
  verdicts: Verdicts,
  mine: (signature: string) => boolean,
): { compiled: CompiledDefinition[]; disagreed: string[] } {
  const ce = bareEngine();
  const compiled: CompiledDefinition[] = [];
  const disagreed: string[] = [];
  for (const definition of definitions.filter((d) => d.exact === true && mine(signatureOf(d)))) {
    if (definition.where !== undefined)
      throw new Error(`${signatureOf(definition)}: an exact count has no \`where\` yet`);
    const subjects = subjectsOf(ce, definition);
    if (verdicts.sourceOnly) {
      verdicts.note({ expr: definition.expr, exact: true, subjects }, signatureOf(definition));
      continue;
    }
    const code = compileBigint(ce, bigintForm(definition.expr), { [SUBJECT]: shapeOf(definition.on) });
    if (code === undefined) continue;
    const parts = { expr: definition.expr, exact: true, code: code.code, subjects };
    const source = { expr: definition.expr, exact: true, subjects };
    if (
      verdicts.remember(
        parts,
        source,
        () => {
          console.error(`checking ${signatureOf(definition)} on ${subjects.length} subjects`);
          return agrees(ce, definition, code.run, subjects);
        },
        signatureOf(definition),
        false,
      )
    )
      compiled.push({ signature: signatureOf(definition), hash: definitionHash(definition.expr), code: code.code });
    else disagreed.push(signatureOf(definition));
  }
  return {
    compiled: compiled.toSorted((a, b) => (a.signature < b.signature ? -1 : a.signature > b.signature ? 1 : 0)),
    disagreed: disagreed.toSorted(),
  };
}

/** Renders `entries` as the `statistics.exact.generated.js` module text: code over `_SYS` (the BigInt runtime) and `_`. */
export function renderExact(entries: readonly CompiledDefinition[]): string {
  const body = entries
    .map(
      (e) =>
        `  ${JSON.stringify(e.signature)}: {\n    hash: ${JSON.stringify(e.hash)},\n    run: (_SYS, _) => ${e.code},\n  },`,
    )
    .join("\n");
  return `// GENERATED by scripts/compile-exact.ts from the Epsil of the definitions marked \`exact\`, by
// compute-engine's JavaScript compiler over BigInts. Do not edit: rerun the script. Each entry is
// used only while \`hash\` matches its definition; see ../src/statistics/compiled.ts.
/* eslint-disable no-unused-vars, unicorn/no-useless-spread */

export const EXACT_COMPILED = {
${body}
};
`;
}
