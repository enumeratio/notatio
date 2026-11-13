import { box, type Json } from "@notatio/engine";
import { createEngine } from "@notatio/engine/testing";
import { declareNumberTheory } from "@notatio/number-theory";
import { declareNumerals } from "@notatio/numerals";
import { declareResidues } from "@notatio/residues";
import { describe, expect, test } from "vite-plus/test";
import { declareAdeles } from "../src/declare.ts";
import golden from "./adeles.golden.json" with { type: "json" };

// Every case is pinned against Hertogh's Sage `adeles` (scripts/collect-golden.py).

const ce = createEngine(declareResidues, declareNumerals, declareNumberTheory, declareAdeles);

const run = (expr: unknown): unknown => box(ce, expr as Json).evaluate().json;

describe.each(Object.entries(golden))("%s", (_family, cases) => {
  test.each(cases.map((c, i) => [i, c] as const))("case %i", (_i, { input, expected }) => {
    expect(run(input)).toEqual(expected);
  });
});
