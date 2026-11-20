import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

// `collectionElements` returns undefined when it cannot list a collection; reading that as an
// empty list answers for the wrong collection (a Mean over columns of an unlistable matrix
// gave the empty matrix). A caller declines instead.
const DECLINE_AS_EMPTY = /collectionElements\([^()]*(?:\([^()]*\)[^()]*)*\)\s*(?:\?\?|\|\|)\s*\[\]/;

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sources(path, out);
    else if (/\.[cm]?tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

test("no collectionElements(…) ?? [] — a decline is not an empty collection", () => {
  const self = fileURLToPath(import.meta.url);
  const offenders = sources(join(root, "packages"))
    .filter((f) => f !== self && DECLINE_AS_EMPTY.test(readFileSync(f, "utf8")))
    .map((f) => relative(root, f));
  expect(offenders).toEqual([]);
});
