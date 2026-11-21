// Two inventories of the catalogue's statistic and map names, written as TSV (to the directory given by `--out`):
//
//   A  gxksum-names.tsv    a catalogued statistic or map whose name is also a compute-engine head
//                          (`Sum`, `Conjugate`): one row per carrier, with what ours means (the
//                          FindStat title, or our record's summary) and what the head means.
//   B  gxksum-plurals.tsv  a statistic whose name is a plural noun and whose answer is a number
//                          (`Blocks`): one row per carrier, with the count name the `…Count` rule gives
//                          (`BlockCount`); naming.ts has the rule.
//
//   node packages/census/scripts/collect-name-inventories.ts --out <dir>
//
// The names come from the records (`statOn`/`mapOn`, which the catalog is folded from), the engine's
// own heads from a bare compute-engine, result types from the manifest, FindStat ids from each record's
// `catalog` rows and their titles from findstat/data. Nothing here is a hand-kept list.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bareEngine } from "@notatio/engine/testing";
import { recordDirs, readEntries } from "@notatio/entry/node";
import { SYMBOLS } from "@notatio/manifest";

const flag = process.argv.indexOf("--out");
if (flag < 0 || process.argv[flag + 1] === undefined) throw new Error("usage: collect-name-inventories.ts --out <dir>");
const outDir = process.argv[flag + 1]!;

const packagesRoot = new URL("../../", import.meta.url).pathname;
const entries = recordDirs(packagesRoot).flatMap((dir) =>
  readEntries(dir.dir).map((entry) => ({ entry, package: dir.package })),
);

/** FindStat's title for an id (`St000165`, `Mp00041`), from the crawl the package carries. */
const titles = new Map<string, string>();
for (const file of ["statistics.json", "maps.json"]) {
  const data = JSON.parse(
    readFileSync(new URL(`../../symbols/combinatorics/combinatorics/findstat/data/${file}`, import.meta.url), "utf8"),
  ) as {
    items: Record<string, { title?: string; domain?: string }>;
  };
  for (const [id, item] of Object.entries(data.items)) titles.set(id, item.title ?? "");
}

/** The statistics and maps, one per (name, kind): the record that declares it on carriers. */
interface Row {
  readonly name: string;
  readonly kind: "statistic" | "map";
  readonly carriers: readonly string[];
  readonly package: string;
  readonly summary: string;
  /** carrier -> FindStat ids on it. */
  readonly findstat: ReadonlyMap<string, readonly string[]>;
}

const rows: Row[] = [];
for (const { entry, package: pkg } of entries) {
  const findstat = new Map<string, string[]>();
  for (const ref of entry.catalog ?? []) {
    if (ref.system !== "findstat" || ref.on === undefined) continue;
    findstat.set(ref.on, [...(findstat.get(ref.on) ?? []), ref.identity]);
  }
  for (const [kind, carriers] of [
    ["statistic", entry.statOn],
    ["map", entry.mapOn],
  ] as const) {
    if (carriers === undefined) continue;
    rows.push({
      name: entry.name,
      kind,
      carriers: carriers.toSorted(),
      package: pkg,
      summary: entry.summary ?? "",
      findstat,
    });
  }
}

const cell = (text: string): string => text.replace(/[\t\r\n]+/g, " ").trim();
const tsv = (header: readonly string[], lines: readonly (readonly string[])[]): string =>
  [header, ...lines].map((line) => line.map(cell).join("\t")).join("\n") + "\n";
const byText = (a: readonly string[], b: readonly string[]): number => {
  const x = a.join("\t");
  const y = b.join("\t");
  return x < y ? -1 : x > y ? 1 : 0;
};

// ─── A: names that are also compute-engine heads ─────────────────────────────────────────

const engine = bareEngine();
const engineHead = (name: string): { description?: string } | undefined =>
  engine.lookupDefinition(name) as { description?: string } | undefined;

const symbols = SYMBOLS as unknown as Record<
  string,
  { overloads: readonly { package: string; type?: string }[] } | undefined
>;

/** compute-engine's meaning of a name: its own record's summary (reference's `entries/`), else the
 *  engine's description, else the signature compute-engine gives it. */
const engineMeaning = (name: string): string => {
  const described =
    entries.find((e) => e.package === "reference" && e.entry.name === name)?.entry.summary ??
    engineHead(name)?.description;
  if (described) return described;
  const own = symbols[name]?.overloads.find((o) => o.package === "compute-engine")?.type;
  return own === undefined ? "" : `(no description; signature ${own})`;
};

