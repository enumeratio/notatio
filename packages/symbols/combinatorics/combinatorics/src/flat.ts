// The carriers that have a flat reading (`Carrier.flat`), by type id (a map's `from`/`to`) and by
// constructor name (a statistic's `on`). Light, so generated code can import it.

import { toJs } from "@notatio/engine/compiled";
import type { FlatCodec } from "@notatio/structures";
import { CARRIERS } from "./carrier-list.ts";

const flatCarriers = CARRIERS.filter((carrier) => carrier.flat !== undefined);

export const FLAT: Readonly<Record<string, FlatCodec>> = Object.fromEntries(
  flatCarriers.map((carrier) => [carrier.type, carrier.flat!]),
);

export const FLAT_BY_NAME: Readonly<Record<string, FlatCodec>> = Object.fromEntries(
  flatCarriers.map((carrier) => [carrier.name, carrier.flat!]),
);

type Subject = number | boolean | string | readonly Subject[];

/** A subject as plain JS: `toJs`, with a quoted string (a Cartan type's letter) read as itself. */
export function subjectToJs(json: unknown): Subject | undefined {
  if (typeof json === "string") return /^'.*'$/s.test(json) ? json.slice(1, -1) : undefined;
  if (!Array.isArray(json) || (json[0] !== "List" && json[0] !== "Tuple")) return toJs(json);
  const out: Subject[] = [];
  for (const item of json.slice(1)) {
    const value = subjectToJs(item);
    if (value === undefined) return undefined;
    out.push(value);
  }
  return out;
}
