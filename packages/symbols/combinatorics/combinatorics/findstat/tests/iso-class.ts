import { bareEngine } from "@notatio/engine/testing";
import { CARRIERS, declareCombinatorics, declareMaps } from "../../src/index.ts";

// FindStat lists a graph up to isomorphism under one arbitrary labeling, so a graph-valued image is compared after
// both sides go through CanonicalGraph; every other carrier's value is its own class.

let engine: ReturnType<typeof bareEngine> | undefined;
const canonical = (): ReturnType<typeof bareEngine> => {
  if (engine === undefined) {
    engine = bareEngine();
    declareCombinatorics(engine);
    declareMaps(engine, Object.fromEntries(CARRIERS.map((carrier) => [carrier.type, carrier.name])));
  }
  return engine;
};

/** The comparable form of a carrier value: a LabeledGraph's canonical graph, anything else as it is. */
export const isoClass = (carrier: string, value: unknown): unknown => {
  if (carrier !== "LabeledGraph" || !Array.isArray(value)) return value;
  return canonical()
    .box(["CanonicalGraph", value] as never)
    .evaluate().json;
};
