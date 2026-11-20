// What vouches for the canonical form past the sizes the definition runs: properties that pin a canonical form down,
// on a fixed seeded sample of posets of 6 through 10 elements, each checked separately.
//   - the image is isomorphic to the input (an explicit bijection, found by a search written here);
//   - relabeling the input leaves the image unchanged;
//   - the map is idempotent;
//   - two posets with the same size, relations, height and width have equal images exactly when they are isomorphic,
//     and `IsIsomorphicPoset` says the same. A form that merged two such classes passes the first three.
// The sample: for each size, seeded random posets at several densities, plus the hard cases (antichain, chain, wide
// antichains with a few relations, disjoint chains, complete bipartite, many automorphisms).
import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { CARRIERS, declareCombinatorics, declareMaps } from "../../src/index.ts";
import { canonicalPoset } from "../src/canonical.ts";
import { type Poset } from "./poset-findstat-readings.ts";
import { groupsOf, isomorphic, randomPoset, relabeled, same, sample, stream } from "./poset-samples.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const SIZES = [6, 7, 8, 9, 10];
const PER_SIZE = DEEP ? 40 : 8;

const ce = bareEngine();
declareCombinatorics(ce);
declareMaps(ce, Object.fromEntries(CARRIERS.map((c) => [c.type, c.name])));

for (const n of SIZES) {
  const posets = sample(n, PER_SIZE);

  test(`${n} elements: the image is isomorphic to the input`, () => {
    for (const p of posets) expect(isomorphic(p, canonicalPoset(p)), JSON.stringify(p)).toBe(true);
  });

  test(`${n} elements: relabeling the input leaves the image unchanged`, () => {
    const next = stream(2000 + n);
    for (const p of posets) {
      const image = canonicalPoset(p);
      for (let k = 0; k < 3; k++) expect(canonicalPoset(relabeled(p, next)), JSON.stringify(p)).toEqual(image);
    }
  });

  test(`${n} elements: the map is idempotent`, () => {
    for (const p of posets) {
      const image = canonicalPoset(p);
      expect(canonicalPoset(image), JSON.stringify(p)).toEqual(image);
    }
  });

  test(`${n} elements: posets with equal invariants have equal images exactly when isomorphic`, () => {
    const next = stream(3000 + n);
    const extra = Array.from({ length: DEEP ? 400 : 120 }, () => randomPoset(n, 0.15 + next() * 0.3, next));
    let different = 0;
    for (const group of groupsOf([...posets, ...extra]))
      for (let i = 0; i < group.length; i++)
        for (let j = i + 1; j < group.length; j++) {
          const truth = isomorphic(group[i]!, group[j]!);
          const images = same(canonicalPoset(group[i]!), canonicalPoset(group[j]!));
          expect(images, `${JSON.stringify(group[i])} ${JSON.stringify(group[j])}`).toBe(truth);
          if (!truth) different++;
        }
    // The sample holds non-isomorphic pairs of equal invariants, or the check says nothing.
    expect(different).toBeGreaterThan(0);
  });
}

test("IsIsomorphicPoset answers as the independent search does, on pairs of equal invariants at 6 through 10 elements", () => {
  const list = (value: readonly unknown[]): unknown => ["List", ...value.map((x) => (Array.isArray(x) ? list(x) : x))];
  const poset = (p: Poset): unknown => ["Poset", list(p)];
  const ask = (p: Poset, q: Poset): unknown =>
    ce.box(["IsIsomorphicPoset", poset(p), poset(q)] as never).evaluate().json;
  for (const n of SIZES) {
    const next = stream(4000 + n);
    const pool = Array.from({ length: DEEP ? 150 : 40 }, () => randomPoset(n, 0.15 + next() * 0.3, next));
    let falses = 0;
    for (const group of groupsOf(pool))
      for (let i = 0; i + 1 < group.length; i++) {
        const [p, q] = [group[i]!, group[i + 1]!];
        const truth = isomorphic(p, q);
        expect(ask(p, q), `${JSON.stringify(p)} ${JSON.stringify(q)}`).toBe(truth ? "True" : "False");
        expect(ask(p, relabeled(p, next))).toBe("True");
        if (!truth) falses++;
      }
    expect(falses, `size ${n}`).toBeGreaterThan(0);
  }
});
