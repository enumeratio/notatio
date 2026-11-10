// Every combinatorics map, declared typed by carrier (step 6c: each map's data now lives in the
// area owning its `from` carrier — see `map-helpers.ts` for the shared pieces and each area's
// own `src/maps.ts` for its data). This file is the thin composition point: it concatenates
// every area's own map array into `MAPS`, merges in each map's laws (step 6c part 2 — see
// below), and keeps `declareMaps`'s call site exactly where it was.
//
// `declareMaps` stays OUT of `declareCombinatorics`/each area's own `declare<Area>` on purpose:
// it extends shared names (`Inverse`, `Reverse`) other packages also widen, rather than minting
// fresh ones, so it has to run LAST — after every package's own declares, not just
// combinatorics'. Folding it into `declare<Area>` would run it at `declareCombinatorics`'s own
// position instead, ahead of another package's own `Inverse` overload (see `src/index.ts`'s file
// comment, and enumeratio#411). Every host (cli, census, reference's engines.ts) still calls
// this one function, at its own unchanged position, with its own `constructorFor`.

import type { Engine } from "@enumeratio/engine";
import { symbolInfo } from "@enumeratio/manifest";
import { declareMaps as declareMapsGeneric, evaluateDefinition, type Law } from "@enumeratio/structures";
import { CARRIERS } from "./carriers.ts";
import { COMPILED_MAPS } from "./compiled-maps.generated.js";
import { FLAT } from "./flat.ts";
import { composedDefinition, compositionSteps, fastDefinition, mapKey } from "./compiled.ts";
import type { CombinatorialMap } from "./map-helpers.ts";
import { MAP_LAWS } from "./maps-laws.generated.ts";
import { COMPOSITIONS_MAPS } from "../compositions/src/maps.ts";
import { DYCK_CONVERSION_MAPS } from "../lattice-paths/src/dyck-conversion-maps.ts";
import { DYCK_MAPS } from "../lattice-paths/src/dyck-maps.ts";
import { LATTICE_PATHS_MAPS } from "../lattice-paths/src/maps.ts";
import { GRAPHS_MAPS } from "../graphs/src/maps.ts";
import { PARTITIONS_MAPS } from "../partitions/src/maps.ts";
import { declareCycleConversions } from "../permutations/src/cycles-conversion.ts";
import { PERMUTATIONS_MAPS } from "../permutations/src/maps.ts";
import { SIGNED_PERMUTATIONS_ALGORITHM_MAPS } from "../permutations/src/signed-algorithms.ts";
import { SIGNED_PERMUTATIONS_MAPS } from "../permutations/src/signed-maps.ts";
import { SET_PARTITION_INVOLUTION_MAPS } from "../set-partitions/src/involution-maps.ts";
import { PERFECT_MATCHING_MAPS } from "../set-partitions/src/matching-maps.ts";
import { SET_PARTITIONS_MAPS } from "../set-partitions/src/maps.ts";
import { TABLEAUX_MAPS } from "../tableaux/src/maps.ts";
import { TREES_MAPS } from "../trees/src/maps.ts";
import { WORDS_MAPS } from "../words/src/maps.ts";
import { ALTERNATING_SIGN_MAPS } from "../tableaux/src/alternating-sign-maps.ts";
import { DYCK_ALTERNATING_SIGN_MAPS } from "../lattice-paths/src/alternating-sign-conversion-maps.ts";
import { GELFAND_TSETLIN_MAPS } from "../tableaux/src/gelfand-tsetlin-maps.ts";
import { SEMISTANDARD_MAPS } from "../tableaux/src/semistandard-maps.ts";
import { PARKING_TABLEAU_MAPS } from "../words/src/parking-tableau-maps.ts";
import { MATCHING_CONVERSION_MAPS } from "../set-partitions/src/matching-conversion-maps.ts";
import { TUNNEL_MATCHING_MAPS } from "../lattice-paths/src/tunnel-matching-maps.ts";
import { BINARY_TREE_CONVERSION_MAPS } from "../trees/src/binary-tree-conversion-maps.ts";
import { STRAHLER_MAPS } from "../trees/src/strahler-maps.ts";
import { INCREASING_TREE_MAPS } from "../permutations/src/increasing-tree-maps.ts";
import { FRANCON_MAPS } from "../lattice-paths/src/francon-maps.ts";
import { POLYOMINO_MAPS } from "../lattice-paths/src/polyomino-maps.ts";
import { PERMUTATION_BATCH_TEN_MAPS } from "../permutations/src/tenth-batch-maps.ts";
import { PLANE_PARTITION_MAPS } from "../tableaux/src/plane-partition-maps.ts";
import { CLIQUE_MAPS } from "../graphs/src/clique-maps.ts";
import { HORIZONTAL_STRIP_MAPS } from "../tableaux/src/horizontal-strip-maps.ts";

