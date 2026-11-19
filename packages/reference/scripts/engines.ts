// The engines the collectors and tests both need — and nothing else.
//
// This file exists because `collect-provenance.ts` writes a file at import time, and the
// provenance test used to import it just to reach `declaredEngine`. Every test run then
// rewrote the generated data and dirtied the tree. Side effects belong in the script that
// is meant to have them; shared setup belongs here.

import { ComputeEngine, type LatexSyntax } from "@cortex-js/compute-engine";
import type { PackageNotation } from "@notatio/boxes";
import { buildEngine, declarePlan, enginePlan, type Library, loadLibraries, NOTATIONS } from "@notatio/manifest";
import { installPurityDefault } from "@notatio/engine";
import { EXTRAS } from "./extras.ts";
import { importer, LIBRARY_NAMES } from "./importer.ts";

/** Every library this package depends on, with `@notatio/evaluation`: what the engines are built from. */
export const AVAILABLE = await loadLibraries<ComputeEngine>(LIBRARY_NAMES, importer);
const NAMES = AVAILABLE.map((library) => library.name);

// Note: GlyphKind (frontend's own carrier) is deliberately NOT declared in this engine --
// wiring it in would make @notatio/reference depend on @notatio/frontend, which already
// devDeps reference for its own tests, a real build cycle. GlyphKind's reference entry states its
// `library` directly (read, not derived from this engine -- see `declaredLibrary` in
// provenance.ts), so this only affects its `provenance` classification, and it is a stub with
// no examples either way.

/** The engine's plan: every library this package depends on, the base, and what each requires. */
export const PLAN = enginePlan({ libraries: NAMES, available: AVAILABLE, include: EXTRAS });

/**
 * The same libraries by package, for the resolver (`@notatio/manifest`'s `createResolver`).
 * Without `@notatio/evaluation`: every host runs it first, so the resolver never declares it.
 */
export const LIBRARIES: readonly Library<ComputeEngine>[] = AVAILABLE.filter(
  (library) => library.name !== "evaluation",
);

/** Every package's notation entry, as the manifest lists them. Imported from here because this
 *  package depends on every library, so each specifier resolves. */
export const packageNotations = (): Promise<PackageNotation[]> =>
  Promise.all(
    Object.values(NOTATIONS).map(
      async (specifier) => ((await import(specifier)) as { notation: PackageNotation }).notation,
    ),
  );

/**
 * The engine with every library declared. Without `graphics`, it is the one whose definitions
 * decide what the oracle takes for a free symbol (`collect-defined-names.ts`): the oracle sends
 * the heads formats holds inert as written, Wolfram's own (`Plot`) by name and the rest
 * (`Chart`, `Knob`, `CollectionTable`) as free functions. Counting them defined would leave the
 * latter unmapped, and a scan would drop the answers recorded for them. With `latexSyntax`, it
 * reads and writes LaTeX with that syntax (the page engine's), not compute-engine's own.
 */
export const declaredEngine = ({
  graphics = true,
  latexSyntax,
}: { readonly graphics?: boolean; readonly latexSyntax?: LatexSyntax } = {}): ComputeEngine =>
  buildEngine({
    libraries: NAMES,
    available: AVAILABLE,
    include: graphics ? EXTRAS : EXTRAS.filter((extra) => extra.name !== "graphics"),
    engine: () => {
      const ce = new ComputeEngine(latexSyntax === undefined ? {} : { latexSyntax });
      installPurityDefault(ce);
      return ce;
    },
  }).engine;

/**
 * `configure(ce)` for `@notatio/evaluation/node`'s isolated evaluator (`evaluateIsolated`,
 * `openSession`, `runCases`'s `setup` option): declares every library the reference engine
 * declares, so a case evaluated in a worker means the same thing it would in-process. Not
 * `declaredEngine`'s plan verbatim -- the worker's own engine already declares
 * `@notatio/evaluation` before running `setup` (see `worker.ts`/`session-worker.ts`), and
 * redeclaring throws: "already declared in this scope".
 */
export function configure(ce: ComputeEngine): void {
  declarePlan(ce, PLAN, ["evaluation"]);
}
