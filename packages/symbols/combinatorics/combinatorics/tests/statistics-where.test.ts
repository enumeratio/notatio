// A definition's `where` is its domain: in it the call has the definition's value, off it the call stays,
// through the head, the table and `extendHead`'s widened head, with compiled code present and absent.

import { compileTyped, definitionHash } from "@notatio/engine/compiled";
import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declarePartitions } from "../partitions/src/declare.ts";
import { declarePermutations } from "../permutations/src/declare.ts";
import { type Engine } from "@notatio/engine";
import { applyDefinition, declareStatistics, inDomain } from "../src/statistics/declare.ts";
import { COMPILED, compiledStatistic } from "../src/statistics/compiled.ts";
import type { Verdicts } from "../src/statistics/generate-compiled.ts";
import { compiledDefinitionsInDomains } from "../src/statistics/generate-domain.ts";
import { type Definition, signatureOf, whereSignatureOf } from "../src/statistics/types.ts";

const list = (...items: number[]): unknown => ["List", ...items];
const IN = ["Permutation", list(1, 3, 2)];
const OFF = ["Permutation", list(3, 1, 2)];

/** A probe on permutations, in the domain when the first entry is below 3. `salt` makes the hashes its own, so the
 *  pure cache (keyed by hash and subject) never answers for another probe. */
const probe = (head: string, salt: number, where?: Definition["where"]): Definition => ({
  head,
  on: "Permutation",
  expr: ["Add", ["Length", "_x"], salt],
  summary: "A probe.",
  where: where ?? ["And", ["Less", ["At", "_x", 1], 3], ["Greater", salt, -1]],
});

/** Put the probe's code in the compiled table, as a build would. */
function compileProbe(definition: Definition): () => void {
  const ce = bareEngine();
  const keys: string[] = [];
  for (const [key, expression] of [
    [signatureOf(definition), definition.expr],
    [whereSignatureOf(definition), definition.where],
  ] as const) {
    const code = compileTyped(ce, expression, { _x: "list<integer>" });
    expect(code, key).toBeDefined();
    COMPILED[key] = { hash: definitionHash(expression), run: (_sys, vars) => code!.run(vars) };
    keys.push(key);
  }
  return () => keys.forEach((key) => delete COMPILED[key]);
}

function engineWith(...definitions: Definition[]): Engine {
  const ce = bareEngine();
  declarePermutations(ce);
  declareStatistics(ce, definitions);
  return ce;
}

const call = (ce: Engine, json: unknown) => ce.box(json as never);
const stays = (result: { operator: string | undefined; json: unknown }, head: string) => {
  expect(result.operator).toBe(head);
  expect(JSON.stringify(result.json)).toContain("Permutation");
};

for (const compiled of [false, true]) {
  const mode = compiled ? "compiled" : "interpreted";

  test(`${mode}: in the domain the head has the definition's value, off it the call stays`, () => {
    const definition = probe(compiled ? "ProbeDomainCompiled" : "ProbeDomainInterpreted", compiled ? 2 : 1);
    const undo = compiled ? compileProbe(definition) : () => {};
    try {
      const ce = engineWith(definition);
      expect(compiledStatistic(ce, definition, "where") !== undefined).toBe(compiled);
      expect(compiledStatistic(ce, definition) !== undefined).toBe(compiled);
      const value = 3 + (compiled ? 2 : 1);
      expect(call(ce, [definition.head, IN]).evaluate().json).toBe(value);
      expect(call(ce, [definition.head, IN]).N().json).toBe(value);
      stays(call(ce, [definition.head, OFF]).evaluate(), definition.head);
      stays(call(ce, [definition.head, OFF]).N(), definition.head);
    } finally {
      undo();
    }
  });

  test(`${mode}: the table operation leaves its call off the domain`, () => {
    const definition = probe(compiled ? "ProbeTableCompiled" : "ProbeTableInterpreted", compiled ? 4 : 3);
    const undo = compiled ? compileProbe(definition) : () => {};
    try {
      const ce = engineWith(definition);
      const stat = (subject: unknown) => call(ce, ["CombinatorialStat", subject, `'${definition.head}'`]).evaluate();
      expect(stat(IN).json).toBe(3 + (compiled ? 4 : 3));
      const off = stat(OFF);
      expect(off.operator).toBe("CombinatorialStat");
      expect(typeof off.json).not.toBe("number");
    } finally {
      undo();
    }
  });
}

