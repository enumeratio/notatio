// The options every head declares, a library's included: formats' own graphics heads, and the
// rest from the manifest's records. The kernel reads an expression with this, so LaTeX's
// `Name \to v` is an option on a library's head too (`rulesInCalls`).

import { declaredOptions } from "@notatio/formats/graphics-options";
import { SYMBOLS } from "@notatio/manifest";

const sets = new Map<string, ReadonlySet<string>>();

/** The options `head` declares: its record's, in whichever package holds it. */
export function libraryOptionsOf(head: string): ReadonlySet<string> {
  let set = sets.get(head);
  if (set !== undefined) return set;
  const recorded = Object.hasOwn(SYMBOLS, head) ? (SYMBOLS[head]!.options ?? []) : [];
  const own = declaredOptions(head);
  set = recorded.length === 0 ? own : new Set([...own, ...recorded]);
  sets.set(head, set);
  return set;
}
