// A map's Epsil definition, compiled to JavaScript by compute-engine's own compiler, and
// memoized by value. The Epsil is the definition; this is only how it runs fast. The compiled
// form comes from compiled-maps.generated.js (written ahead of time by scripts/compile-maps.ts)
// while its hash matches the definition, else from compiling on first use. When the compiler
// can't take a definition yet, or a result isn't one it can hand back exactly (only integers and
// lists of them), the interpreter answers instead. tests/compiled-maps.test.ts holds the two to
// the same answers. A map may also state a `flat` body over its carriers' flat readings
// (`Carrier.flat`: a tree as its parent array, say), which is compiled in place of the nested
// `body` when that declines; the arguments are encoded and the images decoded around it, and the
// nested `body` stays the meaning.

import type { Engine } from "@enumeratio/engine";
import {
  compileTyped,
  definitionHash,
  inlineCalls,
  fromJs,
  type GeneratedRun,
  isCacheableDefinition,
  type MathJSON,
  pureResult,
  runtimeHelpers,
  toJs,
} from "@enumeratio/engine/compiled";
import { type FlatCodec, operationEpsil } from "@enumeratio/structures";
import { FLAT } from "./flat.ts";

export { compileTyped, freshen, fromJs, toJs } from "@enumeratio/engine/compiled";

type Compiled = Pick<NonNullable<ReturnType<typeof compileTyped>>, "run">;

/** A map's definition compiled ahead of time, with the hash of the definition it came from. */
export interface GeneratedMap {
  readonly hash: string;
  readonly run?: GeneratedRun;
  readonly guard?: GeneratedRun;
  /** The carriers (type ids) whose flat readings its code takes its argument in and answers in: it was compiled
   *  from the map's `flat` body, whose hash it carries. */
  readonly flatIn?: string;
  readonly flatOut?: string;
  /** Its compiled code disagreed with the interpreter when generated: never compiled. */
  readonly interpreted?: true;
}

/** The parts of a map that its composition is resolved and hashed by. */
export interface StepMap {
  readonly name: string;
  readonly from: string;
  readonly to: string;
  readonly body?: unknown;
  readonly guard?: unknown;
  readonly flat?: unknown;
  readonly composedOf?: readonly string[];
}

/** A tuple carrier's `contents` with its parts' constructors removed: `Tuple(StandardTableau(a), StandardTableau(b))`
 *  is `Tuple(a, b)`. Anything else is left as it is. */
export function bareParts(parts: readonly string[] | undefined, contents: unknown): unknown {
  if (parts === undefined || !Array.isArray(contents) || contents[0] !== "Tuple") return contents;
  return [
    "Tuple",
    ...contents
      .slice(1)
      .map((part, i) => (Array.isArray(part) && part.length === 2 && part[0] === parts[i] ? part[1] : part)),
  ];
}

/** A tuple image (a `Tuple` or the `List` compiled code hands back) with each part in its constructor, the inverse of
 *  `bareParts`. An image of another size is left as it is, for the carrier's own check to refuse. */
export function wrapParts(parts: readonly string[] | undefined, image: unknown): unknown {
  if (parts === undefined || !Array.isArray(image) || (image[0] !== "Tuple" && image[0] !== "List")) return image;
  if (image.length - 1 !== parts.length) return image;
  return ["Tuple", ...image.slice(1).map((part, i) => [parts[i], part])];
}

/** The key a map is compiled under. */
export const mapKey = (map: Pick<StepMap, "name" | "from">): string => `${map.name}@${map.from}`;

/**
 * The maps a composition applies, in order of application: each step of `composedOf`, right to left, is
 * the map of that name on the carrier the step before delivers, and a composed step is replaced by its
 * own steps. `undefined` when a step has no such map or no body, or the chain doesn't end at `to`.
 */
export function compositionSteps<M extends StepMap>(
  maps: readonly M[],
  map: M,
  seen: readonly M[] = [],
): M[] | undefined {
  if (map.composedOf === undefined || seen.includes(map)) return undefined;
  const out: M[] = [];
  let carrier = map.from;
  for (const name of map.composedOf.toReversed()) {
    const step = maps.find((m) => m.name === name && m.from === carrier);
    if (step === undefined) return undefined;
    const inner =
      step.composedOf !== undefined
        ? compositionSteps(maps, step, [...seen, map])
        : step.body === undefined
          ? undefined
          : [step];
    if (inner === undefined) return undefined;
    out.push(...inner);
    carrier = step.to;
  }
  return carrier === map.to ? out : undefined;
}

/** The hash of a map's nested definition: what compiled code of its `body` is stamped with. */
export const bodyHash = (map: Pick<StepMap, "body" | "guard">): string =>
  definitionHash({ body: map.body, guard: map.guard });

/** The hash of a map's definition with its flat alternative: what compiled code of its `flat` body is stamped
 *  with. The same as `bodyHash` for a map with no `flat`. */
export const flatHash = (map: Pick<StepMap, "body" | "guard" | "flat">): string =>
  map.flat === undefined ? bodyHash(map) : definitionHash({ body: map.body, guard: map.guard, flat: map.flat });

/** A composition's hash: its steps' definitions, so a change to any step voids what was compiled. */
export const compositionHash = (steps: readonly StepMap[]): string =>
  definitionHash(steps.map((step) => [mapKey(step), step.to, flatHash(step)]));

/** A composition's generated chain as a function of its argument's contents, or `undefined` while the
 *  chain has no compiled form for these steps (none generated, a step interpreted, or a step edited
 *  since). `undefined` from the function declines to the steps themselves. */