const inventoryA: string[][] = [];
for (const row of rows) {
  if (engineHead(row.name) === undefined) continue;
  // What ours means on a carrier is what FindStat calls the item there; failing that, a library's own
  // record says it in its summary (a record in reference's `entries/` is compute-engine's, not ours).
  const ours = row.package === "reference" ? undefined : row.summary;
  for (const carrier of row.carriers) {
    const ids = row.findstat.get(carrier) ?? [];
    const fromFindStat = ids.map((id) => `${id}: ${titles.get(id) ?? "?"}`).join("; ");
    inventoryA.push([
      carrier,
      row.name,
      row.kind,
      fromFindStat || ours || "(no meaning recorded for this carrier)",
      engineMeaning(row.name),
      ids.join(", "),
    ]);
  }
}
inventoryA.sort(byText);

// ─── B: plural nouns that answer a number ───────────────────────────────────────────────

const NUMERIC = /^(integer|number|real|rational|natural|non_negative_integer|finite_integer)\b/;
/** Whether every arrow of every overload answers a number (`integer | number`, `number`). */
const answersNumber = (name: string): boolean => {
  const results = (symbols[name]?.overloads ?? []).flatMap((o) =>
    [...(o.type ?? "").matchAll(/->\s*([^&)]+)/g)].flatMap((m) => m[1]!.split("|").map((t) => t.trim())),
  );
  return results.length > 0 && results.every((t) => NUMERIC.test(t));
};

/** The words of a PascalCase name. */
const words = (name: string): string[] => name.match(/[A-Z][a-z0-9]*|[0-9]+/g) ?? [name];

const IRREGULAR: Readonly<Record<string, string>> = {
  Indices: "Index",
  Vertices: "Vertex",
  Matrices: "Matrix",
  Leaves: "Leaf",
  Children: "Child",
};

/** A plural noun's singular, or undefined for a word that is not one (`Dimension`, `Genus`, `Class`). */
const singular = (word: string): string | undefined => {
  if (IRREGULAR[word] !== undefined) return IRREGULAR[word];
  if (!word.endsWith("s") || /(ss|us|is|ics)$/.test(word) || word.length < 4) return undefined;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (/(sses|xes|ches|shes|zzes)$/.test(word)) return word.slice(0, -2);
  return word.slice(0, -1);
};

/** A phrase's words that join two ideas: the name is then a phrase, not a plural noun. */
const CONNECTORS = new Set(["And", "Plus", "Minus", "Times", "Of", "With", "Without", "After", "Before", "At", "In"]);

const declared = new Set(rows.map((r) => r.name));
const inventoryB: string[][] = [];
const notPlural: string[] = [];
for (const row of rows) {
  if (row.kind !== "statistic" || !answersNumber(row.name)) continue;
  const parts = words(row.name);
  const last = parts.at(-1)!;
  const one = singular(last);
  if (one === undefined) {
    if (last.endsWith("s")) notPlural.push(row.name);
    continue;
  }
  const countName = `${[...parts.slice(0, -1), one].join("")}Count`;
  const notes = [
    parts.slice(0, -1).some((w) => CONNECTORS.has(w)) ? "phrase" : "",
    declared.has(countName) ? `${countName} is already a head` : "",
  ].filter(Boolean);
  for (const carrier of row.carriers) {
    const ids = row.findstat.get(carrier) ?? [];
    // Whether FindStat's own title calls it a count: a value (`LeastCommonMultipleOfParts`) is not one.
    const numberOf = ids.every((id) => /^the number of\b/i.test(titles.get(id) ?? ""));
    const counts = ids.length === 0 ? "" : numberOf ? "yes" : "no";
    inventoryB.push([carrier, row.name, ids.join(", "), countName, counts, notes.join("; ")]);
  }
}
inventoryB.sort(byText);

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "gxksum-names.tsv"),
  tsv(["carrier", "name", "kind", "ours_means", "compute_engine_means", "findstat_id"], inventoryA),
);
writeFileSync(
  join(outDir, "gxksum-plurals.tsv"),
  tsv(["carrier", "name", "findstat_id", "count_name", "title_says_number_of", "notes"], inventoryB),
);
console.log(`A: ${inventoryA.length} rows (${new Set(inventoryA.map((r) => r[1])).size} names)`);
console.log(`B: ${inventoryB.length} rows (${new Set(inventoryB.map((r) => r[1])).size} names)`);
console.log(`number-valued names ending in s, left out as not plural nouns: ${notPlural.toSorted().join(", ")}`);
