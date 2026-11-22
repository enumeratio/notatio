// The binding law: a carrier a record lists in `statOn` / `mapOn` must be a type the head's own
// signature accepts. The name resolves to one head, and the head's signature is the claim; a
// name that is compute-engine's with another meaning (`Conjugate` is the complex conjugate) fails
// here instead of answering a different question. A catch-all parameter (`any`, `value`) does not
// count as accepting a carrier: the carrier needs a signature row of its own (`on:`), as `Max` has
// for `Finset`.
//
// The failures that remain are the golden; a new one, or a fixed one, changes it. Regenerate with
// `UPDATE_BINDING_LAW=1 vp test`.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ComputeEngine } from "@cortex-js/compute-engine";
import { CARRIERS, declareCombinatorics, declareMaps } from "@notatio/combinatorics";
import { readEntries, recordDirs } from "@notatio/entry/node";
import { declareCarrierElement, declareCarrierPlurals, declareStructures } from "@notatio/structures";
import type { ReferenceEntry } from "@notatio/entry";
import { expect, test } from "vite-plus/test";

const PACKAGES = fileURLToPath(new URL("../../", import.meta.url));
const byName = new Map<string, ReferenceEntry>();
for (const { dir } of recordDirs(PACKAGES))
  for (const e of readEntries(dir)) if (!byName.has(e.name)) byName.set(e.name, e);
const records = [...byName.values()];

const ce = new ComputeEngine();
declareCombinatorics(ce);
declareMaps(ce, Object.fromEntries(CARRIERS.map((c) => [c.type, c.name])));
declareCarrierPlurals(ce, CARRIERS);
declareCarrierElement(ce, CARRIERS);
declareStructures(ce);

const CATCH_ALL = new Set(["any", "unknown", "value", "expression"]);
const typeOfCarrier = new Map(CARRIERS.map((c) => [c.name, c.type]));

type Node = {
  kind?: string;
  name?: string;
  args?: { type: unknown }[];
  variadicArg?: { type: unknown };
  types?: unknown[];
  typeParams?: { name: string; bound?: unknown }[];
};

/** The first-argument types the head's signature (an intersection of overloads) names. */
function firstArguments(head: string): unknown[] {
  const def = ce.lookupDefinition(head);
  const sig = def && "operator" in def ? def.operator?.signature : undefined;
  if (sig === undefined) return [];
  const walk = (t: unknown): unknown[] => {
    const node = t as Node | null;
    if (node === null || typeof node !== "object") return [];
    if (node.kind === "signature") {
      const arg = node.args?.[0]?.type ?? node.variadicArg?.type;
      // A generic parameter `T` is read as its bound (`T: list` accepts a list).
      const v = arg as Node | undefined;
      if (v?.kind === "variable") return [node.typeParams?.find((p) => p.name === v.name)?.bound ?? "any"];
      return arg === undefined ? [] : [arg];
    }
    if (node.kind === "intersection") return (node.types ?? []).flatMap(walk);
    return [];
  };
  return walk(sig.type);
}

const isCatchAll = (t: unknown): boolean => {
  if (typeof t === "string") return CATCH_ALL.has(t);
  const node = t as Node;
  return node?.kind === "type" && node.name !== undefined && CATCH_ALL.has(node.name);
};

function accepts(record: ReferenceEntry, carrier: string): boolean {
  if (record.signatures?.some((s) => s.on?.includes(carrier))) return true;
  const type = typeOfCarrier.get(carrier);
  // A carrier other packages declare is a catalogCarrier record; any other name is no carrier
  // (`PermutationCycles` is a head), so only an `on:` row could accept it.
  if (type === undefined) return byName.get(carrier)?.catalogCarrier === true;
  const bound = ce.type(type);
  return firstArguments(record.name).some((t) => {
    if (isCatchAll(t)) return false;
    try {
      return bound.matches(ce.type(t as never));
    } catch {
      return false;
    }
  });
}

const GOLDEN = fileURLToPath(new URL("./binding-law.golden.json", import.meta.url));

test("every statOn / mapOn carrier is accepted by its head's signature, or is a known gap", () => {
  const failures: string[] = [];
  for (const r of records) {
    if (r.catalogCarrier) continue; // a carrier's conversions are constructor overloads.
    for (const [key, carriers] of [
      ["statistic", r.statOn],
      ["map", r.mapOn],
    ] as const)
      for (const carrier of carriers ?? []) if (!accepts(r, carrier)) failures.push(`${r.name} ${key} on ${carrier}`);
  }
  const fresh = { failures: failures.toSorted() };
  if (process.env.UPDATE_BINDING_LAW === "1") writeFileSync(GOLDEN, `${JSON.stringify(fresh, null, 2)}\n`);
  expect(fresh).toEqual(JSON.parse(readFileSync(GOLDEN, "utf8")));
}, 60_000);
