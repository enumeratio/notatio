import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { ALL_STATISTICS, declareCombinatorics } from "../src/index.ts";

// One small object per carrier.
const SAMPLE: Record<string, unknown> = {
  Permutation: ["At", ["Permutations", 4], 7],
  IntegerPartition: ["At", ["IntegerPartitions", 5], 3],
  DyckPath: ["At", ["DyckPaths", 4], 5],
  SetPartition: ["At", ["SetPartitions", 4], 6],
  BinaryTree: ["At", ["BinaryTrees", 4], 5],
  OrderedTree: ["At", ["OrderedTrees", 3], 4],
  IntegerComposition: ["At", ["IntegerCompositions", 4], 5],
  StandardTableau: ["At", ["StandardTableaux", 5], 7],
  BinaryWord: ["At", ["BinaryWords", 4], 5],
  PerfectMatching: ["At", ["PerfectMatchings", 3], 7],
  SignedPermutation: ["At", ["SignedPermutations", 3], 9],
  ParkingFunction: ["At", ["ParkingFunctions", 4], 20],
  // These families yield bare rows.
  AlternatingSignMatrix: ["AlternatingSignMatrix", ["At", ["AlternatingSignMatrices", 3], 4]],
  PlanePartition: ["PlanePartition", ["At", ["PlanePartitions", 6], 10]],
  // The family yields bare [outer, inner].
  SkewPartition: ["SkewPartition", ["At", ["SkewPartitions", 4], 7]],
  // And the bare rows of a tableau and of a pattern.
  SemistandardTableau: ["SemistandardTableau", ["At", ["SemistandardTableaux", 5, 3], 20]],
  GelfandTsetlinPattern: ["GelfandTsetlinPattern", ["At", ["GelfandTsetlin", 4, 2], 30]],
  LabeledGraph: ["At", ["LabeledGraphs", 4], 37],
  // The poset with 1 < 3, 1 < 4 and 2 < 4.
  Poset: ["Poset", ["List", ["List"], ["List"], ["List", 1], ["List", 1, 2]]],
  CartanType: ["At", ["FiniteCartanTypes", 4], 5],
};

// A statistic with a `where` is called on a subject in its domain.
const DOMAIN_SAMPLE: Record<string, unknown> = {
  // The pentagon lattice.
  Poset: ["Poset", ["List", ["List"], ["List", 1], ["List", 1], ["List", 3], ["List", 2, 4]]],
};

test("every statistic is callable by its bare head on each of its carriers", () => {
  const ce = bareEngine();
  declareCombinatorics(ce);
  const failures: string[] = [];
  for (const { head, on, where } of ALL_STATISTICS) {
    const sample = (where === undefined ? undefined : DOMAIN_SAMPLE[on]) ?? SAMPLE[on];
    if (sample === undefined) {
      failures.push(`${head}@${on}: no sample`);
      continue;
    }
    const subject = ce.box(sample as never).evaluate();
    const bare = ce.box([head, subject.json] as never).evaluate();
    const viaStat = ce.box(["CombinatorialStat", subject.json, `'${head}'`] as never).evaluate();
    if (bare.operator === "Error" || JSON.stringify(bare.json) !== JSON.stringify(viaStat.json))
      failures.push(`${head}@${on}: ${JSON.stringify(bare.json)} vs ${JSON.stringify(viaStat.json)}`);
  }
  expect(failures).toEqual([]);
});
