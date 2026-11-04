// The carriers that have a flat reading (`Carrier.flat`), by type id (a map's `from`/`to`) and by
// constructor name (a statistic's `on`). Light, so generated code can import it.

import type { FlatCodec } from "@enumeratio/structures";
import { CARRIERS } from "./carrier-list.ts";

const flatCarriers = CARRIERS.filter((carrier) => carrier.flat !== undefined);

export const FLAT: Readonly<Record<string, FlatCodec>> = Object.fromEntries(
  flatCarriers.map((carrier) => [carrier.type, carrier.flat!]),
);

export const FLAT_BY_NAME: Readonly<Record<string, FlatCodec>> = Object.fromEntries(
  flatCarriers.map((carrier) => [carrier.name, carrier.flat!]),
);
