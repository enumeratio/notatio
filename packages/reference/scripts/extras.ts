// The host-supplied libraries, apart from `engines.ts` so a lazy engine can bring them without
// importing every library.
//
// `Restricted` and `Compose` are structures' over combinatorics' maps, so they follow combinatorics
// (as in census's engine), and their examples run here. `formats` is a presentation library, so
// not in the plan by default; its graphics heads (`Plot`, `Slider`, … held inert, and the
// `Histogram` widening of compute-engine's head) join alone, last, as in every host. Lowering a
// drawn value to boxes needs `@notatio/frontend`, which sits above this package: its
// `tests/example-boxes.test.ts` does that for the examples that carry a `boxes` shape.

import type { ComputeEngine } from "@cortex-js/compute-engine";
import { type StagedLibrary } from "@notatio/manifest";
import { declareCatalog, ENUMERATIO } from "@notatio/catalog";
import { declareGraphics } from "@notatio/formats";
import { declareCompose, declareRestricted } from "@notatio/structures";

const late = (
  name: string,
  declare: (ce: ComputeEngine) => void,
  requires: string[],
): StagedLibrary<ComputeEngine> => ({
  name,
  declare,
  late: declare,
  requires,
});

/** The host-supplied libraries: declared into an engine whatever resolves, once what they need is there. */
export const EXTRAS = [
  late("restricted", declareRestricted, ["combinatorics"]),
  late("compose", declareCompose, ["restricted"]),
  late("graphics", declareGraphics, []),
  // The catalog resolves what the engine declared before it (`Resource("Subsets", 3)` is `Subsets(3)`).
  late("catalog", (ce) => void declareCatalog(ce, { bless: [ENUMERATIO] }), ["compose"]),
];
