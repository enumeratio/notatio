// Codemod: the permutation statistic `LargestCycleLength` is retired for `LongestCycleLength`,
// the one head FindStat's St000485 sits on (wiki: Contributing, "Codemods").
//
//   node tools/codemods/cycle-length-name.ts           rewrite the tracked files
//   node tools/codemods/cycle-length-name.ts --check   list what it would change; exit 1 if anything
//
// - deletes the `reference/LargestCycleLength/` record folder;
// - rewrites the word `LargestCycleLength` to `LongestCycleLength` in every other tracked text
//   file but pnpm-lock.yaml, tools/codemods/ and the site redirects (which name it as a source), dropping a line that the rewrite makes a copy of
//   another line in the same file (a map entry or list item both names had).
// Leaves the generated files, which their own scripts rewrite (`findstat-data.ts` by
// `find-findstat.ts`, the verdicts, ledger, sweep fixture and per-kernel values). A multi-line
// declaration naming both heads (the `stat(...)` call) is left to be deleted by hand.
//
// After it: `node tools/ci/dist-cache.ts build`, then the usual UPDATE_* regenerations.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const OLD = "LargestCycleLength";
const NEW = "LongestCycleLength";
const WORD = new RegExp(`\\b${OLD}\\b`, "g");
const HAS = new RegExp(`\\b${OLD}\\b`);
const check = process.argv.includes("--check");

const GENERATED = [
  /(^|\/)findstat-data\.ts$/,
  /(^|\/)verdicts\.tsv$/,
  /(^|\/)ledger\.tsv$/,
  /(^|\/)interpreter-sweep\.tsv$/,
  /(^|\/)examples\.values\.[^/]+\.tsv$/,
];
const RECORD = new RegExp(`/reference/${OLD}/`);

/** Tracked text files naming the old head; none on a tree already ported (git grep then exits 1). */
function filesNamingOld(): string[] {
  try {
    return execFileSync(
      "git",
      ["grep", "-lI", "-w", OLD, "--", ".", ":!pnpm-lock.yaml", ":!tools/codemods", ":!web/.vitepress/redirects.ts"],
      {
        encoding: "utf8",
      },
    )
      .split("\n")
      .filter(Boolean);
  } catch (error) {
    if ((error as { status?: number }).status === 1) return [];
    throw error;
  }
}

const files = filesNamingOld().filter((f) => !GENERATED.some((g) => g.test(f)));
const records = [...new Set(files.filter((f) => RECORD.test(f)).map((f) => f.slice(0, f.indexOf(OLD) + OLD.length)))];

for (const dir of records) {
  console.log(`${dir}/ (delete)`);
  if (!check) execFileSync("git", ["rm", "-rq", dir]);
}

for (const file of files.filter((f) => !RECORD.test(f))) {
  const lines = readFileSync(file, "utf8").split("\n");
  const seen = new Set(lines.filter((l) => !HAS.test(l)).map((l) => l.trim()));
  const next = lines.flatMap((line) => {
    if (!HAS.test(line)) return [line];
    const rewritten = line.replace(WORD, NEW);
    // A copy of a line the file already has: the old name's entry goes.
    if (rewritten.trim() !== "" && seen.has(rewritten.trim())) return [];
    seen.add(rewritten.trim());
    return [rewritten];
  });
  console.log(file);
  if (!check) writeFileSync(file, next.join("\n"));
}
if (check && (records.length > 0 || files.length > 0)) process.exit(1);
