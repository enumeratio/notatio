// The kernel against the Epsil body past where the definition's guard (`DEFINITION_LIMIT`) lets a call run. The guard
// is the map's, not the body's, so the body runs here without it. What makes the body slow is its first step, a fold that
// builds the table of every permutation (a minute at 8 elements, quadratic in n!); the rest of it is cheap (3 s at 10).
// So past 7 elements the body is compiled with that one step replaced by a table the test generates, and the rest (the
// order, the natural labelings, their codes, the least, the covers read back) is the committed body unchanged. The
// replacement is held honest three ways: the body with it agrees with the committed body through 5 elements, the Epsil
// table is the same set of permutations as the generated one at 6 and 7, and the committed body, table included, runs
// against the kernel at 6 and 7.
//
// The sample (standard: a few posets per size; deep: more, and larger):
//   - 6, 7: the committed body whole, on strided ranks of `Posets(n)`;
//   - 7 to 9: strided ranks of `Posets(n)` (ranks run in ascending canonical code, so a stride spreads over the codes),
//     each given as a random natural relabeling so the kernel does the work, never as its own canonical form;
//   - every size 6 to 10: the hard cases (antichain, chain, wide with few relations, disjoint chains, complete
//     bipartite, a crown) and seeded random posets at four densities.
import { compileTyped } from "@notatio/engine/compiled";
import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { canonicalPosetBody, permutationTable } from "../src/canonical-definitions.ts";
import { canonicalPoset, posetAt, posetCount } from "../src/canonical.ts";
import { posetsOfSize } from "./poset-findstat-readings.ts";
import { hardCases, randomPoset, relabeled, stream } from "./poset-samples.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const bare = bareEngine();
type Tree = unknown;

const replace = (tree: Tree, from: string, to: Tree): Tree =>
  JSON.stringify(tree) === from ? to : Array.isArray(tree) ? tree.map((x) => replace(x, from, to)) : tree;

/** The committed body with its permutation table (`permutationTable("cn")`) read from `_cp` instead. */
const tableFree = replace(canonicalPosetBody, JSON.stringify(permutationTable("cn")), "_cp");
const whole = compileTyped(bare, canonicalPosetBody, { _raw: "list<list<integer>>" });
const free = compileTyped(bare, tableFree, { _raw: "list<list<integer>>", _cp: "list<integer>" });

/** Every permutation of 1..n, n entries each, in no particular order. */
function permutations(n: number): number[] {
  const out: number[] = [];
  const a = Array.from({ length: n }, (_, i) => i + 1);
  const rec = (k: number): void => {
    if (k === n) {
      out.push(...a);
      return;
    }
    for (let i = k; i < n; i++) {
      [a[k], a[i]] = [a[i]!, a[k]!];
      rec(k + 1);
      [a[k], a[i]] = [a[i]!, a[k]!];
    }
  };
  rec(0);
  return out;
}

const tables = new Map<number, number[]>();
const tableOf = (n: number): number[] => {
  if (!tables.has(n)) tables.set(n, permutations(n));
  return tables.get(n)!;
};

const rows = (flat: readonly number[], n: number): string[] => {
  const found: string[] = [];
  for (let i = 0; i < flat.length; i += n) found.push(flat.slice(i, i + n).join(","));
  return found.toSorted();
};

const viaDefinition = (p: number[][]): unknown => free!.run({ _raw: p, _cp: tableOf(p.length) });

/** Strided ranks of the list of n elements, each as a random natural relabeling. */
function strided(n: number, count: number): number[][][] {
  const next = stream(5000 + n);
  const total = posetCount(n);
  const step = Math.max(1, Math.floor(total / count));
  const found: number[][][] = [];
  for (let r = Math.floor(step / 2); r < total; r += step) found.push(relabeled(posetAt(n, r), next));
  return found;
}

function randoms(n: number, count: number): number[][][] {
  const next = stream(6000 + n);
  return Array.from({ length: count }, (_, i) => randomPoset(n, [0.1, 0.2, 0.3, 0.5][i % 4]!, next));
}

const agree = (p: number[][]): void => {
  expect(viaDefinition(p), JSON.stringify(p)).toEqual(canonicalPoset(p));
};

test("the body without its table gives the committed body's answers, through 5 elements", () => {
  expect(JSON.stringify(tableFree)).not.toBe(JSON.stringify(canonicalPosetBody));
  expect(free).toBeDefined();
  for (let n = 0; n <= (DEEP ? 5 : 4); n++) for (const p of posetsOfSize(n)) agree(p);
});

test("the Epsil permutation table is the generated one's set of permutations, at 6 elements (7 in a deep run)", () => {
  for (let n = 6; n <= (DEEP ? 7 : 6); n++) {
    const table = compileTyped(bare, permutationTable("_n"), { _n: "integer" })!;
    expect(rows(table.run({ _n: n }) as number[], n)).toEqual(rows(tableOf(n), n));
  }
});

for (const n of DEEP ? [6, 7, 8, 9] : [6, 7, 8]) {
  test(`${n} elements: the kernel gives the body's answers on the hard cases and seeded random posets`, () => {
    const next = stream(7000 + n);
    // The standard run keeps the antichain (the most automorphisms), the chain and one random poset.
    const cases = DEEP ? [...hardCases(n), ...randoms(n, 40)] : [...hardCases(n).slice(0, 2), ...randoms(n, 1)];
    for (const p of cases) agree(relabeled(p, next));
  });
}

if (DEEP) {
  test("10 elements: the kernel gives the body's answers on seeded random posets", () => {
    const next = stream(7010);
    for (const p of randoms(10, 4)) agree(relabeled(p, next));
  });

  // Each hard case at 10 elements on its own: the body takes seconds there, and CI is slower.
  hardCases(10).forEach((p, i) =>
    test(`10 elements, hard case ${i}: the kernel gives the body's answers`, () => {
      agree(relabeled(p, stream(8000 + i)));
    }),
  );

  for (const [n, count] of [
    [7, 700],
    [8, 400],
    [9, 60],
  ] as const)
    test(`${n} elements: the kernel gives the body's answers on ${count} strided ranks of Posets(${n}) (relabeled)`, () => {
      for (const p of strided(n, count)) agree(p);
    });

  test("6 and 7 elements: the kernel gives the whole committed body's answers (table included)", () => {
    for (const n of [6, 7]) {
      const next = stream(9000 + n);
      for (const p of [...hardCases(n), ...strided(n, n === 6 ? 12 : 6)]) {
        const input = relabeled(p, next);
        expect(whole!.run({ _raw: input }), JSON.stringify(input)).toEqual(canonicalPoset(input));
      }
    }
  });
}
