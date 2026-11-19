// Posets' own declare.
import { defineMessages, emit, type Engine, type Expr, integerAt, operandsOf } from "@notatio/engine";
import { declareCarriers } from "@notatio/structures";
import { declareFamilies } from "../../collections/src/families/declare.ts";
import { liftFamily } from "../../collections/src/families/epsil.ts";
import { declareStatistics } from "../../src/statistics/declare.ts";
import { canonicalCode, isReduced, MAX_CODED, type Poset } from "./canonical.ts";
import { POSETS_CARRIERS } from "./carrier-data.ts";
import { coreEntries } from "./families/index.ts";
import { POSET_AREA_STATISTICS } from "./statistics.lattices.ts";

/** The lower covers a `Poset(...)` call holds, or undefined for anything that is no such value. */
function posetOf(expr: Expr): Poset | undefined {
  const list = expr.operator === "Poset" ? operandsOf(expr)[0] : undefined;
  if (list === undefined || list.operator !== "List") return undefined;
  const rows = operandsOf(list).map((row) => (row.operator === "List" ? operandsOf(row).map(integerAt) : undefined));
  const value = rows.map((row) => (row?.every((entry) => entry !== undefined) === true ? row : undefined));
  return value.every((row) => row !== undefined) && isReduced(value) ? (value as number[][]) : undefined;
}

export function declarePosetsArea(ce: Engine): void {
  declareCarriers(ce, POSETS_CARRIERS, { plurals: false });
  declareFamilies(ce, coreEntries.map(liftFamily));
  // Its statistics, after its own carriers and families.
  declareStatistics(ce, POSET_AREA_STATISTICS);

  defineMessages(ce, "IsIsomorphicPoset", {
    toobig: "posets of more than `1` elements are not tested; the call stays unevaluated.",
  });
  ce.declare("IsIsomorphicPoset", {
    signature: "(poset, poset) -> boolean",
    evaluate: (ops) => {
      const p = ops[0] === undefined ? undefined : posetOf(ops[0]);
      const q = ops[1] === undefined ? undefined : posetOf(ops[1]);
      if (p === undefined || q === undefined) return undefined;
      if (p.length > MAX_CODED || q.length > MAX_CODED) {
        emit(ce, "IsIsomorphicPoset", "toobig", [ce.number(MAX_CODED)]);
        return undefined;
      }
      return p.length === q.length && canonicalCode(p) === canonicalCode(q) ? ce.True : ce.False;
    },
  });
}
