// The compile cross-check over definitions that have a `where`: each is checked on the subjects in its
// domain, and its verdict's source names the `where`, so changing it makes the row stale. A definition
// without one goes through `compiledDefinitionsFor` as it is, keeping its rows. Kept out of
// generate-compiled.ts: that file's text keys every statistics verdict (scripts/verdicts.ts).

import type { Engine } from "@notatio/engine";
import { evaluateEpsil } from "@notatio/structures";
import { type CompiledDefinition, compiledDefinitionsFor, type Verdicts } from "./generate-compiled.ts";
import { type Definition, isTrue, SUBJECT } from "./types.ts";

/** Whether `subject` (MathJSON) is in `definition`'s domain, by the interpreter: what the compiled code is held to. */
export function inDomain(ce: Engine, definition: Definition, subject: unknown): boolean {
  try {
    return isTrue(evaluateEpsil(ce, definition.where, { [SUBJECT]: subject }));
  } catch {
    return false;
  }
}

/** `verdicts` with `where` in every part and source it is given. */
export const withWhere = (verdicts: Verdicts, where: unknown): Verdicts => {
  const named = (value: unknown): unknown => ({ ...(value as object), where });
  return {
    sourceOnly: verdicts.sourceOnly,
    remember: (parts, source, compute, label, declined) =>
      verdicts.remember(named(parts), named(source), compute, label, declined),
    note: (source, label) => verdicts.note(named(source), label),
  };
};

/** `compiledDefinitionsFor`, with each definition checked on the subjects of its domain; one marked `interpreted` is left out. */
export function compiledDefinitionsInDomains(
  all: readonly Definition[],
  shape: string,
  subjectsOf: (ce: Engine, carrier: string) => readonly unknown[],
  verdicts: Verdicts,
  mine: (signature: string) => boolean,
): { compiled: CompiledDefinition[]; disagreed: string[] } {
  const definitions = all.filter((d) => d.interpreted === undefined);
  const whole = compiledDefinitionsFor(
    definitions.filter((d) => d.where === undefined),
    shape,
    subjectsOf,
    verdicts,
    mine,
  );
  const compiled = [...whole.compiled];
  const disagreed = [...whole.disagreed];
  for (const definition of definitions.filter((d) => d.where !== undefined)) {
    const part = compiledDefinitionsFor(
      [definition],
      shape,
      (ce, carrier) => subjectsOf(ce, carrier).filter((subject) => inDomain(ce, definition, subject)),
      withWhere(verdicts, definition.where),
      mine,
    );
    compiled.push(...part.compiled);
    disagreed.push(...part.disagreed);
  }
  return { compiled, disagreed: disagreed.toSorted() };
}
