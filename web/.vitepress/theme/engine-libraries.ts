// The declare ORDER and OPTIONS shared by two engines that must mean the same thing:
// `./index.mts`'s page engine (`@notatio/frontend`'s `configureEngine`, dynamic
// imports for bundle-splitting) and `./worker-engine-setup.ts`'s
// `@notatio/evaluation/browser` session engine (a plain `ComputeEngine`, static
// imports since `openSession`'s `configure(ce)` runs synchronously). Each side does its
// own importing -- this only owns the sequence and the options each `declare*` call
// takes, so the two library sets can't quietly drift apart the way they had (the
// session was missing nothing, but a future addition to one list and not the other
// would have gone unnoticed the same way `Notebook`'s own signature bug did).
//
// `apply` is the seam: `./index.mts` passes `configureEngine` itself (register-or-apply,
// since the page's engine may not exist yet), `./worker-engine-setup.ts` passes a plain
// `(fn) => fn(ce)` (the session's engine already exists by the time `configure` runs).

import type { ComputeEngine } from "@cortex-js/compute-engine";

// Each library's own `typeof`, not a hand-copied signature: a `declare*` whose real
// type doesn't match what this module expects fails to typecheck at the `apply(...)`
// call sites below, rather than silently accepting a wrong signature the way a loose
// `(ce: ComputeEngine) => void` would.
export interface EngineLibraries {
  readonly declareCombinatorics: typeof import("@notatio/combinatorics").declareCombinatorics;
  readonly declareCarrierPlurals: typeof import("@notatio/structures").declareCarrierPlurals;
  readonly declareCarrierElement: typeof import("@notatio/structures").declareCarrierElement;
  readonly declareMaps: typeof import("@notatio/combinatorics").declareMaps;
  readonly CARRIERS: typeof import("@notatio/combinatorics").CARRIERS;
  readonly declareAnalytic: typeof import("@notatio/analytic").declareAnalytic;
  readonly declareFractals: typeof import("@notatio/analytic").declareFractals;
  readonly declareGraphics: typeof import("@notatio/formats").declareGraphics;
  readonly declareBoxes: typeof import("@notatio/boxes").declareBoxes;
  readonly declareStructures: typeof import("@notatio/structures").declareStructures;
  readonly declareHypercomplex: typeof import("@notatio/hypercomplex").declareHypercomplex;
  readonly declareGeometric: typeof import("@notatio/geometric").declareGeometric;
  readonly declareDiagrams: typeof import("@notatio/diagram").declareDiagrams;
  readonly declareResidues: typeof import("@notatio/residues").declareResidues;
  readonly declareNumerals: typeof import("@notatio/numerals").declareNumerals;
  readonly declareHecke: typeof import("@notatio/hecke").declareHecke;
  readonly declareIncidence: typeof import("@notatio/incidence").declareIncidence;
  readonly declareQuiver: typeof import("@notatio/quiver").declareQuiver;
  readonly declareHopf: typeof import("@notatio/hopf").declareHopf;
  readonly declareGroupAlgebra: typeof import("@notatio/groupalgebra").declareGroupAlgebra;
  readonly declareModular: typeof import("@notatio/modular").declareModular;
  readonly declareNumberTheory: typeof import("@notatio/number-theory").declareNumberTheory;
  readonly declareAdeles: typeof import("@notatio/adeles").declareAdeles;
  readonly declareBraid: typeof import("@notatio/braid").declareBraid;
  readonly declareFrontendCarriers: typeof import("@notatio/frontend/declare-carriers").declareFrontendCarriers;
}

/**
 * Declares every library the page ships, in dependency order, via `apply` -- either
 * `configureEngine` (deferred until the engine exists) or a direct `(fn) => fn(ce)`.
 * Does NOT include `@notatio/evaluation` itself or the LaTeX dictionary
 * (the packages' notation, `configureLatex`): the page engine needs both, but a session's
 * engine already has evaluation declared before `configure` runs (see
 * `browser-session-worker.ts`) and never parses LaTeX at all (see
 * `worker-engine-setup.ts`'s own comment) -- both callers handle those two on their own.
 */
export function applyEngineLibraries(apply: (fn: (ce: ComputeEngine) => void) => void, libs: EngineLibraries): void {
  // Carriers, then the families typed by them -- one call (https://github.com/enumeratio/notatio/wiki/Speculative-Combinatorics-Layering-and-Plausible §4 step 3). Everything below declares heads OVER these minted
  // types, so they have to exist before a signature can name one.
  apply(libs.declareCombinatorics);
  // Every carrier's plural type-space name, and Element membership over it -- AFTER
  // collections, so a plural a collection family already claims (Permutations, DyckPaths,
  // ...) is still free when this checks, not raced by minting a bare symbol first.
  apply((ce) => libs.declareCarrierPlurals(ce, libs.CARRIERS));
  apply((ce) => libs.declareCarrierElement(ce, libs.CARRIERS));
  // GlyphKind: type, constructor, plural type-space name and `Element` membership, all in
  // one call (`declareCarriers`' default plural folding).
  apply(libs.declareFrontendCarriers);
  // The combinatorial statistics are declared inside `declareCombinatorics` itself now (step
  // 6b): each area declares its own, after its own carriers and families, typed uniformly —
  // no `domainTypes` map for the host to build any more.
  const constructorFor = Object.fromEntries(libs.CARRIERS.map((c) => [c.type, c.name]));
  apply((ce) => libs.declareMaps(ce, constructorFor));
  apply(libs.declareAnalytic);
  apply(libs.declareFractals);
  // After collections and analytic: their Floor/Min widenings would narrow the generic ones.
  apply(libs.declareStructures);
  apply(libs.declareGraphics);
  apply(libs.declareBoxes);
  apply(libs.declareHypercomplex);
  // The geometric-algebra layer sits ON hypercomplex: its heads read the generators
  // and the ordered product that library declares, so it has to come after.
  apply(libs.declareGeometric);
  apply(libs.declareDiagrams);
  apply(libs.declareResidues);
  apply(libs.declareNumerals);
  apply(libs.declareHecke);
  apply(libs.declareIncidence);
  apply(libs.declareQuiver);
  apply(libs.declareHopf);
  apply(libs.declareGroupAlgebra);
  apply(libs.declareModular);
  apply(libs.declareNumberTheory);
  apply(libs.declareAdeles);
  apply(libs.declareBraid);
}
