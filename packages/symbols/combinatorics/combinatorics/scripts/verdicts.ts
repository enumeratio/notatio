// What the compile steps' verdicts are keyed on (see verdict-snapshot.ts): the code doing the
// checking, by kind (`checkers`: a step's comparison, not its coordination, so an edit to a
// driver, the shard split say, keeps every row), and the family source an `early` callback can reach.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const at = (path: string): string => fileURLToPath(new URL(`../${path}`, import.meta.url));

/** Where each kind of cross-check lives. */
export const checkers = {
  /** compile-maps.ts's `agrees`. Its oracle, `evaluateDefinition`, is structures' (the engine's side of
   *  a verdict, which the deep test holds to the snapshot); src/maps.ts only re-exports it. */
  maps: ["scripts/compile-maps.ts"],
  /** The statistics areas' shared `agrees`. */
  statistics: ["src/statistics/generate-compiled.ts"],
  /** The exact counts' `agrees`, over BigInts (compile-exact.ts). */
  exact: ["src/statistics/generate-exact.ts"],
  /** The families' `disagreements`, and the Epsil it reads them through (epsil.ts and what it
   *  imports locally). A family is read only through its own fields, which its verdict is keyed
   *  on, so an edit to one family's file leaves the others' verdicts; `familySourceHash` covers
   *  what a field can't carry. */
  families: [
    "scripts/family-checks.ts",
    "collections/src/families/epsil.ts",
    "collections/src/families/types.ts",
    "collections/src/families/work.ts",
  ],
} as const;

let familySource: string | undefined;

/**
 * A hash of the family sources an `early` callback can reach: the files that mention `early`
 * and everything they import locally (a closure reaches no further). Keyed into the verdict of
 * a family that has such a callback, so editing another family's file leaves it alone. An
 * import from outside the directory widens it to the whole directory.
 */
export function familySourceHash(): string {
  if (familySource !== undefined) return familySource;
  const dir = at("collections/src/families");
  const names = readdirSync(dir).filter((n) => n.endsWith(".ts") && !n.endsWith(".generated.d.ts"));
  const text = new Map(names.map((n) => [n, readFileSync(join(dir, n), "utf8")]));
  const seen = new Set<string>();
  let whole = false;
  const visit = (name: string): void => {
    if (seen.has(name)) return;
    seen.add(name);
    if (/\bimport\s*\(|^import\s+"/m.test(text.get(name)!)) whole = true;
    for (const m of text.get(name)!.matchAll(/\bfrom\s+"(\.[^"]*)"/g)) {
      const target = m[1]!.replace(/\.(js|ts)$/, "");
      if (target.startsWith("./") && text.has(`${target.slice(2)}.ts`)) visit(`${target.slice(2)}.ts`);
      else if (!target.endsWith(".generated")) whole = true;
    }
  };
  for (const [name, source] of text) if (/\bearly\b/.test(source)) visit(name);
  const hash = createHash("sha256");
  for (const name of names.toSorted()) if (whole || seen.has(name)) hash.update(`${name}\0`).update(text.get(name)!);
  return (familySource = hash.digest("hex"));
}
