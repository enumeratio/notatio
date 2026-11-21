import { bareEngine, createEngine } from "@notatio/engine/testing";
import { declareCollections } from "../src/library.ts";

// The differential every override test shares: an override of a compute-engine head agrees with
// the native head wherever the native head answers, and answers a lazy collection as it answers
// the List of its elements. A difference on purpose is listed with its reason; nothing else may differ.

export const bare = bareEngine();
export const declared = createEngine(declareCollections);

export type Json = unknown;
export type Call = readonly unknown[];

export const range = (...bounds: number[]): Json => ["Range", ...bounds];
const double: Json = ["Function", ["Multiply", "x", 2], "x"];
const list: Json = ["List", 5, 3, 9, 1, 3];

/** Operands: lists and ranges, and the lazy collections built over each. */
export const operands: Record<string, Json> = {
  list,
  asc: range(1, 5),
  desc: range(5, 1, -1),
  step: range(1, 9, 2),
};
for (const [name, c] of Object.entries({ ...operands })) {
  operands[`take(${name})`] = ["Take", c, 3];
  operands[`drop(${name})`] = ["Drop", c, 1];
  operands[`map(${name})`] = ["Map", double, c];
  operands[`filter(${name})`] = ["Filter", c, ["Function", ["Greater", "x", 2], "x"]];
  operands[`reverse(${name})`] = ["Reverse", c];
}
operands.empty = ["List"];
operands.emptyTake = ["Take", list, 0];
operands.emptyFilter = ["Filter", list, ["Function", ["Greater", "x", 99], "x"]];
operands.emptyRange = range(3, 1);
operands.tied = ["Map", ["Function", ["Mod", "x", 2], "x"], range(1, 6)];
operands.tiedTake = ["Take", ["List", 2, 2, 5, 5, 5], 4];
operands.singleton = ["List", 7];
operands.nested = ["List", ["List", 3, 1], ["List", 2], ["List", 1, 2, 3]];
operands.matrix = ["List", ["List", 1, 2], ["List", 3, 4]];
operands.words = ["List", "'pear'", "'fig'", "'apple'"];
operands.string = "'hello'";
// An unknown symbol, bare and under a lazy head: neither has elements to read.
operands.unknown = "xs";
operands.takeUnknown = ["Take", "xs", 3];
operands.mapUnknown = ["Map", double, "xs"];

/** A call the override answers differently on purpose, with its reason. */
export interface Deliberate {
  readonly why: string;
  readonly skip: (call: Call) => boolean;
}

/** Each overridden head's calls on an operand, with its other arguments. */
export type CallBuilders = Record<string, (c: Json) => Call[]>;

/** Heads whose answers agree up to a deliberate difference, with the reason. */
export type Agree = Record<string, (reference: string, ours: string) => boolean>;

/** The evaluated answer as JSON, or `undefined` where the engine declines or errors. */
export const answer = (ce: typeof bare, expr: Call): string | undefined => {
  try {
    const result = ce.box(expr as never).evaluate();
    const json = JSON.stringify(result.json);
    return json.includes('"Error"') || result.operator === expr[0] ? undefined : json;
  } catch {
    return undefined;
  }
};

export interface Options {
  readonly deliberate?: readonly Deliberate[];
  readonly agree?: Agree;
  /** Leaves out a call on an operand, with the reason in a comment where it is passed. */
  readonly skipOperand?: (head: string, name: string, call: Call) => boolean;
}

/** The calls where the declared engine differs from the native head, as a report (empty when none). */
export function nativeMisfires(
  builders: CallBuilders,
  { deliberate = [], agree = {}, skipOperand }: Options = {},
): string {
  const misfires: string[] = [];
  for (const [head, build] of Object.entries(builders)) {
    for (const [name, operand] of Object.entries(operands)) {
      for (const call of build(operand)) {
        if (deliberate.some((d) => d.skip(call)) || skipOperand?.(head, name, call)) continue;
        const native = answer(bare, call);
        if (native === undefined) continue;
        const ours = answer(declared, call);
        if (ours === undefined || !(agree[head]?.(native, ours) ?? ours === native)) {
          misfires.push(`${head} ${name}: ${JSON.stringify(call)}\n    native   ${native}\n    declared ${ours}`);
        }
      }
    }
  }
  return misfires.join("\n");
}

