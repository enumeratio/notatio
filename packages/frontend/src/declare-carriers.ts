import type { ComputeEngine } from "@cortex-js/compute-engine";
import { declareCarriers } from "@notatio/structures";
import { FRONTEND_CARRIERS } from "./carrier-data.ts";

export { FRONTEND_CARRIERS };

/** This package's own carrier (`GlyphKind`) — see carrier-data.ts. Not part of
 *  `@notatio/frontend`'s usual per-symbol declarations, since nothing here computes with
 *  it yet; a host assembling every library it ships calls this alongside the rest. Type,
 *  constructor, plural type-space name and `Element` membership, all in one call. It needs
 *  structures, which is why the frontend extends it; its plots import analytic's kernels and
 *  shaders, which a call that draws one brings on its own. */
export function declareFrontendCarriers(ce: ComputeEngine): void {
  declareCarriers(ce, FRONTEND_CARRIERS);
}
