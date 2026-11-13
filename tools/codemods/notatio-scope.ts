// Codemod: the npm scope moves from @enumeratio to @notatio (wiki: Names; Contributing, "Codemods").
//
//   node tools/codemods/notatio-scope.ts           rewrite the tracked files
//   node tools/codemods/notatio-scope.ts --check   list what it would change; exit 1 if anything
//
// Converts, in every tracked text file but pnpm-lock.yaml and tools/codemods/:
// - `@enumeratio/<name>` for the names below (the workspace's packages at landing, and the
//   made-up packages tests build their fixtures from), with any subpath;
// - the bare scope wherever code spells it: `@enumeratio/` before a template or the end of a
//   string (`@enumeratio/${name}`, `"@enumeratio/"`), `@enumeratio/*` and `@enumeratio/…`, the
//   regex form `@enumeratio\/`, a quoted `"@enumeratio"`, `` `@enumeratio` `` and
//   `node_modules/@enumeratio`.
// Leaves: paths under `Playground/@enumeratio/` (the local folder), names it doesn't list (old
// packages named in comments), and the word enumeratio anywhere else. A package a branch adds
// under the old scope is not in the list: rename it by hand.
//
// After it: `vp install` (rewrites pnpm-lock.yaml), then `vp check --fix` (import order follows
// the new names), then rebuild (`node tools/ci/dist-cache.ts build`).
//
// --check also fails while any workspace package.json is still named in the old scope.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PACKAGES = [
  "adeles",
  "analytic",
  "bench",
  "boxes",
  "braid",
  "catalog",
  "ce-patches",
  "census",
  "cli",
  "combinatorics",
  "complex-numerals",
  "components",
  "config",
  "diagram",
  "engine",
  "entry",
  "evaluation",
  "formats",
  "frontend",
  "geometric",
  "groupalgebra",
  "hecke",
  "hopf",
  "hypercomplex",
  "incidence",
  "manifest",
  "modular",
  "number-theory",
  "numerals",
  "oracle",
  "perf-tools",
  "plausible",
  "polytope",
  "quiver",
  "raster",
  "reference",
  "residues",
  "statistics",
  "structures",
  "utils",
  "web",
  "wolfram",
];
const FIXTURES = [
  "absent",
  "builder",
  "bystander",
  "dep",
  "dup",
  "elsewhere",
  "high",
  "joiner",
  "lib",
  "low",
  "nothing",
  "one",
  "slow",
  "two",
  "walker",
  "x",
];

const NOT_LOCAL = String.raw`(?<!Playground\/)`;
const RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [
    new RegExp(String.raw`${NOT_LOCAL}@enumeratio\/(${[...PACKAGES, ...FIXTURES].join("|")})(?![\w-])`, "g"),
    "@notatio/$1",
  ],
  [new RegExp(String.raw`${NOT_LOCAL}@enumeratio\/(?=\$\{|["'\x60*…]|$)`, "gm"), "@notatio/"],
  [/@enumeratio\\\//g, "@notatio\\/"],
  [/(["'\x60])@enumeratio\1/g, "$1@notatio$1"],
  [/node_modules\/@enumeratio(?![\w-])/g, "node_modules/@notatio"],
];

const SKIP = (path: string): boolean => path === "pnpm-lock.yaml" || path.startsWith("tools/codemods/");

const check = process.argv.includes("--check");
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", maxBuffer: 1 << 28 })
  .split("\0")
  .filter((path) => path !== "" && !SKIP(path));

const changed: string[] = [];
for (const path of files) {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    continue; // deleted in the working tree
  }
  if (text.includes("\0") || !text.includes("@enumeratio")) continue;
  const next = RULES.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
  if (next === text) continue;
  changed.push(path);
  if (!check) writeFileSync(path, next);
}

const stale = files.filter((path) => {
  if (!path.endsWith("package.json")) return false;
  try {
    const name = (JSON.parse(readFileSync(path, "utf8")) as { name?: unknown }).name;
    return typeof name === "string" && name.startsWith("@enumeratio/");
  } catch {
    return false;
  }
});

if (check) {
  for (const path of changed) console.log(`would change ${path}`);
  for (const path of stale) console.log(`${path}: package still named in the old scope; rename it by hand`);
  if (changed.length + stale.length > 0) {
    console.error("run: node tools/codemods/notatio-scope.ts (see tools/codemods/pending.ts)");
    process.exit(1);
  }
} else {
  console.log(`notatio-scope: ${changed.length} files rewritten`);
  for (const path of stale) console.log(`${path}: package still named in the old scope; rename it by hand`);
}
