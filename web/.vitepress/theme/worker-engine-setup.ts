// `configure(ce)` for an `Evaluator -> "Worker"` `<dynamic-module-box>`'s
// `@notatio/evaluation/browser` session (`dynamic-module-box.ts`'s
// `evaluateRemote`): declares the same libraries `./index.mts`'s `startEngine`
// declares into the PAGE's own engine, minus `@notatio/evaluation` itself -- the
// session's engine already has it (`browser-session-worker.ts` calls
// `declareEvaluation` before importing `setup`, same as `packages/reference/scripts/
// engines.ts`'s own `configure` does for the Node isolated evaluator). The declare
// ORDER and OPTIONS themselves live in `./engine-libraries.ts`, shared with
// `./index.mts`, so the two library sets can't drift apart.
//
// Unlike `./index.mts`, this declares synchronously and eagerly, with static
// (not dynamic) imports: `openSession`'s `setup` contract calls `mod.configure(ce)`
// without awaiting it (`browser-session-worker.ts`), so an async `configure` would
// let the worker start evaluating before its heads exist. This module is its own
// on-demand chunk regardless -- a worker only imports it once, when a page's first
// `Evaluator -> "Worker"` module opens its session -- so there is no bundle-splitting
// reason to defer these imports the way `./index.mts` defers its own.
//
// No LaTeX dictionary here: a session evaluates MathJSON to MathJSON (a cell already
// parsed its input against the PAGE's own engine before sending it over -- see
// `notatio-out.ts`'s worker branch), so the worker's engine is never asked to parse
// LaTeX and needs no notation configured, only the heads themselves.

import type { ComputeEngine } from "@cortex-js/compute-engine";
import { declareAdeles } from "@notatio/adeles";
import { declareAnalytic, declareFractals } from "@notatio/analytic";
import { declareBraid } from "@notatio/braid";
import { CARRIERS, declareCombinatorics, declareMaps } from "@notatio/combinatorics";
import { declareDiagrams } from "@notatio/diagram";
import { declareFrontendCarriers } from "@notatio/frontend/declare-carriers";
import { declareGraphics } from "@notatio/formats";
import { declareBoxes } from "@notatio/boxes";
import { declareCarrierElement, declareCarrierPlurals, declareStructures } from "@notatio/structures";
import { declareGeometric } from "@notatio/geometric";
import { declareGroupAlgebra } from "@notatio/groupalgebra";
import { declareHecke } from "@notatio/hecke";
import { declareHopf } from "@notatio/hopf";
import { declareHypercomplex } from "@notatio/hypercomplex";
import { declareIncidence } from "@notatio/incidence";
import { declareModular } from "@notatio/modular";
import { declareNumberTheory } from "@notatio/number-theory";
import { declareNumerals } from "@notatio/numerals";
import { declareQuiver } from "@notatio/quiver";
import {
  declareDistributions,
  declareDistributions2,
  declareDistributions3,
  declareDistributions4,
  declareDistributions5,
  declareDistributions6,
  declareProcesses,
} from "@notatio/statistics";
import { declareResidues } from "@notatio/residues";
import { applyEngineLibraries } from "./engine-libraries.ts";

export function configure(ce: ComputeEngine): void {
  applyEngineLibraries((fn) => fn(ce), {
    declareCombinatorics,
    declareCarrierPlurals,
    declareCarrierElement,
    declareFrontendCarriers,
    declareMaps,
    CARRIERS,
    declareAnalytic,
    declareFractals,
    declareGraphics,
    declareBoxes,
    declareStructures,
    declareHypercomplex,
    declareGeometric,
    declareDiagrams,
    declareResidues,
    declareNumerals,
    declareHecke,
    declareIncidence,
    declareQuiver,
    declareHopf,
    declareGroupAlgebra,
    declareModular,
    declareNumberTheory,
    declareAdeles,
    declareBraid,
  });
  declareDistributions(ce);
  declareDistributions2(ce);
  declareDistributions3(ce);
  declareDistributions4(ce);
  declareDistributions5(ce);
  declareDistributions6(ce);
  declareProcesses(ce);
}