const LAZY = /^(take|drop|map|filter|reverse)\(|^(asc|desc|step|empty(Take|Filter|Range)|tied(Take)?)$/;

/** The calls where a lazy collection is answered differently from the List of its elements. */
export function lazyMisfires(
  builders: CallBuilders,
  { deliberate = [], skipOperand }: Pick<Options, "deliberate" | "skipOperand"> = {},
): string {
  const misfires: string[] = [];
  for (const [head, build] of Object.entries(builders)) {
    for (const [name, operand] of Object.entries(operands)) {
      if (!LAZY.test(name)) continue;
      const elements = [
        ...(bare.box(operand as never).evaluate() as unknown as { each(): Iterable<{ json: Json }> }).each(),
      ];
      const listCalls = build(["List", ...elements.map((e) => e.json)]);
      build(operand).forEach((call, i) => {
        if (deliberate.some((d) => d.skip(call)) || skipOperand?.(head, name, call)) return;
        const reference = answer(declared, listCalls[i]!);
        const ours = answer(declared, call);
        if (reference !== undefined && ours !== undefined && ours !== reference) {
          misfires.push(`${head} ${name}: ${JSON.stringify(call)}\n    list     ${reference}\n    declared ${ours}`);
        }
      });
    }
  }
  return misfires.join("\n");
}

const fn = (body: unknown, ...params: string[]): Json => ["Function", body, ...params];
const U: Json = ["List", 1, 2];
const V: Json = ["List", 3, 4];

/** A call over the untyped parameters `u` and `v` inside a lambda, three ways: applied to lists, applied
 *  from a `Map` lambda, and applied from inside another lambda that binds `u`. A part read from an
 *  operand that is no list yet (`u + v`) must wait for the binding. */
const lambdaShapes = (call: Call): Record<string, Call> => ({
  apply: ["Apply", fn(call, "u", "v"), U, V],
  map: ["Map", fn(["Apply", fn(call, "u", "v"), "p", V], "p"), ["List", U]],
  nested: ["Apply", fn(["Apply", fn(call, "v"), V], "u"), U],
});

const evaluated = (ce: typeof bare, expr: Call): string => {
  try {
    return JSON.stringify(ce.box(expr as never).evaluate().json);
  } catch (error) {
    return `throws ${(error as Error).message}`;
  }
};

/** The lambda-wrapped calls on the sum `u + v` where the declared engine answers differently from the
 *  native one, errors included, for the heads that read an operand's parts (`heads`). A head that answers
 *  more than the native one (Length, Append) differs from it there on purpose, so it is not listed. */
export function shapeMisfires(
  builders: CallBuilders,
  heads: readonly string[],
  { deliberate = [] }: Pick<Options, "deliberate"> = {},
): string {
  const misfires: string[] = [];
  for (const [head, build] of Object.entries(builders)) {
    if (!heads.includes(head)) continue;
    for (const call of build(["Add", "u", "v"])) {
      if (deliberate.some((d) => d.skip(call))) continue;
      for (const [shape, wrapped] of Object.entries(lambdaShapes(call))) {
        const native = evaluated(bare, wrapped);
        const ours = evaluated(declared, wrapped);
        if (ours !== native) {
          misfires.push(`${head} ${shape}: ${JSON.stringify(wrapped)}\n    native   ${native}\n    declared ${ours}`);
        }
      }
    }
  }
  return misfires.join("\n");
}

const asInert = (json: unknown): unknown =>
  Array.isArray(json) ? (json[0] === "Add" && json[1] === "u" ? ["f", "u", "v"] : json.map(asInert)) : json;

/** The lambda-wrapped calls on `u + v` where the declared engine reads a parameter as a part: the answer
 *  is not the native one, does not keep `u + v` as written, and is what the same call answers on the
 *  inert `f(u, v)`, whose operands are parts (unbound at the top, where any answer is a read). Unlike
 *  `shapeMisfires`, a head that answers more than the native one is judged too, so it covers Length and
 *  Append. */
export function parameterReads(
  builders: CallBuilders,
  heads: readonly string[],
  { deliberate = [] }: Pick<Options, "deliberate"> = {},
): string {
  const reads: string[] = [];
  for (const [head, build] of Object.entries(builders)) {
    if (!heads.includes(head)) continue;
    for (const call of build(["Add", "u", "v"])) {
      if (deliberate.some((d) => d.skip(call))) continue;
      for (const [shape, wrapped] of Object.entries({ ...lambdaShapes(call), top: call })) {
        const ours = evaluated(declared, wrapped);
        if (ours.includes('["Add","u","v"]') || ours === evaluated(bare, wrapped)) continue;
        if (shape === "top" || ours === evaluated(declared, asInert(wrapped) as Call)) {
          reads.push(`${head} ${shape}: ${JSON.stringify(wrapped)}\n    declared ${ours}`);
        }
      }
    }
  }
  return reads.join("\n");
}
