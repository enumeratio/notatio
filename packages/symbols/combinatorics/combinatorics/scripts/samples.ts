// Small elements of a carrier, for the generators to check compiled code against the
// interpreter: every family whose elements are values of the carrier, at small sizes, the
// first few ranks of each. Families overlap (the same small permutation is in dozens of them),
// so each distinct element appears once: the checks cost per element.

import type { Engine } from "@notatio/engine";
import { allKernels } from "../collections/src/families/index.ts";

const toJson = (element: unknown): unknown => (Array.isArray(element) ? ["List", ...element.map(toJson)] : element);

/** Carriers that a family over them overshoots: GrandDyckPaths holds every balanced step word, and
 *  SytTwoRow pads a one-row tableau with an empty second row. The family that defines the carrier,
 *  and the params an element implies. A sample outside it isn't in the domain of the carrier's
 *  definitions, so it isn't checked. */
const DEFINING: Record<string, { family: string; params: (element: never) => number[] }> = {
  DyckPath: { family: "DyckPaths", params: (e: number[]) => [e.length / 2] },
  StandardTableau: { family: "StandardTableaux", params: (e: number[][]) => [e.flat().length] },
};

/** Elements (as MathJSON contents) of the families over `carrier` (its constructor name):
 *  one-parameter families up to `maxSize`, two-parameter ones (n, k) at k ≤ n. */
export function smallElements(ce: Engine, carrier: string, maxSize = 5, perFamily = 8, declared = false): unknown[] {
  const seen = new Set<string>();
  return allElements(ce, carrier, maxSize, perFamily, declared).filter((sample) => {
    const key = JSON.stringify(sample);
    return !seen.has(key) && seen.add(key);
  });
}

/** `smallElements` before de-duplication. */
export function allElements(ce: Engine, carrier: string, maxSize = 5, perFamily = 8, declared = false): unknown[] {
  const out: unknown[] = [];
  const kernels = allKernels(ce);
  const defining = DEFINING[carrier];
  const definer = defining && kernels.find((f) => f.head === defining.family);
  // A carrier whose slots are other carriers' values (`carrierElements`) isn't sampled.
  const sampled = (f: (typeof kernels)[number]): boolean =>
    f.paramCount >= 1 && f.paramCount <= 2 && f.carrierElements === undefined;
  const direct = kernels.filter((f) => f.carrier === carrier && sampled(f));
  // With `declared`, a carrier no family names at the top (the skew partitions, the alternating sign matrices) is
  // sampled from the families that declare it: their elements are its contents.
  const chosen =
    direct.length > 0 || !declared
      ? direct
      : kernels.filter((f) => f.carrier === undefined && f.declared?.carrier === carrier && sampled(f));
  for (const family of chosen)
    for (let n = 0; n <= maxSize; n++)
      for (const params of family.paramCount === 1 ? [[n]] : Array.from({ length: n + 1 }, (_, k) => [n, k])) {
        const total = family.count(params);
        if (typeof total !== "bigint") continue;
        const last = total < BigInt(perFamily) ? total : BigInt(perFamily);
        // A carrier with params packs them first, `Tuple(...params, element)`, as its
        // constructor's contents (`carrierParams`, declare.ts).
        for (let r = 0n; r < last; r++) {
          const raw = family.unrank(params, r);
          if (definer && !definer.valid(raw, defining.params(raw as never))) continue;
          const element = toJson(raw);
          const packed = family.carrierParams ?? 0;
          out.push(packed === 0 ? element : ["Tuple", ...params.slice(0, packed), element]);
        }
      }
  return out;
}
