// A `setup` module for `@notatio/evaluation/node` that declares only the packages its URL
// names (`lazy-engines.ts?packages=analytic,boxes`), and what they require, in the order
// LIBRARIES lists them: the resolver's engine, for checking it means what the full one does.
// It imports only those packages, so a worker for one head does not pay for the rest.

import type { ComputeEngine } from "@cortex-js/compute-engine";
import { type Library, loadLibraries, type PackageField, plan } from "@notatio/manifest";
import { EXTRAS } from "./extras.ts";
import { importer, LIBRARY_NAMES } from "./importer.ts";

/** Each library by name and what it requires, from its `package.json` alone: all `plan` needs to
 *  choose packages without importing any. */
async function stubs(): Promise<Library[]> {
  const found = await Promise.all(
    LIBRARY_NAMES.map(async (name) => {
      const json = (await importer(`@notatio/${name}/package.json`, { json: true })) as { enumeratio?: PackageField };
      const field = json.enumeratio;
      // A package with neither `declare` nor `late` is not a library (`loadLibraries` skips it too).
      return field?.declare === undefined && field?.late === undefined
        ? undefined
        : { name, declare: () => undefined, requires: field.requires ?? [] };
    }),
  );
  return found.filter((stub) => stub !== undefined).filter((stub) => stub.name !== "evaluation");
}

export async function configure(ce: ComputeEngine): Promise<void> {
  const asked = new URL(import.meta.url).searchParams.get("packages") ?? "";
  const wanted = plan(asked.split(",").filter(Boolean), await stubs()).libraries.map((stub) => stub.name);
  const loaded = await loadLibraries<ComputeEngine>(wanted, importer);
  const declared = new Set<string>();
  for (const library of plan(wanted, loaded).libraries) {
    void library.declare(ce);
    declared.add(library.name);
  }
  // The host's own libraries (Restricted, Compose, Histogram) come with whatever they build on;
  // no package names them, so the resolver can't bring them.
  for (const extra of EXTRAS) {
    if (!(extra.requires ?? []).every((name) => declared.has(name))) continue;
    void extra.declare(ce);
    declared.add(extra.name);
  }
}
