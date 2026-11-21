// Codemod: the site's origin moves from https://enumeratio.dev to https://notatio.app
// (wiki: Sites; Contributing, "Codemods").
//
//   node tools/codemods/site-origin.ts           rewrite the tracked files
//   node tools/codemods/site-origin.ts --check   list what it would change; exit 1 if anything
//
// Rewrites the absolute `https://enumeratio.dev` URL in every tracked text file but
// pnpm-lock.yaml and tools/codemods/: package READMEs and docs, schema `$id`s, the review
// tooling and its fixtures. Leaves the bare word `enumeratio.dev` (the domain named in prose)
// and `<name>@enumeratio.dev` addresses.
//
// After it: `node tools/ci/dist-cache.ts build`, then `vp check`.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const OLD = "https://enumeratio.dev";
const NEW = "https://notatio.app";
const check = process.argv.includes("--check");

/** Tracked text files naming the old origin; none on a tree already ported (git grep then exits 1). */
function filesNamingOld(): string[] {
  try {
    return execFileSync("git", ["grep", "-lI", "-F", OLD, "--", ".", ":!pnpm-lock.yaml", ":!tools/codemods"], {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
  } catch (error) {
    if ((error as { status?: number }).status === 1) return [];
    throw error;
  }
}

const files = filesNamingOld();

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const next = text.replaceAll(OLD, NEW);
  if (next === text) continue;
  console.log(file);
  if (!check) writeFileSync(file, next);
}
if (check && files.length > 0) process.exit(1);
