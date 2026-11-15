// Makes the committed snapshot of the compile steps' interpreter cross-checks (verdicts.tsv; see
// verdict-snapshot.ts). Each step is its compile script run in a mode; the checks are split across
// processes as in the build (COMPILE_SHARDS, FAMILY_SHARDS).
//
//   pnpm run collect-verdicts                 checks each item whose row is missing or stale, rewrites
//                                             the snapshot, and drops the rows of items that are gone
//   pnpm run collect-verdicts --all           re-checks every row on the current engine and reports
//                                             each verdict that changed
//   pnpm run collect-verdicts --check         exits 1 when a row is missing or stale; runs no check
//   pnpm run collect-verdicts --all --check   re-checks every row and exits 1 when any verdict
//                                             differs from the snapshot; writes nothing

import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { journalOf, readSnapshot, type Row, SNAPSHOT, writeSnapshot } from "./verdict-snapshot.ts";
import { compiles, STEP_NAMES } from "./steps.ts";

const dir = fileURLToPath(new URL("..", import.meta.url));
const flags = new Set(process.argv.slice(2));
for (const flag of flags) if (flag !== "--all" && flag !== "--check") throw new Error(`unknown option ${flag}`);
const all = flags.has("--all");
const check = flags.has("--check");
const mode = check ? (all ? "verify" : "check") : "collect";

const started = Date.now();
const failed: string[] = [];
for (const [script] of compiles) {
  const step = Date.now();
  const run = spawnSync("node", [script], {
    cwd: dir,
    stdio: "inherit",
    env: { ...process.env, VERDICT_MODE: mode, VERDICT_ALL: all ? "1" : "0" },
  });
  console.log(`${script}: ${((Date.now() - step) / 1000).toFixed(0)}s`);
  if (run.status !== 0) failed.push(script);
}

// Rows of steps that no longer exist.
const known = new Set(Object.values(STEP_NAMES));
const orphans: Row[] = readSnapshot().filter((r) => !known.has(r.step));
if (orphans.length > 0) {
  if (mode === "collect") {
    writeSnapshot(readSnapshot().filter((r) => known.has(r.step)));
    console.log(`dropped ${orphans.length} rows of steps that no longer exist`);
  } else {
    console.log(`${orphans.length} rows belong to steps that no longer exist`);
    failed.push("orphaned rows");
  }
}

// A finished collect keeps no journal; an interrupted one resumes from it.
if (mode === "collect" && failed.length === 0) rmSync(journalOf(), { force: true });

console.log(`collect-verdicts (${mode}): ${((Date.now() - started) / 60000).toFixed(1)} min, snapshot ${SNAPSHOT}`);
if (failed.length > 0) {
  console.log(`failed: ${failed.join(", ")}`);
  process.exit(1);
}
