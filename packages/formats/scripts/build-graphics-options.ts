// The options each graphics head declares, into generated/graphics-options.json, read from the
// records' `options:` field. The runtime loads no record, so graphics-options.ts imports this table.
// `build` runs it; never committed.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readEntries } from "@notatio/entry/node";

const RECORDS = fileURLToPath(new URL("../reference", import.meta.url));
const TABLE = fileURLToPath(new URL("../generated/graphics-options.json", import.meta.url));

const table: Record<string, readonly string[]> = {};
for (const entry of readEntries(RECORDS)) if (entry.options?.length) table[entry.name] = entry.options;
mkdirSync(dirname(TABLE), { recursive: true });
writeFileSync(TABLE, JSON.stringify(table));
console.log(`options of ${Object.keys(table).length} heads -> ${TABLE}`);
