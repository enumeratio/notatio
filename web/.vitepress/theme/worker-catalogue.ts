// The host's library catalogue for its session kernels
// (https://github.com/enumeratio/notatio/wiki/Speculative-Kernels-and-Front-Ends): each
// library the site ships, and how to declare it, which a kernel reads to declare only what a
// call needs. Imports are dynamic, so a worker loads a library's chunk when a call first
// needs it.
//
// The resolver learns what each library declares from its `declares.json`, which the library's
// build writes, and what each needs declared first from the manifest's HIERARCHY. The `global`
// ones are declared with the first call that declares anything.

import type { ComputeEngine } from "@cortex-js/compute-engine";
import type { Library, LibraryDeclares } from "@notatio/manifest";
import structuresDeclares from "@notatio/structures/declares.json" with { type: "json" };
import combinatoricsDeclares from "@notatio/combinatorics/declares.json" with { type: "json" };
import frontendDeclares from "@notatio/frontend/declares.json" with { type: "json" };
import analyticDeclares from "@notatio/analytic/declares.json" with { type: "json" };
import formatsDeclares from "@notatio/formats/declares.json" with { type: "json" };
import boxesDeclares from "@notatio/boxes/declares.json" with { type: "json" };
import hypercomplexDeclares from "@notatio/hypercomplex/declares.json" with { type: "json" };
import geometricDeclares from "@notatio/geometric/declares.json" with { type: "json" };
import diagramDeclares from "@notatio/diagram/declares.json" with { type: "json" };
import residuesDeclares from "@notatio/residues/declares.json" with { type: "json" };
import numeralsDeclares from "@notatio/numerals/declares.json" with { type: "json" };
import heckeDeclares from "@notatio/hecke/declares.json" with { type: "json" };
import incidenceDeclares from "@notatio/incidence/declares.json" with { type: "json" };
import quiverDeclares from "@notatio/quiver/declares.json" with { type: "json" };
import hopfDeclares from "@notatio/hopf/declares.json" with { type: "json" };
import groupalgebraDeclares from "@notatio/groupalgebra/declares.json" with { type: "json" };
import modularDeclares from "@notatio/modular/declares.json" with { type: "json" };
import numberTheoryDeclares from "@notatio/number-theory/declares.json" with { type: "json" };
import adelesDeclares from "@notatio/adeles/declares.json" with { type: "json" };
import braidDeclares from "@notatio/braid/declares.json" with { type: "json" };
import statisticsDeclares from "@notatio/statistics/declares.json" with { type: "json" };

const combinatorics = async (ce: ComputeEngine): Promise<void> => {
  const { CARRIERS, declareCombinatorics, declareMaps } = await import("@notatio/combinatorics");
  const { declareCarrierElement, declareCarrierPlurals } = await import("@notatio/structures");
  declareCombinatorics(ce);
  declareCarrierPlurals(ce, CARRIERS);
  declareCarrierElement(ce, CARRIERS);
  declareMaps(ce, Object.fromEntries(CARRIERS.map((c) => [c.type, c.name])));
};

// Structures first: the protocols every other library builds on.
export const CATALOGUE: readonly Library<ComputeEngine>[] = [
  {
    name: "structures",
    declares: structuresDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/structures")).declareStructures(ce),
  },
  // As reference's LIBRARIES: `CombinatorialStat`'s table is a registry declaring can't see.
  {
    name: "combinatorics",
    declares: combinatoricsDeclares as LibraryDeclares,
    names: ["CombinatorialStat", "Tally"],
    declare: combinatorics,
  },
  // The frontend's carriers: as a library it extends structures, not the analytic its plots import.
  {
    name: "frontend",
    declares: frontendDeclares as LibraryDeclares,
    global: true,
    declare: async (ce) => (await import("@notatio/frontend/declare-carriers")).declareFrontendCarriers(ce),
  },
  {
    name: "analytic",
    declares: analyticDeclares as LibraryDeclares,
    declare: async (ce) => {
      const { declareAnalytic, declareFractals } = await import("@notatio/analytic");
      declareAnalytic(ce);
      declareFractals(ce);
    },
  },
  {
    name: "formats",
    declares: formatsDeclares as LibraryDeclares,
    global: true,
    declare: async (ce) => (await import("@notatio/formats")).declareGraphics(ce),
  },
  {
    name: "boxes",
    declares: boxesDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/boxes")).declareBoxes(ce),
  },
  {
    name: "hypercomplex",
    declares: hypercomplexDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/hypercomplex")).declareHypercomplex(ce),
  },
  {
    name: "geometric",
    declares: geometricDeclares as LibraryDeclares,
    global: true,
    declare: async (ce) => (await import("@notatio/geometric")).declareGeometric(ce),
  },
  {
    name: "diagram",
    declares: diagramDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/diagram")).declareDiagrams(ce),
  },
  {
    name: "residues",
    declares: residuesDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/residues")).declareResidues(ce),
  },
  {
    name: "numerals",
    declares: numeralsDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/numerals")).declareNumerals(ce),
  },
  {
    name: "hecke",
    declares: heckeDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/hecke")).declareHecke(ce),
  },
  {
    name: "incidence",
    declares: incidenceDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/incidence")).declareIncidence(ce),
  },
  {
    name: "quiver",
    declares: quiverDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/quiver")).declareQuiver(ce),
  },
  {
    name: "hopf",
    declares: hopfDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/hopf")).declareHopf(ce),
  },
  {
    name: "groupalgebra",
    declares: groupalgebraDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/groupalgebra")).declareGroupAlgebra(ce),
  },
  {
    name: "modular",
    declares: modularDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/modular")).declareModular(ce),
  },
  {
    name: "number-theory",
    declares: numberTheoryDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/number-theory")).declareNumberTheory(ce),
  },
  {
    name: "adeles",
    declares: adelesDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/adeles")).declareAdeles(ce),
  },
  {
    name: "braid",
    declares: braidDeclares as LibraryDeclares,
    declare: async (ce) => (await import("@notatio/braid")).declareBraid(ce),
  },
  {
    name: "statistics",
    declares: statisticsDeclares as LibraryDeclares,
    declare: async (ce) => {
      const stats = await import("@notatio/statistics");
      stats.declareDistributions(ce);
      stats.declareDistributions2(ce);
      stats.declareDistributions3(ce);
      stats.declareDistributions4(ce);
      stats.declareDistributions5(ce);
      stats.declareDistributions6(ce);
      stats.declareProcesses(ce);
    },
  },
];
