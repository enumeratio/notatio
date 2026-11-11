// Points this checkout's workspace at a compute-engine tarball, for one CI job: nothing it writes is committed.
//
//   node .github/scripts/compute-engine-tarball.ts apply <tarball>   before `pnpm install --no-frozen-lockfile`
//   node .github/scripts/compute-engine-tarball.ts verify <tarball>  after it: every package resolves the tarball
//
// `apply` appends a pnpm override to pnpm-workspace.yaml, one per range the packages declare, so a pin
// bump needs no edit here. Ranges are matched exactly: a transitive copy under another range (mathlive's
// own) stays what it is. The install rewrites pnpm-lock.yaml, which changes every dist-cache key.

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadWorkspace, root } from "../../tools/ci/workspace.ts";

const NAME = "@cortex-js/compute-engine";
const [mode, tarball] = process.argv.slice(2);
if ((mode !== "apply" && mode !== "verify") || tarball === undefined) {
  console.error("usage: compute-engine-tarball.ts apply|verify <tarball>");
  process.exit(2);
}
const file = resolve(tarball);

function declared(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const pkg of loadWorkspace().values()) {
    const manifest = JSON.parse(readFileSync(resolve(root, pkg.dir, "package.json"), "utf8")) as Record<
      string,
      Record<string, string> | undefined
    >;
    for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      const range = manifest[field]?.[NAME];
      if (range !== undefined) out.set(range, [...(out.get(range) ?? []), pkg.dir]);
    }
  }
  return out;
}

if (mode === "apply") {
  const ranges = [...declared().keys()].toSorted();
  if (ranges.length === 0) throw new Error(`no package declares ${NAME}`);
  const bad = ranges.filter((r) => !/^[\^~]?\d/.test(r));
  if (bad.length > 0) throw new Error(`${NAME} declared as ${bad.join(", ")}: not a plain version range`);
  const path = resolve(root, "pnpm-workspace.yaml");
  if (/^overrides:/m.test(readFileSync(path, "utf8"))) throw new Error("pnpm-workspace.yaml already has overrides:");
  appendFileSync(path, `overrides:\n${ranges.map((r) => `  "${NAME}@${r}": file:${file}\n`).join("")}`);
  console.log(`overrides for ${ranges.join(", ")} -> ${file}`);
} else {
  // A swap that silently matches nothing would test the pinned version and report green.
  const want = (
    JSON.parse(execFileSync("tar", ["-xzOf", file, "package/package.json"], { encoding: "utf8" })) as {
      version: string;
    }
  ).version;
  let checked = 0;
  const wrong: string[] = [];
  for (const dirs of declared().values())
    for (const dir of dirs) {
      const manifest = resolve(root, dir, "node_modules", NAME, "package.json");
      if (!existsSync(manifest)) continue;
      checked++;
      const got = (JSON.parse(readFileSync(manifest, "utf8")) as { version: string }).version;
      if (got !== want) wrong.push(`${dir}: ${got}`);
    }
  if (checked === 0 || wrong.length > 0) {
    console.error(
      `expected ${NAME} ${want} in every package (checked ${checked}); found ${wrong.join(", ") || "none"}`,
    );
    process.exit(1);
  }
  console.log(`${NAME} ${want} in ${checked} packages`);
}
