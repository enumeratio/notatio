#!/usr/bin/env node
// Bumps the compute-engine pin to a release: every workspace manifest's range, the version
// `ce-internals.ts` was checked against, and pnpm's minimum-release-age exclusion, then the lockfile.
// Idempotent: a second run with the same version changes nothing.
//
//   node tools/ce-bump/run.ts <version>   make the edits and run `pnpm install --lockfile-only`
//   node tools/ce-bump/run.ts --check [version]   print `pinned=`, `target=` (the version given, else
//                                                  npm's latest) and `newer=` lines; exit 0 either way

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadWorkspace, root } from "../ci/workspace.ts";

const PACKAGE = "@cortex-js/compute-engine";
const INTERNALS = "packages/engine/src/ce-internals.ts";
const WORKSPACE_YAML = "pnpm-workspace.yaml";
const VERSION = /^\d+\.\d+\.\d+$/;
const DEP_FIELDS = ["dependencies", "devDependencies", "peerDependencies"] as const;

const read = (rel: string): string => readFileSync(join(root, rel), "utf8");
const write = (rel: string, text: string): void => writeFileSync(join(root, rel), text);

const PIN = /(export const CHECKED_COMPUTE_ENGINE = ")([^"]+)(")/;

export function pinnedVersion(): string {
  const m = PIN.exec(read(INTERNALS));
  if (m === null) throw new Error(`${INTERNALS}: no CHECKED_COMPUTE_ENGINE`);
  return m[2]!;
}

function latestVersion(): string {
  const v = execFileSync("npm", ["view", PACKAGE, "version"], { encoding: "utf8", cwd: tmpdir() }).trim();
  if (!VERSION.test(v)) throw new Error(`npm view returned ${JSON.stringify(v)}`);
  return v;
}

/** Numeric `a.b.c` comparison; positive when `a` is newer. */
function compare(a: string, b: string): number {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i]! - y[i]!;
  return 0;
}

/** Rewrites the range in each manifest that names the package, keeping its `^`/`~`/bare style. */
function bumpManifests(version: string): string[] {
  const changed: string[] = [];
  for (const pkg of loadWorkspace().values()) {
    const rel = `${pkg.dir}/package.json`;
    const text = read(rel);
    const json = JSON.parse(text) as Record<string, Record<string, string> | undefined>;
    let next = text;
    for (const field of DEP_FIELDS) {
      const range = json[field]?.[PACKAGE];
      if (range === undefined) continue;
      const m = /^([\^~]?)\d[\w.+-]*$/.exec(range);
      if (m === null) continue; // `catalog:`, `workspace:` and the like are not ours to edit
      const line = new RegExp(`("${PACKAGE.replace("/", "\\/")}"\\s*:\\s*)"${range.replace(/[.^+]/g, "\\$&")}"`, "g");
      next = next.replace(line, `$1"${m[1]}${version}"`);
    }
    if (next !== text) {
      write(rel, next);
      changed.push(rel);
    }
  }
  return changed;
}

/**
 * pnpm's `minimumReleaseAgeExclude` lets a freshly published version install. The entry is
 * `<package>@<previous> || <version>`: the version being left stays resolvable and the new one is allowed.
 * Without an entry, one is added.
 */
function bumpReleaseAgeExclude(version: string, previous: string): boolean {
  const text = read(WORKSPACE_YAML);
  const entry = new RegExp(`^([ \\t]+- ["']?)${PACKAGE}@[^"'\\n]*(["']?)[ \\t]*$`, "m");
  const wanted = `${PACKAGE}@${previous} || ${version}`;
  let next: string;
  const m = entry.exec(text);
  if (m !== null) {
    if (m[0].includes(`|| ${version}`) || m[0].includes(`@${version}"`)) return false;
    next = text.replace(entry, `${m[1]}${wanted}${m[2]}`);
  } else if (/^minimumReleaseAgeExclude:/m.test(text)) {
    next = text.replace(/^(minimumReleaseAgeExclude:\n(?:\s+-.*\n)*)/m, `$1  - "${wanted}"\n`);
  } else {
    next = `${text.replace(/\n*$/, "\n")}minimumReleaseAgeExclude:\n  - "${wanted}"\n`;
  }
  if (next === text) return false;
  write(WORKSPACE_YAML, next);
  return true;
}

function bump(version: string): void {
  const previous = pinnedVersion();
  if (compare(version, previous) < 0) throw new Error(`${version} is older than the pinned ${previous}`);
  // Entry first: on a re-run `previous` is already `version`, and the entry then stays as it was.
  const edited = bumpManifests(version);
  const internals = read(INTERNALS);
  if (previous !== version) write(INTERNALS, internals.replace(PIN, `$1${version}$3`));
  const exclude = previous !== version && bumpReleaseAgeExclude(version, previous);
  const touched = previous !== version || edited.length > 0;
  console.log(
    `${edited.length} manifests, ${previous !== version ? INTERNALS : "no internals change"}${exclude ? `, ${WORKSPACE_YAML}` : ""}`,
  );
  if (touched) execFileSync("pnpm", ["install", "--lockfile-only"], { cwd: root, stdio: "inherit" });
  else console.log(`already at ${version}: nothing to do`);
}

function check(version: string | undefined): void {
  const pinned = pinnedVersion();
  const target = version ?? latestVersion();
  console.log(`pinned=${pinned}\ntarget=${target}\nnewer=${compare(target, pinned) > 0}`);
}

const args = process.argv.slice(2);
const version = args.find((a) => !a.startsWith("--"));
if (version !== undefined && !VERSION.test(version)) {
  console.error("usage: node tools/ce-bump/run.ts <version> | --check [version]");
  process.exit(2);
}
if (args.includes("--check")) check(version);
else if (version === undefined) {
  console.error("usage: node tools/ce-bump/run.ts <version> | --check [version]");
  process.exit(2);
} else bump(version);
