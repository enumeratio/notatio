// How the reference package's scripts import the libraries it depends on, and which they are:
// shared by the full engine (`engines.ts`) and the lazy one (`lazy-engines.ts`), which must
// not import each other's libraries.

import { readFileSync } from "node:fs";
import { dependedLibraries, type Importer } from "@notatio/manifest";
import { OWN_ENGINE } from "../src/own-engine.ts";

// The libraries are the ones this package depends on (it can import each, so each specifier
// resolves from here); what each declares, and in what order, is the manifest's to say.
export const importer: Importer = (specifier, options) =>
  options?.json
    ? import(/* @vite-ignore */ specifier, { with: { type: "json" } }).then((m: { default: unknown }) => m.default)
    : import(/* @vite-ignore */ specifier);

const own = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as Parameters<
  typeof dependedLibraries
>[0];

/** Every library this package depends on. Not an OWN_ENGINE package (src/node.ts): its heads
 *  override compute-engine's own, and the scan evaluates them in their own engine
 *  (own-engines.ts) instead. */
export const LIBRARY_NAMES: readonly string[] = dependedLibraries(own).filter((name) => !OWN_ENGINE.has(name));
