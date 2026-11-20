import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

// A call's operands are its parts only where they cannot change once its symbols are bound: `a + b`
// is a sum of lists once `a` and `b` are lists, and a pending `Divisors(n)` is a list. `partsOf`
// (@notatio/engine) answers where the operands are sound parts and declines where they are not, so a
// handler that reads a non-collection's operands goes through it. `collectionElements` falls back to
// `operandsOf` for a non-collection, so it is not called under `packages/symbols` at all.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SYMBOLS = join(ROOT, "packages", "symbols");
const COLLECTIONS = join(SYMBOLS, "combinatorics", "combinatorics", "collections", "src");
const CE_PATCHES = join(ROOT, "packages", "ce-patches", "src");

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "tests"].includes(entry.name) || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sources(path, out);
    else if (/\.[cm]?tsx?$/.test(entry.name) && !/\.test\.[cm]?tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

const code = (line: string): string => line.replace(/\/\/.*$/, "").trim();

/** Lines of `files` matching `pattern`, as `file: trimmed line`, outside comments. */
function hits(files: string[], pattern: RegExp): string[] {
  return files.flatMap((file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => pattern.test(code(line)) && !/^\s*(\/\/|\*|\/\*)/.test(line))
      .map((line) => `${relative(ROOT, file)}: ${line.trim()}`),
  );
}

test("no handler calls collectionElements: a non-collection's operands are read through partsOf", () => {
  const files = [...sources(SYMBOLS), ...sources(CE_PATCHES)];
  expect(hits(files, /\bcollectionElements\(/)).toEqual([]);
});

// A decline is not an empty list of parts: `partsOf(…) ?? []` answers for the wrong expression.
test("no partsOf(…) ?? [] — a decline is not an empty list of parts", () => {
  const files = [...sources(SYMBOLS), ...sources(CE_PATCHES)];
  expect(
    hits(files, /\b(?:partsOf|treeParts|soundPartsOf)\([^()]*(?:\([^()]*\)[^()]*)*\)\s*(?:\?\?|\|\|)\s*\[\]/),
  ).toEqual([]);
});

// Reading the first operand's operands directly. Each exception is a head that has already
// checked the operand is a literal `List` or `Association` (or whose signature types it a list), so
// the operands are its elements whatever is bound later.
const ALLOWED: Record<string, string> = {
  "list-functional.ts: const kernel = operandsOf(ops[0]);": "LinearRecurrence is typed (list<any>, …)",
  "list-functional.ts: const eqns = operandsOf(ops[0]);": "RecurrenceTable is typed (list<any>, …)",
  "list-functional.ts: () => (ops) => ce.number(operandsOf(ops[0]).length),": "Length of an Association call",
  "list-functional.ts: const first = operandsOf(ops[0])[0];": "First of an Association call",
  "list-functional.ts: const rules = operandsOf(ops[0]);": "Last of an Association call",
  "list-functional.ts: const sorted = [...operandsOf(ops[0])];": "Sort of an Association call",
  "list-functional.ts: const items = operandsOf(ops[0]);": "GeometricMean and HarmonicMean are typed collection<any>",
  "list-heads.ts: operandsOf(ops[0]).length > 0 &&": "Sort(strings): guarded by operator === List",
  "list-heads.ts: (operandsOf(ops[0]).every((element) => stringAt(element) !== undefined) ||":
    "Sort(strings): guarded by operator === List",
  "list-heads.ts: (operandsOf(ops[0]).some(isText) &&": "Sort(strings): guarded by operator === List",
  "list-heads.ts: operandsOf(ops[0]).every((element) => isText(element) || isNumber(element)))),":
    "Sort(strings): guarded by operator === List",
  "list-heads.ts: const sorted = [...operandsOf(ops[0])];": "Sort(strings): guarded by operator === List",
  "list-stats.ts: operandsOf(ops[0]).length > 0 &&": "symbolic Mean and Median: guarded by operator === List",
  'list-stats.ts: (ops) => ops[0]?.operator === "List" && !operandsOf(ops[0]).every(isNumberLiteral),':
    "Mean of a matrix of numbers: same line checks operator === List",
  "list-stats.ts: !operandsOf(ops[0]).every(isNumberLiteral),": "symbolic Mean: guarded by operator === List",
  "list-stats.ts: () => (ops) => symbolicMean(ce, operandsOf(ops[0])),": "symbolic Mean: guarded by operator === List",
  "list-stats.ts: !operandsOf(ops[0]).every(isNumberLiteral) &&": "symbolic Median: guarded by operator === List",
  "list-stats.ts: operandsOf(ops[0]).every((x) => x.isNumber === true),":
    "symbolic Median: guarded by operator === List",
  "list-stats.ts: const sorted = [...operandsOf(ops[0])];": "symbolic Median: guarded by operator === List",
  "list-ops-wolfram.ts: const indexed = operandsOf(ops[0]).map((item, index) => ({ item, index }));":
    "Sort(list, test): guarded by operator === List",
  "call-forms.ts: const items = operandsOf(ops[0]);": "Tuples(list, k): guarded by operator === List",
  "expression-ops.ts: [keysExpr, valuesExpr] = operandsOf(ops[0]);": "AssociationThread(keys -> values): a Rule call",
  "graphs-2.ts: const vertices = hasVertices ? operandsOf(ops[0]) : undefined;":
    "AdjacencyGraph: hasVertices checks both operands are Lists",
};

test("no collection handler reads the first operand's operands except through partsOf", () => {
  const found = hits(sources(COLLECTIONS), /\boperandsOf\(ops\[0\]\)|\bops\[0\]\.ops\b/);
  const allowed = Object.keys(ALLOWED).map((key) => `/${key}`);
  expect(found.filter((hit) => !allowed.some((key) => hit.endsWith(key)))).toEqual([]);
  // A stale entry would let a future read through.
  expect(allowed.filter((key) => !found.some((hit) => hit.endsWith(key)))).toEqual([]);
});

// Heads that match or rewrite an expression's tree as written stay outside partsOf, on the condition that
// none answers at canonicalization: a lambda body is never rewritten before its parameters are bound. They
// answer at evaluate, on evaluated operands. `parts-readers.test.ts` holds each against the lambda shapes.
const TREE_HEADS: Record<string, string> = {
  FreeQ: "matches the tree as written, at evaluate only",
  MatchQ: "matches the tree as written, at evaluate only",
  ReplaceAll: "rewrites the tree as written, at evaluate only",
  Same: "compares evaluated operands, at evaluate only",
};

test("the tree-literal heads answer at evaluate, never at canonicalization", () => {
  const source = readFileSync(join(COLLECTIONS, "expression-ops.ts"), "utf8");
  expect(source).not.toMatch(/\.canonical\s*=|\bcanonical\s*:\s*\(/);
  for (const head of Object.keys(TREE_HEADS)) expect(source).toContain(`"${head}"`);
});
