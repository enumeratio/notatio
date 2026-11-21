// What the interpreter sweep (census's `scripts/collect-interpreter-sweep.ts`) needs of the combinatorics
// definitions, with the engines left to its caller: every statistic and map definition as a target, the
// subjects it is run on, and its two routes, interpreted (the definition itself) and compiled (the code the
// build generated, or a hand-written kernel). The sweep holds an engine with every library declared to a
// bare one, and the interpreter to the compiled code; this file only reads the definitions.

import type { Engine } from "@notatio/engine";
import { smallElements } from "../scripts/samples.ts";
import { CARRIERS } from "./carriers.ts";
import { COMPILED_MAPS } from "./compiled-maps.generated.js";
import { bareParts, composedDefinition, compositionSteps, fastDefinition, mapKey, wrapParts } from "./compiled.ts";
import { FLAT } from "./flat.ts";
import { evaluateDefinition, MAPS, type CombinatorialMap } from "./maps.ts";
import { ALL_STATISTICS } from "./statistics/all.ts";
import { compiledStatistic } from "./statistics/compiled.ts";
import { inDomain, interpretDefinition } from "./statistics/declare.ts";
import { type Definition, signatureOf } from "./statistics/types.ts";

/** A definition the sweep runs: a statistic or a map, with the carrier its subjects are elements of. */
export type SweepTarget =
  | { readonly kind: "statistic"; readonly key: string; readonly carrier: string; readonly definition: Definition }
  | { readonly kind: "map"; readonly key: string; readonly carrier: string; readonly map: CombinatorialMap };

const carrierOfType = new Map(CARRIERS.map((carrier) => [carrier.type, carrier]));

/** Every statistic, and every map that has a `body` or `composedOf` (a convert map's extra expressions are not run). */
export function sweepTargets(): SweepTarget[] {
  const statistics = ALL_STATISTICS.map((definition): SweepTarget => ({
    kind: "statistic",
    key: signatureOf(definition),
    carrier: definition.on,
    definition,
  }));
  const maps = MAPS.flatMap((map): SweepTarget[] => {
    const carrier = carrierOfType.get(map.from);
    return carrier === undefined || (map.body === undefined && map.composedOf === undefined)
      ? []
      : [{ kind: "map", key: mapKey(map), carrier: carrier.name, map }];
  });
  return [...statistics, ...maps];
}

/** The sum of the numbers in a subject: its size for ordering, whatever its carrier. */
export const weightOf = (subject: unknown): number =>
  typeof subject === "number" ? subject : Array.isArray(subject) ? subject.reduce((n, e) => n + weightOf(e), 0) : 0;

/** How many of a carrier's small elements a definition is run on. */
const SMALL_SUBJECTS = 14;
/** How many of its larger elements (families of size 6 to 8, two members each). */
const LARGE_SUBJECTS = 3;

/** `count` of `items` spread evenly through them, the last taken. */
function spread<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items];
  return Array.from({ length: count }, (_, k) => items[Math.ceil(((k + 1) * items.length) / count) - 1]!);
}

const byWeight = (subjects: readonly unknown[]): unknown[] =>
  subjects
    .map((s) => [weightOf(s), s] as const)
    .toSorted((a, b) => a[0] - b[0])
    .map(([, s]) => s);

/**
 * The generated subjects of a carrier that `admit`: up to 14 of its small elements (families to size 5),
 * spread evenly by weight, then up to 3 of the larger ones (families to size 8, two members each) heavier than
 * every small one, the heaviest last. The same every run.
 */
export function carrierSubjects(
  ce: Engine,
  carrier: string,
  admit: (subject: unknown) => boolean = () => true,
): { small: unknown[]; large: unknown[] } {
  const small = byWeight(smallElements(ce, carrier, 5, 8, true)).filter(admit);
  const heaviest = Math.max(-1, ...small.map(weightOf));
  const larger = byWeight(smallElements(ce, carrier, 8, 2, true).filter((s) => weightOf(s) > heaviest)).filter(admit);
  return { small: spread(small, SMALL_SUBJECTS), large: spread(larger, LARGE_SUBJECTS) };
}

/** `carrierSubjects` for a target, a statistic's kept to the subjects its `where` admits. */
export function targetSubjects(ce: Engine, target: SweepTarget): { small: unknown[]; large: unknown[] } {
  if (target.kind !== "statistic" || target.definition.where === undefined) return carrierSubjects(ce, target.carrier);
  const { definition } = target;
  return carrierSubjects(ce, target.carrier, (subject) => inDomain(ce, definition, ce.box(subject as never)));
}

/** The definition read by the interpreter alone: MathJSON, or `undefined` where a map's guard declines. */
export function interpret(ce: Engine, target: SweepTarget, contents: unknown): unknown {
  if (target.kind === "statistic") return interpretDefinition(ce, target.definition, ce.box(contents as never)).json;
  const { map } = target;
  if (map.composedOf !== undefined) {
    const steps = compositionSteps(MAPS, map);
    if (steps === undefined) throw new Error(`${target.key}: its steps do not resolve`);
    let value = contents;
    for (const step of steps) {
      value = wrapParts(step.imageParts, evaluateDefinition(ce, step, bareParts(step.argumentParts, value)));
      if (value === undefined) return undefined;
    }
    return value;
  }
  return wrapParts(map.imageParts, evaluateDefinition(ce, map, bareParts(map.argumentParts, contents)));
}

/** What a map answers when it has no compiled code: not a value, so it is never compared with the interpreter. */
const NO_COMPILED = Symbol("no compiled answer");

/**
 * The compiled route of a target as a function of its subject, or `undefined` when it has none. The function
 * answers `undefined` where the compiled code declines or has no answer: a map's interpreter is replaced by a
 * sentinel, so a map with no compiled code is not compared with itself. Nothing is cached across calls.
 */
export function compiledRoute(ce: Engine, target: SweepTarget): ((contents: unknown) => unknown) | undefined {
  if (target.kind === "statistic") return compiledStatistic(ce, target.definition);
  const { map } = target;
  if (map.composedOf !== undefined)
    return composedDefinition({ ce, steps: compositionSteps(MAPS, map), generated: COMPILED_MAPS[mapKey(map)] });
  const from = carrierOfType.get(map.from);
  const to = carrierOfType.get(map.to);
  const run = fastDefinition({
    ce,
    body: map.body,
    guard: map.guard,
    from: map.compiledFrom ?? from?.shape,
    to: to?.shape,
    cache: false,
    kernel: map.kernel,
    flat: map.flat,
    codecs: {
      ...(FLAT[map.from] === undefined ? {} : { encode: FLAT[map.from] }),
      ...(FLAT[map.to] === undefined ? {} : { decode: FLAT[map.to] }),
    },
    generated: COMPILED_MAPS[mapKey(map)],
    argumentParts: map.argumentParts,
    imageParts: map.imageParts,
    interpret: () => NO_COMPILED,
  });
  return (contents) => {
    const answer = run(contents);
    return answer === (NO_COMPILED as unknown) ? undefined : answer;
  };
}
