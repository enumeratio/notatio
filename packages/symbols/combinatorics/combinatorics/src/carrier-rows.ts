// A head's row for a carrier whose value is not one of the head's own argument types.
//
// A carrier's values have their own type (`word`, `set_partition`), which is not `list` or `value`, so
// a head typed on the list or the permutation refuses them before it runs. The carrier's table
// (`CombinatorialStat`, `CombinatorialMap`) already holds the answer; this puts it in the head's own
// overload table as a typed row, `(carrier) -> result`, so the bare head and the table agree on every
// route. The head's own signature is not widened: that would let the carrier's type leak into every
// definition that calls the head on an untyped value.

import { defineOverload, overloadTable, type Engine } from "@notatio/engine";
import { carrierTypeForName } from "@notatio/structures";

export interface TableRow {
  /** The head the row joins (`Descents`, `Shape`). */
  readonly head: string;
  /** The carrier's constructor head (`Word`), whose type the row accepts. */
  readonly carrier: string;
  /** Which table answers: statistics or maps. */
  readonly via: "CombinatorialStat" | "CombinatorialMap";
  /** The operation's name in that carrier's table (a map may go by another name than the head). */
  readonly name: string;
  /** What the row returns, as a type: `integer` for a statistic, the target's type for a map. */
  readonly returns: string;
}

/** Add `row` to its head's table. Idempotent, and false when the head or the carrier's type is unknown. */
export function declareTableRow(ce: Engine, { head, carrier, via, name, returns }: TableRow): boolean {
  const type = carrierTypeForName(ce, carrier);
  if (type === undefined) return false;
  const signature = `(${type}) -> ${returns}`;
  // Two identical rows join into a signature that binds a type parameter twice, which will not parse.
  if (overloadTable(ce, head)?.rows.some((r) => r.package === "combinatorics" && r.signature === signature))
    return true;
  return defineOverload(ce, head, {
    package: "combinatorics",
    signature,
    arity: 1,
    // By the operand's head, which costs a string compare; a type test on a hot head (`Descents`) costs a millisecond.
    on: [carrier],
    evaluate: ([subject]) => {
      if (subject === undefined) return undefined;
      const answer = ce.function(via, [subject, ce.string(name)]).evaluate();
      // An operation the table lacks leaves the call as it was.
      return answer.operator === via ? undefined : answer;
    },
  });
}