export type { CombinatorialMap } from "./map-helpers.ts";
export type { Law };
export { evaluateDefinition };

// A map's `laws`/`orderIsomorphism` come from its own record's `laws:` front matter (step 6c
// part 2, design §6), generated ahead of time into `maps-laws.generated.ts` by
// `scripts/generate-map-laws.ts` -- no YAML parsing at runtime. An area's own literal only
// still carries `laws` inline for a map with no record to hold it (`Permutation`, see
// `permutations/src/maps.ts`), which this merge leaves alone since `MAP_LAWS` has no entry for it.
const withLaws = (map: CombinatorialMap): CombinatorialMap => ({ ...map, ...MAP_LAWS[`${map.name}@${map.from}`] });

export const MAPS: readonly CombinatorialMap[] = [
  ...PERMUTATIONS_MAPS,
  ...SIGNED_PERMUTATIONS_MAPS,
  ...TREES_MAPS,
  ...LATTICE_PATHS_MAPS,
  ...DYCK_MAPS,
  ...DYCK_CONVERSION_MAPS,
  ...PARTITIONS_MAPS,
  ...SET_PARTITIONS_MAPS,
  ...SET_PARTITION_INVOLUTION_MAPS,
  ...PERFECT_MATCHING_MAPS,
  ...TABLEAUX_MAPS,
  ...COMPOSITIONS_MAPS,
  ...WORDS_MAPS,
  ...GRAPHS_MAPS,
  ...ALTERNATING_SIGN_MAPS,
  ...DYCK_ALTERNATING_SIGN_MAPS,
  ...GELFAND_TSETLIN_MAPS,
  ...SEMISTANDARD_MAPS,
  ...PARKING_TABLEAU_MAPS,
  ...MATCHING_CONVERSION_MAPS,
  ...TUNNEL_MATCHING_MAPS,
  ...BINARY_TREE_CONVERSION_MAPS,
  ...STRAHLER_MAPS,
  ...INCREASING_TREE_MAPS,
  ...FRANCON_MAPS,
  ...POLYOMINO_MAPS,
  ...PERMUTATION_BATCH_TEN_MAPS,
  ...PLANE_PARTITION_MAPS,
  ...CLIQUE_MAPS,
  ...HORIZONTAL_STRIP_MAPS,
  // After the words: Rowmotion's primary carrier is BinaryWord.
  ...SIGNED_PERMUTATIONS_ALGORITHM_MAPS,
].map(withLaws);

/** Declare every combinatorics map, typed by carrier, via @enumeratio/structures' generic
 *  `declareMaps`: combinatorics supplies the fast (compiled) definition and the FindStat ids,
 *  which are the two things a generic map declaration knows nothing about. */
export function declareMaps(
  ce: Engine,
  constructorFor: Readonly<Record<string, string>>,
  maps: readonly CombinatorialMap[] = MAPS,
): void {
  const shapeOf = new Map(CARRIERS.map((carrier) => [carrier.type, carrier.shape]));
  declareMapsGeneric(ce, constructorFor, maps, {
    package: "combinatorics",
    // Compiled where compute-engine's compiler takes it, memoized; the interpreter otherwise.
    definitionFor: (map) => {
      // A composition runs as one chain where every step has compiled code, else through its steps.
      if (map.composedOf !== undefined)
        return composedDefinition({ ce, steps: compositionSteps(maps, map), generated: COMPILED_MAPS[mapKey(map)] });
      if (map.body === undefined) return undefined;
      return fastDefinition({
        ce,
        body: map.body,
        guard: map.guard,
        from: map.compiledFrom ?? shapeOf.get(map.from),
        to: shapeOf.get(map.to),
        interpret: (contents) => evaluateDefinition(ce, map, contents),
        generated: COMPILED_MAPS[mapKey(map)],
        kernel: map.kernel,
        flat: map.flat,
        codecs: {
          ...(FLAT[map.from] === undefined ? {} : { encode: FLAT[map.from] }),
          ...(FLAT[map.to] === undefined ? {} : { decode: FLAT[map.to] }),
        },
        argumentParts: map.argumentParts,
        imageParts: map.imageParts,
      });
    },
    // FindStat's map ids (`Mp00066`), as the map's record states them.
    findstatFor: (map, from) => [
      ...(map.findstat ?? []),
      ...(map.convert === true ? [] : (symbolInfo(map.name)?.findstat ?? []))
        .filter((ref) => ref.on === undefined || ref.on === from)
        .map((ref) => ref.id),
    ],
  });
  // Overloads across the carrier boundary, which need both heads declared: after the maps.
  declareCycleConversions(ce);
}
