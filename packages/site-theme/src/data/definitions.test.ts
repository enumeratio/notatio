// Every statistic and Epsil family shows a definition on its page, and what the page prints is
// Epsil you can type back: it reads as the very expression the implementation runs.

import { ComputeEngine } from "@cortex-js/compute-engine";
import { ALL_STATISTICS } from "@enumeratio/combinatorics";
import { allFamilies } from "@enumeratio/combinatorics/collections";
import { parseExpression } from "@enumeratio/formats";
import { expect, test } from "vite-plus/test";
import { applied, definitionsOf, isEpsilFamily, statisticDefinition } from "./definitions.ts";

const ce = new ComputeEngine();
// Definitions are full Epsil, so the statement heads (`If`, `Function`, …) are allowed.
const allow = ["Assign", "Block", "Declare", "Do", "Function", "If", "Loop", "Which", "While"];
const canonical = (json: unknown): unknown => ce.box(json as Parameters<ComputeEngine["box"]>[0]).json;

// Where a definition has broken read-back: the statement heads, a head that is itself an expression
// (printed as `Apply`) and options (`Rule`, `KeyValuePair`).
const SHAPES = new Set([...allow, "Apply", "Rule", "KeyValuePair"]);
const shapesOf = (expr: unknown, found = new Set<string>()): Set<string> => {
  if (!Array.isArray(expr)) return found;
  const [head, ...operands] = expr;
  if (typeof head !== "string") found.add("Apply");
  else if (SHAPES.has(head)) found.add(head);
  for (const operand of typeof head === "string" ? operands : expr) shapesOf(operand, found);
  return found;
};

// The standard run takes, in table order, the first statistic of each carrier and the first of each
// shape on each carrier, so every carrier and shape stays covered as statistics are added, and then
// every `STRIDE`th one for spread. `DEEP_TESTS=1` reads back every statistic.
const deep = process.env.DEEP_TESTS === "1";
const STRIDE = 25;
const FAMILY_STRIDE = 6;
function sampled(): typeof ALL_STATISTICS {
  if (deep) return ALL_STATISTICS;
  const seen = new Set<string>();
  return ALL_STATISTICS.filter(({ on, expr }, index) => {
    const fresh = [on, ...[...shapesOf(expr)].map((shape) => `${on}:${shape}`)].filter((key) => !seen.has(key));
    for (const key of fresh) seen.add(key);
    return fresh.length > 0 || index % STRIDE === 0;
  });
}

test(
  "every statistic prints a non-empty definition that reads back as its expression",
  () => {
    for (const { head, on, expr } of sampled()) {
      // The whole table goes through the page's own lookup; the sample prints just its own.
      const shown = deep
        ? definitionsOf(head).find((d) => d.label.startsWith(`on ${on},`))
        : statisticDefinition({ on, expr });
      expect(shown?.source.length, `${head} on ${on}`).toBeGreaterThan(0);
      const { json, errors } = parseExpression(shown!.source, { ce, allow });
      expect(errors, `${head} on ${on}: ${shown!.source}`).toEqual([]);
      expect(canonical(json), `${head} on ${on}`).toEqual(canonical(applied(expr)));
    }
  },
  deep ? 600_000 : 30_000, // the full table grows with the statistic count; the sample does not
);

test(
  "every Epsil family prints each of its definitions",
  () => {
    // The standard run takes every `FAMILY_STRIDE`th family and the first to define each operation.
    const operations = new Set<string>();
    const families = allFamilies.filter(isEpsilFamily).filter((family, index) => {
      const fresh = Object.keys(family.epsil).filter((operation) => !operations.has(operation));
      for (const operation of fresh) operations.add(operation);
      return deep || fresh.length > 0 || index % FAMILY_STRIDE === 0;
    });
    for (const family of families) {
      const defined = Object.values(family.epsil).filter((e) => e !== undefined).length;
      const shown = definitionsOf(family.head).filter((d) => /^(count|unrank|rank|valid|tables)\(/.test(d.label));
      expect(shown.length, family.head).toBeGreaterThanOrEqual(defined);
      for (const { source } of shown) {
        expect(source.length, family.head).toBeGreaterThan(0);
        expect(parseExpression(source, { ce, allow }).errors, `${family.head}: ${source}`).toEqual([]);
      }
    }
  },
  deep ? 120_000 : undefined, // every family prints and parses in the deep run
);
