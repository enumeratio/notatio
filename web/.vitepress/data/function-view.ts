// A head's function view for its reference page, from the manifest's typed signature and the
// record's `plot:` hint. Build time (Node): the page carries the small result, not the manifest.

import { functionViewOfSymbol, type FunctionView } from "@notatio/frontend/function-view";
import { SYMBOLS } from "@notatio/manifest";

export function functionViewFor(head: string): FunctionView | undefined {
  const info = Object.hasOwn(SYMBOLS, head) ? SYMBOLS[head] : undefined;
  return info === undefined ? undefined : functionViewOfSymbol(info);
}