export function composedDefinition(options: {
  ce: Engine;
  steps: readonly StepMap[] | undefined;
  generated?: GeneratedMap;
}): ((contents: unknown) => MathJSON | undefined) | undefined {
  const { ce, steps, generated } = options;
  if (steps === undefined || generated?.run === undefined || generated.hash !== compositionHash(steps))
    return undefined;
  const run = generated.run;
  let sys: unknown;
  return (contents) => {
    const raw = toJs(contents);
    if (raw === undefined) return undefined;
    try {
      sys ??= runtimeHelpers(ce);
      return fromJs(run(sys, { _raw: raw }));
    } catch {
      return undefined;
    }
  };
}

/** The codecs a compiled call converts through: the argument is encoded by one and the answer decoded by the other. */
export interface Codecs {
  readonly encode?: FlatCodec;
  readonly decode?: FlatCodec;
}

/** The codecs of the carriers (type ids) a flat entry reads and answers in, or `undefined` when a named carrier has none. */
export function codecsOf(from?: string, to?: string): Codecs | undefined {
  const encode = from === undefined ? undefined : FLAT[from];
  const decode = to === undefined ? undefined : FLAT[to];
  return (from !== undefined && encode === undefined) || (to !== undefined && decode === undefined)
    ? undefined
    : { ...(encode === undefined ? {} : { encode }), ...(decode === undefined ? {} : { decode }) };
}

/** One map's definition as a function of its argument's contents: compiled where it compiles,
 *  interpreted otherwise. A pure definition's answers are cached across engines (`pureResult`);
 *  `cache: false` computes afresh, as a test comparing the two paths must. `undefined` declines
 *  (the guard failed). */
export function fastDefinition(options: {
  ce: Engine;
  body: unknown;
  guard?: unknown;
  from?: string;
  to?: string;
  interpret: (contents: unknown) => unknown;
  cache?: boolean;
  generated?: GeneratedMap;
  /** A verified fast path over the plain-JS contents, tried before compiling; `undefined` declines. */
  kernel?: (raw: never) => unknown;
  /** The compiled alternative to `body` over the flat readings of `from` and `to` (those that have one). */
  flat?: unknown;
  /** The codecs of those flat readings: `from`'s encodes the argument, `to`'s decodes the answer. */
  codecs?: Codecs;
  /** The constructors of a tuple argument's and image's parts (`CombinatorialMap`): the body sees them bare. */
  argumentParts?: readonly string[];
  imageParts?: readonly string[];
}): (contents: unknown) => MathJSON | undefined {
  const { ce, body, guard, from, to, interpret, cache = true, generated, kernel, flat, argumentParts, imageParts } =
    options;
  const hash = definitionHash({ body, guard });
  const withFlat = flatHash({ body, guard, flat });
  type Ready = { body: Compiled; guard?: Compiled } & Codecs;
  let compiled: Ready | null | undefined;
  const compile = (): Ready | null => {
    if (generated !== undefined && (generated.hash === hash || (flat !== undefined && generated.hash === withFlat))) {
      if (generated.interpreted === true || generated.run === undefined) return null;
      const sys = runtimeHelpers(ce);
      const run = generated.run;
      const check = generated.guard;
      const codecs = generated.hash === hash ? {} : codecsOf(generated.flatIn, generated.flatOut);
      if (codecs === undefined) return null;
      return {
        body: { run: (vars) => run(sys, vars) },
        ...(check === undefined ? {} : { guard: { run: (vars) => check(sys, vars) } }),
        ...codecs,
      };
    }
    if (from === undefined || to === undefined) return null;
    // Calls to our other definitions are expanded, so the compiler sees them too.
    const expand = (expression: unknown): unknown =>
      inlineCalls(expression, (carrier, head) => operationEpsil(ce, carrier, head));
    // Only the nested definition compiles here: a flat body is a different algorithm, so it runs only from
    // generated code stamped with its hash, which the build's `agrees` has checked against the nested one.
    const main = compileTyped(ce, expand(body), { _raw: from });
    if (main === undefined) return null;
    if (guard === undefined) return { body: main };
    const check = compileTyped(ce, expand(guard), { _raw: from, _image: to });
    return check === undefined ? null : { body: main, guard: check };
  };
  const evaluate = (given: unknown): MathJSON | undefined => {
    const contents = bareParts(argumentParts, given);
    if (kernel !== undefined) {
      const input = toJs(contents);
      const image = input === undefined ? undefined : fromJs(kernel(input as never));
      if (image !== undefined) return image;
    }
    if (compiled === undefined) compiled = compile();
    const plain = compiled === null ? undefined : toJs(contents);
    const raw = plain === undefined || compiled?.encode === undefined ? plain : compiled.encode.encode(plain);
    if (compiled !== null && raw !== undefined) {
      try {
        const answer = compiled.body.run({ _raw: raw });
        const image = compiled.decode === undefined || answer === undefined ? answer : compiled.decode.decode(answer);
        const json = fromJs(image);
        if (json !== undefined)
          return compiled.guard !== undefined && compiled.guard.run({ _raw: raw, _image: image }) !== true
            ? undefined
            : (wrapParts(imageParts, json) as MathJSON);
      } catch {
        // The interpreter answers below.
      }
    }
    const answer = interpret(contents) as MathJSON | undefined;
    return answer === undefined ? undefined : (wrapParts(imageParts, answer) as MathJSON);
  };
  let pure: boolean | undefined;
  return (contents) => {
    // A kernel is quick enough that caching its answers costs more than computing them.
    pure ??=
      cache &&
      kernel === undefined &&
      from !== undefined &&
      isCacheableDefinition(ce, body, { _raw: from }) &&
      (guard === undefined || (to !== undefined && isCacheableDefinition(ce, guard, { _raw: from, _image: to })));
    return pure ? pureResult(hash, contents, () => evaluate(contents)) : evaluate(contents);
  };
}