test("a head another carrier owns, widened by extendHead, leaves its call off the domain", () => {
  const owner = probe("ProbeShared", 5);
  const widened: Definition = {
    head: "ProbeShared",
    on: "IntegerPartition",
    expr: ["Add", ["Length", "_x"], 6],
    summary: "A probe.",
    where: ["Less", ["At", "_x", 1], 3],
  };
  const ce = bareEngine();
  declarePermutations(ce);
  declarePartitions(ce);
  declareStatistics(ce, [owner]);
  declareStatistics(ce, [widened]);
  expect(call(ce, ["ProbeShared", ["IntegerPartition", list(2, 1)]]).evaluate().json).toBe(8);
  const off = call(ce, ["ProbeShared", ["IntegerPartition", list(4, 1)]]).evaluate();
  expect(off.operator).toBe("ProbeShared");
  expect(JSON.stringify(off.json)).toContain("IntegerPartition");
  expect(call(ce, ["ProbeShared", IN]).evaluate().json).toBe(8);
});

test("a where that is not a boolean, or does not evaluate, leaves the call", () => {
  const cases: [string, Definition["where"]][] = [
    ["ProbeWhereNumber", ["Length", "_x"]],
    ["ProbeWhereUnevaluated", ["Less", ["At", "_x", 1], "Unbound"]],
    ["ProbeWhereError", ["Less", ["At", "_x", 99], 3]],
  ];
  cases.forEach(([head, where], i) => {
    const definition = probe(head, 10 + i, where);
    const ce = engineWith(definition);
    expect(inDomain(ce, definition, call(ce, list(1, 3, 2))), head).toBe(false);
    stays(call(ce, [head, IN]).evaluate(), head);
  });
});

test("without a where, every subject is in the domain, and applyDefinition is the value of expr", () => {
  const definition: Definition = { ...probe("ProbeNoWhere", 20), where: undefined };
  const ce = engineWith(definition);
  expect(inDomain(ce, definition, call(ce, list(3, 1, 2)))).toBe(true);
  expect(call(ce, [definition.head, OFF]).evaluate().json).toBe(23);
  expect(applyDefinition(ce, probe("ProbeApply", 21), call(ce, list(3, 1, 2))).json).toBe(24);
});

/** Each verdict's source, by label, and whether its check ran. */
function recorder(): { verdicts: Verdicts; sources: Map<string, any> } {
  const sources = new Map<string, any>();
  return {
    sources,
    verdicts: {
      sourceOnly: false,
      remember: (_parts, source, compute, label) => {
        sources.set(label, source);
        return compute();
      },
      note: () => {},
    },
  };
}

test("the compile cross-check takes no subject off the domain, and its source names the where", () => {
  const definition = probe("ProbeCheck", 30);
  const plain: Definition = { ...probe("ProbePlain", 31), where: undefined };
  const subjects = [list(1, 2, 3), list(3, 1, 2), list(2, 1), list(4)];
  const { verdicts, sources } = recorder();
  const { compiled, disagreed } = compiledDefinitionsInDomains(
    [definition, plain],
    "list<integer>",
    () => subjects,
    verdicts,
    () => true,
  );
  expect(disagreed).toEqual([]);
  expect(sources.get(signatureOf(definition)).subjects).toEqual([list(1, 2, 3), list(2, 1)]);
  expect(sources.get(signatureOf(definition)).where).toEqual(definition.where);
  expect(compiled.map((entry) => entry.signature).toSorted()).toEqual(
    [signatureOf(definition), signatureOf(plain)].toSorted(),
  );
  // A definition without a where keeps the source it had: three keys, in this order.
  expect(Object.keys(sources.get(signatureOf(plain)))).toEqual(["expr", "flat", "subjects"]);
  expect(sources.get(signatureOf(plain)).subjects).toEqual(subjects);
});
