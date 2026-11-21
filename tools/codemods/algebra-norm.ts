// Codemod: our algebra norm is renamed from `Norm` to `AlgebraNorm` (BL-534). `Norm` stays
// compute-engine's modulus (`Norm(3 + 4i)` is 5); `AlgebraNorm(3 + 4i)` is 25.
//
//   node tools/codemods/algebra-norm.ts           rewrite the tracked files
//   node tools/codemods/algebra-norm.ts --check   list what it would change; exit 1 if anything
//
// Moves the hypercomplex record `reference/Norm/` to `reference/AlgebraNorm/` and rewrites the
// word `Norm` to `AlgebraNorm` in the files that use it as our head: the hypercomplex package's
// README, docs and tests, the diagram package's hypercomplex cross-check, and the statistic
// claims (`Norm on GaussianInteger`, `Norm on Multicomplex`) in the stat-on golden. Layer values
// named `Norm` (quadratic integers, radix systems) and compute-engine's and Wolfram's `Norm`
// elsewhere are left alone. The kernel's Wolfram values for the old rows are dropped: Wolfram
// has no `AlgebraNorm`.
//
// After it: `UPDATE_FORMS=1 node packages/frontend/scripts/collect-forms.ts`,
// `node packages/reference/scripts/format-records.ts`, `node tools/ci/dist-cache.ts build`, `vp check`.

import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const check = process.argv.includes("--check");
const root = new URL("../..", import.meta.url).pathname;
const HYPERCOMPLEX = "packages/symbols/algebras/hypercomplex";

const OLD_RECORD = `${HYPERCOMPLEX}/reference/Norm`;
const NEW_RECORD = `${HYPERCOMPLEX}/reference/AlgebraNorm`;

/** Files that name our head; `Norm` as a whole word is rewritten in each. */
const FILES = [
  `${HYPERCOMPLEX}/README.md`,
  `${HYPERCOMPLEX}/docs/finite.md`,
  `${HYPERCOMPLEX}/docs/hypercomplex-algebras.md`,
  `${HYPERCOMPLEX}/tests/hypercomplex.test.ts`,
  `${HYPERCOMPLEX}/tests/multicomplex.test.ts`,
  "packages/symbols/algebras/diagram/tests/heads.test.ts",
  "packages/frontend/tests/stat-on.golden.json",
  `${NEW_RECORD}/index.md`,
  `${NEW_RECORD}/examples.tsv`,
];

const at = (path: string): string => join(root, path);
const changed: string[] = [];

if (existsSync(at(OLD_RECORD))) {
  changed.push(`${OLD_RECORD} -> ${NEW_RECORD}`);
  if (!check) {
    if (existsSync(at(NEW_RECORD))) throw new Error(`${NEW_RECORD} already exists`);
    renameSync(at(OLD_RECORD), at(NEW_RECORD));
    rmSync(at(`${NEW_RECORD}/examples.values.wolfram.tsv`), { force: true });
  }
}

for (const file of FILES) {
  // In a check run the record has not moved yet, so read it where it still is.
  const path = check && file.startsWith(NEW_RECORD) ? file.replace(NEW_RECORD, OLD_RECORD) : file;
  if (!existsSync(at(path))) continue;
  const text = readFileSync(at(path), "utf8");
  const next = text.replace(/\bNorm\b/g, "AlgebraNorm");
  if (next === text) continue;
  changed.push(file);
  if (!check) writeFileSync(at(path), next);
}

for (const line of changed) console.log(line);
if (check && changed.length > 0) process.exit(1);
