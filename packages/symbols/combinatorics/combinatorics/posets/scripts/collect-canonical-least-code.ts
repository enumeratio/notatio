// Collect an independent reading of CanonicalPoset's "least code": for a fixed sample of posets of 9 and 10 elements,
// scripts/least-code.py tries every natural labeling (every linear extension) and keeps the least code, with no search or
// pruning. The result is written to tests/canonical-least-code.json, which `tests/canonical-least-code.test.ts` holds the
// kernel to; `vp test` needs no Python.
//
// The sample is the hard cases of `hardCases` (antichains, chains, disjoint chains, complete bipartite, a crown) and
// seeded random posets at four densities, each given as a random natural relabeling, and left out when it has more than
// `MAX_EXTENSIONS` natural labelings (the antichain at 10 elements has 3.6 million; Python takes minutes past two).
//
// Requires python3 on PATH. Run from the package:
//   node scripts/collect-canonical-least-code.ts
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { hardCases, identity, randomPoset, relabeled, stream } from "../tests/poset-samples.ts";
import { strictOrder } from "../tests/poset-findstat-readings.ts";

const SIZES = [9, 10];
const RANDOM_PER_SIZE = 12;
const MAX_EXTENSIONS = 2_000_000;

/** The number of linear extensions of the order, by the count of orderings of each down-closed subset. */
function extensions(p: number[][]): number {
  const n = p.length;
  const lt = strictOrder(p);
  const below = identity(n).map((y) => identity(n).reduce((m, x) => (lt[x]![y] ? m | (1 << x) : m), 0));
  const ways = new Array<number>(1 << n).fill(0);
  ways[0] = 1;
  for (let mask = 0; mask < 1 << n; mask++)
    for (let e = 0; e < n; e++)
      if (!((mask >> e) & 1) && (below[e]! & ~mask) === 0) ways[mask | (1 << e)]! += ways[mask]!;
  return ways[(1 << n) - 1]!;
}

const sample: number[][][] = [];
for (const n of SIZES) {
  const next = stream(11000 + n);
  const raw = [
    ...hardCases(n),
    ...Array.from({ length: RANDOM_PER_SIZE }, (_, i) => randomPoset(n, [0.1, 0.2, 0.3, 0.5][i % 4]!, next)),
  ];
  for (const p of raw) {
    const count = extensions(p);
    if (count > MAX_EXTENSIONS) console.error(`left out: ${n} elements, ${count} natural labelings`);
    else sample.push(relabeled(p, next));
  }
}

const out = execFileSync("python3", ["-I", new URL("./least-code.py", import.meta.url).pathname], {
  input: JSON.stringify(sample),
  maxBuffer: 1 << 28,
  encoding: "utf8",
});
const found = JSON.parse(out) as { extensions: number; code: number; canonical: number[][] }[];
const rows = sample.map((input, i) => ({ n: input.length, input, ...found[i]! }));
writeFileSync(
  new URL("../tests/canonical-least-code.json", import.meta.url),
  JSON.stringify({ source: "scripts/least-code.py: every natural labeling tried, least code kept", rows }) + "\n",
);
console.log(`${rows.length} posets, ${rows.reduce((s, r) => s + r.extensions, 0)} labelings tried`);
