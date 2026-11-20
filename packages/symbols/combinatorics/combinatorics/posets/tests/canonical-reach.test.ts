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
import { type Poset, strictOrder } from "./poset-findstat-readings.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const SIZES = [6, 7, 8, 9, 10];
const PER_SIZE = DEEP ? 40 : 8;

const ce = bareEngine();
declareCombinatorics(ce);
declareMaps(ce, Object.fromEntries(CARRIERS.map((c) => [c.type, c.name])));

/** mulberry32: a fixed stream from a seed. */
function stream(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

const identity = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** The lower covers of the order `lt` (lt[x][y]: x below y) with the elements listed in the given order. */
function coversOf(lt: boolean[][], order: readonly number[]): number[][] {
  return order.map((y, j) => {
    const below = order.slice(0, j).filter((x) => lt[x]![y]);
    return below
      .filter((x) => !below.some((z) => lt[x]![z]))
      .map((x) => order.indexOf(x) + 1)
      .toSorted((a, b) => a - b);
  });
}

/** A random linear extension of `lt`, by Kahn's algorithm choosing among the minimal remaining elements. */
function randomExtension(lt: boolean[][], next: () => number): number[] {
  const left = new Set(identity(lt.length));
  const order: number[] = [];
  while (left.size > 0) {
    const minimal = [...left].filter((y) => ![...left].some((x) => lt[x]![y]));
    const pick = minimal[Math.floor(next() * minimal.length)]!;
    order.push(pick);
    left.delete(pick);
  }
  return order;
}

/** The same poset with its elements relabeled at random, naturally again. */
function relabeled(p: Poset, next: () => number): number[][] {
  const lt = strictOrder(p);
  return coversOf(lt, randomExtension(lt, next));
}

function closure(n: number, pairs: readonly (readonly [number, number])[]): boolean[][] {
  const lt = Array.from({ length: n }, () => Array.from({ length: n }, () => false));
  for (const [x, y] of pairs) lt[x]![y] = true;
  for (let k = 0; k < n; k++)
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) if (lt[x]![k] && lt[k]![y]) lt[x]![y] = true;
  return lt;
}

const fromRelation = (n: number, pairs: readonly (readonly [number, number])[]): number[][] =>
  coversOf(closure(n, pairs), identity(n));

function randomPoset(n: number, density: number, next: () => number): number[][] {
  const pairs: [number, number][] = [];
  for (let x = 0; x < n; x++) for (let y = x + 1; y < n; y++) if (next() < density) pairs.push([x, y]);
  return fromRelation(n, pairs);
}

/** The hard cases at size n. */
function hardCases(n: number): number[][][] {
  const found: number[][][] = [];
  found.push(Array.from({ length: n }, () => [])); // antichain
  found.push(Array.from({ length: n }, (_, i) => (i === 0 ? [] : [i]))); // chain
  found.push(fromRelation(n, [[0, n - 1]])); // wide, one relation
  found.push(
    fromRelation(n, [
      [0, 1],
      [1, 2],
    ]),
  ); // wide, a chain of three
  // Disjoint chains of equal length (many automorphisms), of 2 and of 3.
  for (const len of [2, 3]) {
    const pairs: [number, number][] = [];
    for (let i = 0; i + 1 < n; i++) if ((i + 1) % len !== 0) pairs.push([i, i + 1]);
    found.push(fromRelation(n, pairs));
  }
  // Complete bipartite, balanced and lopsided.
  for (const low of [Math.floor(n / 2), 1, n - 1]) {
    const pairs: [number, number][] = [];
    for (let x = 0; x < low; x++) for (let y = low; y < n; y++) pairs.push([x, y]);
    found.push(fromRelation(n, pairs));
  }
  // A crown: the bipartite shape with a perfect matching removed.
  const crown: [number, number][] = [];
  const h = Math.floor(n / 2);
  for (let x = 0; x < h; x++) for (let y = h; y < 2 * h; y++) if (y - h !== x) crown.push([x, y]);
  found.push(fromRelation(n, crown));
  return found;
}

function sample(n: number): number[][][] {
  const next = stream(1000 + n);
  const found = hardCases(n);
  const densities = [0.1, 0.2, 0.3, 0.5];
  for (let i = 0; i < PER_SIZE; i++) found.push(randomPoset(n, densities[i % densities.length]!, next));
  return found;
}

// ─── an isomorphism test written independently of the canonical form ─────────────────────────────────────────────────

/** Whether some bijection carries the order of p onto the order of q: backtracking on (down-degree, up-degree). */
function isomorphic(p: Poset, q: Poset): boolean {
  const n = p.length;
  if (q.length !== n) return false;
  const a = strictOrder(p);
  const b = strictOrder(q);
  const key = (lt: boolean[][], x: number): string =>
    `${lt.filter((row) => row[x]).length},${lt[x]!.filter(Boolean).length}`;
  const ka = identity(n).map((x) => key(a, x));
  const kb = identity(n).map((x) => key(b, x));
  const image: number[] = [];
  const used = new Set<number>();
  const place = (x: number): boolean => {
    if (x === n) return true;
    for (let y = 0; y < n; y++) {
      if (used.has(y) || ka[x] !== kb[y]) continue;
      let ok = true;
      for (let w = 0; w < x && ok; w++) ok = a[w]![x] === b[image[w]!]![y] && a[x]![w] === b[y]![image[w]!];
      if (!ok) continue;
      image[x] = y;
      used.add(y);
      if (place(x + 1)) return true;
      used.delete(y);
    }
    return false;
  };
  return place(0);
}

/** Size, relations, height and width, as one key. */
function invariants(p: Poset): string {
  const n = p.length;
  const lt = strictOrder(p);
  let relations = 0;
  for (const row of lt) relations += row.filter(Boolean).length;
  const top: number[] = [];
  for (let y = 0; y < n; y++)
    top[y] =
      1 +
      Math.max(
        0,
        ...identity(y)
          .filter((x) => lt[x]![y])
          .map((x) => top[x]!),
      );
  const height = Math.max(0, ...top);
  let width = 0;
  for (let mask = 1; mask < 1 << n; mask++) {
    const members = identity(n).filter((x) => (mask >> x) & 1);
    if (members.length > width && members.every((x) => members.every((y) => !lt[x]![y]))) width = members.length;
  }
  return `${n}/${relations}/${height}/${width}`;
}

const same = (p: Poset, q: Poset): boolean => JSON.stringify(p) === JSON.stringify(q);

function groupsOf(pool: number[][][]): number[][][][] {
  const groups = new Map<string, number[][][]>();
  for (const p of pool) groups.set(invariants(p), [...(groups.get(invariants(p)) ?? []), p]);
  return [...groups.values()];
}

for (const n of SIZES) {
  const posets = sample(n);

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
